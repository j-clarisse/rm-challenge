import {describe, expect, it} from 'vitest';
import type {FacilityFilters} from '../types';
import {buildSearchFromFilters, getFiltersFromSearch, parseParams} from '../utils';

const emptyFilters: FacilityFilters = {
    statusIds: [],
    fueltechIds: [],
    networkRegions: [],
    commenced: null,
    expectedClosure: null,
    expectedOperation: null,
    sortBy: null
};

describe("parseParams", () => {
    it("splits comma lists, trims whitespace and drops empty segments", () => {
        expect(parseParams(["a,,b ", " c"])).toEqual(["a", "b", "c"]);
        expect(parseParams([])).toEqual([]);
    });
});

describe("getFiltersFromSearch", () => {
    it("returns empty filters for an empty search", () => {
        expect(getFiltersFromSearch("")).toEqual(emptyFilters);
    });

    it("reads repeated and comma-separated params the same way", () => {
        expect(getFiltersFromSearch("?status_id=operating&status_id=retired").statusIds).toEqual(["operating", "retired"]);
        expect(getFiltersFromSearch("?status_id=operating,retired").statusIds).toEqual(["operating", "retired"]);
        expect(getFiltersFromSearch("?fueltech_id=wind,hydro&fueltech_id=battery").fueltechIds).toEqual(["wind", "hydro", "battery"]);
    });

    it("ignores unknown option values and unknown params", () => {
        // Future options aren't valid for the past filter and vice versa
        const filters = getFiltersFromSearch("?sort=bogus&commenced=nextYear&expected_closure=lastMonth&foo=1");
        expect(filters).toEqual(emptyFilters);
    });

    it("reads valid single-value options", () => {
        const filters = getFiltersFromSearch("?commenced=lastQuarter&expected_operation=nextMonth&sort=status");
        expect(filters.commenced).toBe("lastQuarter");
        expect(filters.expectedOperation).toBe("nextMonth");
        expect(filters.sortBy).toBe("status");
    });
});

describe("buildSearchFromFilters", () => {
    it("returns an empty string when no filters are set", () => {
        expect(buildSearchFromFilters(emptyFilters)).toBe("");
    });

    it("omits null filters and repeats list values", () => {
        expect(buildSearchFromFilters({...emptyFilters, statusIds: ["operating", "retired"]}))
            .toBe("?status_id=operating&status_id=retired");
    });

    it("round-trips every filter through getFiltersFromSearch", () => {
        const filters: FacilityFilters = {
            statusIds: ["operating", "committed"],
            fueltechIds: ["wind", "solar_utility"],
            networkRegions: ["VIC1", "SA1"],
            commenced: "lastYear",
            expectedClosure: "nextQuarter",
            expectedOperation: "nextMonth",
            sortBy: "expectedClosure"
        };
        expect(getFiltersFromSearch(buildSearchFromFilters(filters))).toEqual(filters);
    });

    it("normalises comma lists to repeated params, which then round-trip", () => {
        const fromCommas = getFiltersFromSearch("?network_region=VIC1,NSW1&sort=closure");
        const search = buildSearchFromFilters(fromCommas);
        expect(search).toBe("?network_region=VIC1&network_region=NSW1&sort=closure");
        expect(getFiltersFromSearch(search)).toEqual(fromCommas);
    });
});
