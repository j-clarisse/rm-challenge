import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {Facility, FacilityFilters, FacilityUnit} from '../types';
import {filterFacilities, formatCapacity, sumCapacity, summariseUnits} from '../utils';

const emptyFilters: FacilityFilters = {
    statusIds: [],
    fueltechIds: [],
    networkRegions: [],
    commenced: null,
    expectedClosure: null,
    expectedOperation: null,
    sortBy: null
};

let unitCount = 0;

const unit = (overrides: Partial<FacilityUnit>): FacilityUnit => ({
    code: `UNIT${++unitCount}`,
    fueltech_id: "wind",
    status_id: "operating",
    ...overrides
});

const facility = (code: string, region: string, units: FacilityUnit[]): Facility => ({
    code,
    name: code,
    network_region: region,
    units
});

const codes = (facilities: Facility[]) => facilities.map((f) => f.code);

// Adelaide Desalination's real units: each battery is listed three times with the same capacity
const adelaideDesalinationUnits = () => [
    unit({fueltech_id: "battery", capacity_registered: 7.76}),
    unit({fueltech_id: "battery_discharging", capacity_registered: 7.76}),
    unit({fueltech_id: "battery_charging", capacity_registered: 7.76}),
    unit({fueltech_id: "hydro", capacity_registered: 1.44}),
    unit({fueltech_id: "solar_utility", capacity_registered: 24.75}),
    unit({fueltech_id: "solar_utility", capacity_registered: 0.2}),
    unit({fueltech_id: "solar_utility", capacity_registered: 0.02})
];

describe("filterFacilities", () => {
    // filterFacilities uses the real "today" for date ranges, so pin the clock to 19 Oct 2026
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 19));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns every facility with all its units when no filters are set", () => {
        const facilities = [
            facility("A", "VIC1", [unit({}), unit({status_id: "retired"})]),
            facility("B", "SA1", [unit({fueltech_id: "coal_black"})])
        ];
        const result = filterFacilities(facilities, emptyFilters);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(facilities[0]);
        expect(result[1]).toBe(facilities[1]);
    });

    describe("unit filters must match on the same unit", () => {
        it("status and fuel tech", () => {
            const split = facility("SPLIT", "VIC1", [
                unit({status_id: "operating", fueltech_id: "coal_black"}),
                unit({status_id: "retired", fueltech_id: "wind"})
            ]);
            const match = facility("MATCH", "VIC1", [unit({status_id: "operating", fueltech_id: "wind"})]);

            const result = filterFacilities([split, match], {...emptyFilters, statusIds: ["operating"], fueltechIds: ["wind"]});
            expect(codes(result)).toEqual(["MATCH"]);
        });

        it("status and date", () => {
            const split = facility("SPLIT", "VIC1", [
                unit({status_id: "committed", commencement_date: "2010-01-01T00:00:00+10:00"}),
                unit({status_id: "operating", commencement_date: "2026-05-01T00:00:00+10:00"})
            ]);
            const match = facility("MATCH", "VIC1", [
                unit({status_id: "committed", commencement_date: "2026-03-01T00:00:00+10:00"})
            ]);

            const result = filterFacilities([split, match], {...emptyFilters, statusIds: ["committed"], commenced: "lastYear"});
            expect(codes(result)).toEqual(["MATCH"]);
        });
    });

    describe("multiple values within a filter are alternatives", () => {
        it("status", () => {
            const facilities = [
                facility("OPERATING", "VIC1", [unit({status_id: "operating"})]),
                facility("RETIRED", "VIC1", [unit({status_id: "retired"})]),
                facility("COMMITTED", "VIC1", [unit({status_id: "committed"})])
            ];
            const result = filterFacilities(facilities, {...emptyFilters, statusIds: ["operating", "retired"]});
            expect(codes(result)).toEqual(["OPERATING", "RETIRED"]);
        });

        it("fuel tech", () => {
            const facilities = [
                facility("WIND", "VIC1", [unit({fueltech_id: "wind"})]),
                facility("SOLAR", "VIC1", [unit({fueltech_id: "solar_utility"})]),
                facility("COAL", "VIC1", [unit({fueltech_id: "coal_black"})])
            ];
            const result = filterFacilities(facilities, {...emptyFilters, fueltechIds: ["wind", "solar_utility"]});
            expect(codes(result)).toEqual(["WIND", "SOLAR"]);
        });
    });

    describe("region", () => {
        const vic = facility("VIC", "VIC1", [unit({}), unit({status_id: "retired"})]);
        const sa = facility("SA", "SA1", [unit({})]);
        const nsw = facility("NSW", "NSW1", [unit({})]);

        it("filters at facility level without trimming units", () => {
            const result = filterFacilities([vic, sa, nsw], {...emptyFilters, networkRegions: ["VIC1"]});
            expect(codes(result)).toEqual(["VIC"]);
            expect(result[0].units).toHaveLength(2);
        });

        it("treats multiple regions as alternatives", () => {
            const result = filterFacilities([vic, sa, nsw], {...emptyFilters, networkRegions: ["VIC1", "SA1"]});
            expect(codes(result)).toEqual(["VIC", "SA"]);
        });
    });

    describe("matching facilities contain only matching units", () => {
        it("trims units by status without mutating the input", () => {
            const units = [
                unit({code: "ANGAS1", status_id: "retired", fueltech_id: "distillate"}),
                unit({code: "ANGAS2", status_id: "retired", fueltech_id: "distillate"}),
                unit({code: "ANGAST1", status_id: "operating", fueltech_id: "distillate"})
            ];
            const angaston = facility("ANGASTON", "SA1", units);

            const result = filterFacilities([angaston], {...emptyFilters, statusIds: ["operating"]});
            expect(result[0].units.map((u) => u.code)).toEqual(["ANGAST1"]);
            expect(angaston.units).toHaveLength(3);
        });

        it("trims units by date and drops facilities with no dated unit", () => {
            const mixed = facility("MIXED", "VIC1", [
                unit({code: "SOON", expected_closure_date: "2027-01-01T00:00:00+10:00"}),
                unit({code: "LATER", expected_closure_date: "2040-01-01T00:00:00+10:00"}),
                unit({code: "NONE"})
            ]);
            const undated = facility("UNDATED", "VIC1", [unit({})]);

            const result = filterFacilities([mixed, undated], {...emptyFilters, expectedClosure: "nextYear"});
            expect(codes(result)).toEqual(["MIXED"]);
            expect(result[0].units.map((u) => u.code)).toEqual(["SOON"]);
        });
    });
});

describe("summariseUnits", () => {
    it("removes duplicate statuses and fuel techs, keeping first-seen order", () => {
        const summary = summariseUnits([
            unit({status_id: "operating", fueltech_id: "wind"}),
            unit({status_id: "retired", fueltech_id: "wind"}),
            unit({status_id: "operating", fueltech_id: "solar_utility"})
        ]);
        expect(summary.statusIds).toEqual(["operating", "retired"]);
        expect(summary.fueltechIds).toEqual(["wind", "solar_utility"]);
    });

    describe("earliest commencement", () => {
        it("picks the earliest date and ignores missing ones", () => {
            const summary = summariseUnits([
                unit({commencement_date: "2016-05-27T00:00:00+10:00"}),
                unit({}),
                unit({commencement_date: "2005-01-06T00:00:00+10:00"}),
                unit({commencement_date: "2010-01-01T00:00:00+10:00"})
            ]);
            expect(summary.earliestCommencement).toBe("2005-01-06T00:00:00+10:00");
        });

        it("is null when no unit has a date", () => {
            expect(summariseUnits([unit({}), unit({commencement_date: null})]).earliestCommencement).toBeNull();
        });
    });

    describe("total capacity", () => {
        it("excludes battery charging/discharging units", () => {
            // 7.76 + 1.44 + 24.75 + 0.2 + 0.02, not 49.69 with the battery counted three times
            expect(summariseUnits(adelaideDesalinationUnits()).totalCapacity).toBeCloseTo(34.17);
        });

        it("is null when only charging/discharging units have a capacity", () => {
            const summary = summariseUnits([
                unit({fueltech_id: "battery_charging", capacity_registered: 10}),
                unit({fueltech_id: "battery_discharging", capacity_registered: 10})
            ]);
            expect(summary.totalCapacity).toBeNull();
        });

        it("skips units with a null or missing capacity", () => {
            const summary = summariseUnits([
                unit({capacity_registered: 30}),
                unit({capacity_registered: null}),
                unit({}),
                unit({capacity_registered: 20})
            ]);
            expect(summary.totalCapacity).toBe(50);
        });

        it("is null when no unit has a capacity, or there are no units", () => {
            expect(summariseUnits([unit({capacity_registered: null}), unit({})]).totalCapacity).toBeNull();
            expect(summariseUnits([]).totalCapacity).toBeNull();
        });
    });
});

describe("sumCapacity", () => {
    it("sums each facility's total, applying the battery exclusion per facility", () => {
        const facilities = [
            facility("A", "SA1", [unit({capacity_registered: 30}), unit({capacity_registered: 20})]),
            facility("ADP", "SA1", adelaideDesalinationUnits())
        ];
        expect(sumCapacity(facilities)).toBeCloseTo(84.17);
    });

    it("ignores facilities without a capacity rather than counting them as 0", () => {
        const facilities = [
            facility("A", "SA1", [unit({capacity_registered: 50})]),
            facility("NONE", "SA1", [unit({})])
        ];
        expect(sumCapacity(facilities)).toBe(50);
    });

    it("is null for an empty list or when no facility has a capacity", () => {
        expect(sumCapacity([])).toBeNull();
        expect(sumCapacity([facility("NONE", "SA1", [unit({capacity_registered: null})])])).toBeNull();
    });
});

describe("formatCapacity", () => {
    it("formats whole MW, including zero", () => {
        expect(formatCapacity(30)).toBe("30 MW");
        expect(formatCapacity(0)).toBe("0 MW");
    });

    it("rounds to the nearest whole MW", () => {
        expect(formatCapacity(7.76)).toBe("8 MW");
        expect(formatCapacity(34.17)).toBe("34 MW");
    });

    it("uses thousands separators", () => {
        expect(formatCapacity(130562.97)).toBe("130,563 MW");
    });

    it("shows a dash for missing capacity", () => {
        expect(formatCapacity(null)).toBe("—");
        expect(formatCapacity(undefined)).toBe("—");
    });
});
