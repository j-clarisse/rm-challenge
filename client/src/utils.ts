import {
    FacilityParam,
    type CommencedRange,
    type ExpectedClosureRange,
    type Facility,
    type FacilityFilters,
    type FacilityUnit,
    type FilterOption,
    type FueltechOption,
    type SortBy
} from './types';

export const STATUS_OPTIONS: FilterOption[] = [
    {value: "committed", label: "Committed"},
    {value: "operating", label: "Operating"},
    {value: "commissioning", label: "Commissioning"},
    {value: "retired", label: "Retired"}
];

// From https://docs.openelectricity.org.au/guides/fueltechs/#fueltechs
export const FUELTECH_OPTIONS: FueltechOption[] = [
    {value: "battery_charging", label: "Battery (Charging)", renewable: false},
    {value: "battery_discharging", label: "Battery (Discharging)", renewable: false},
    {value: "bioenergy_biogas", label: "Biogas", renewable: true},
    {value: "bioenergy_biomass", label: "Biomass", renewable: true},
    {value: "coal_black", label: "Coal (Black)", renewable: false},
    {value: "coal_brown", label: "Coal (Brown)", renewable: false},
    {value: "distillate", label: "Distillate", renewable: false},
    {value: "gas_ccgt", label: "Gas (CCGT)", renewable: false},
    {value: "gas_ocgt", label: "Gas (OCGT)", renewable: false},
    {value: "gas_recip", label: "Gas (Reciprocating)", renewable: false},
    {value: "gas_steam", label: "Gas (Steam)", renewable: false},
    {value: "gas_wcmg", label: "Gas (Coal Mine Waste)", renewable: false},
    {value: "hydro", label: "Hydro", renewable: true},
    {value: "pumps", label: "Pumps", renewable: false},
    {value: "solar_rooftop", label: "Solar (Rooftop)", renewable: true},
    {value: "solar_thermal", label: "Solar (Thermal)", renewable: true},
    {value: "solar_utility", label: "Solar (Utility)", renewable: true},
    {value: "wind", label: "Wind", renewable: true},
    {value: "wind_offshore", label: "Offshore Wind", renewable: true},
    {value: "aggregator_vpp", label: "Aggregator (VPP)", renewable: true},
    {value: "aggregator_dr", label: "Aggregator (DR)", renewable: true},
    {value: "nuclear", label: "Nuclear", renewable: false},
    {value: "imports", label: "Network Import", renewable: false},
    {value: "exports", label: "Network Export", renewable: false},
    {value: "interconnector", label: "Interconnector", renewable: false},
    {value: "battery", label: "Battery", renewable: false}
];

// Test: renewable + non-renewable ids cover all FUELTECH_OPTIONS with no overlap;
//       renewable list matches the 10 renewable fueltechs in the docs table.
export const RENEWABLE_FUELTECH_IDS = FUELTECH_OPTIONS.filter((option) => option.renewable).map((option) => option.value);
export const NON_RENEWABLE_FUELTECH_IDS = FUELTECH_OPTIONS.filter((option) => !option.renewable).map((option) => option.value);

// Grouped for the Fuel tech MultiSelect dropdown
export const FUELTECH_GROUPED_OPTIONS = [
    {group: "Renewable", items: FUELTECH_OPTIONS.filter((option) => option.renewable)},
    {group: "Non-renewable", items: FUELTECH_OPTIONS.filter((option) => !option.renewable)}
];

export const NETWORK_REGION_OPTIONS: FilterOption[] = [
    {value: "NSW1", label: "NSW"},
    {value: "QLD1", label: "QLD"},
    {value: "SA1", label: "SA"},
    {value: "TAS1", label: "TAS"},
    {value: "VIC1", label: "VIC"},
    {value: "WEM", label: "WA"}
];

export const STATUS_COLOURS: Record<string, string> = {
    operating: "green",
    commissioning: "yellow",
    committed: "blue",
    retired: "gray"
};

export const SORT_OPTIONS: FilterOption[] = [
    {value: "status", label: "Status"},
    {value: "commencement", label: "Commencement date"},
    {value: "closure", label: "Closure date"},
    {value: "expectedClosure", label: "Expected closure date"}
];

export const COMMENCED_OPTIONS: FilterOption[] = [
    {value: "lastMonth", label: "Last month"},
    {value: "lastQuarter", label: "Last quarter"},
    {value: "lastYear", label: "Last year"}
];

export const EXPECTED_CLOSURE_OPTIONS: FilterOption[] = [
    {value: "noDate", label: "No date"},
    {value: "nextMonth", label: "Next month"},
    {value: "nextQuarter", label: "Next quarter"},
    {value: "nextYear", label: "Next year"}
];

// Month offset from today for each date range (negative = looking back)
const RANGE_MONTHS: Record<Exclude<CommencedRange | ExpectedClosureRange, "noDate">, number> = {
    lastMonth: -1,
    lastQuarter: -3,
    lastYear: -12,
    nextMonth: 1,
    nextQuarter: 3,
    nextYear: 12
};

// Lifecycle order used by the Status sort
const STATUS_ORDER = ["operating", "commissioning", "committed", "retired"];

// Returns the value if it's one of the options, else null
function parseOption<T extends string>(value: string | null, options: FilterOption[]): T | null {
    return options.some((option) => option.value === value) ? value as T : null;
}

// Expects a UTC-midnight Date (as built by Date.UTC)
function toIsoDay(date: Date): string {
    return date.toISOString().slice(0, 10);
}

// Today's local calendar date; toISOString alone would give the UTC date (yesterday in AU mornings)
function todayIsoDay(): string {
    const now = new Date();
    return toIsoDay(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

function shiftMonths(isoDay: string, months: number): string {
    const [year, month, day] = isoDay.split("-").map(Number);
    return toIsoDay(new Date(Date.UTC(year, month - 1 + months, day)));
}

// Whether a date falls in the rolling window between today and `months` from today (inclusive).
// Negative months look back, positive months look ahead.
// Test: last month includes today and the date 1 month ago, excludes the day before;
//       next year includes today..+12 months; missing value -> false; future date excluded from "last".
export function withinMonths(value: string | null | undefined, months: number, today = todayIsoDay()): boolean {
    if (!value) {
        return false;
    }
    const day = value.slice(0, 10);
    const edge = shiftMonths(today, months);
    return months < 0 ? edge <= day && day <= today : today <= day && day <= edge;
}

// Test: known value -> label (VIC1 -> "VIC", coal_black -> "Coal (Black)"); unknown value -> returned as-is.
export function getLabel(options: FilterOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {day: "numeric", month: "short", year: "numeric", timeZone: "UTC"});

// Formats an API date ("2005-01-06T00:00:00+10:00") as "6 Jan 2005", using only the
// YYYY-MM-DD part so the timezone offset can't shift the day.
// Test: normal date; null/undefined -> "—"; "+08:00" date keeps its calendar day.
export function formatDate(date: string | null | undefined): string {
    if (!date) {
        return "—";
    }
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);
    return DATE_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
}

// Test: integer -> "30 MW"; decimal rounded to 1 dp (7.76 -> "7.8 MW"); null/undefined -> "—".
export function formatCapacity(mw: number | null | undefined): string {
    if (mw == null) {
        return "—";
    }
    return `${mw.toLocaleString("en-AU", {maximumFractionDigits: 1})} MW`;
}

// Rolls unit details up to facility level for the card summary.
// Test: statuses/fuel techs de-duplicated in first-seen order; earliest date chosen;
//       no dates -> earliestCommencement null.
export function summariseUnits(units: FacilityUnit[]) {
    const dates = units
        .map((unit) => unit.commencement_date)
        .filter((date): date is string => Boolean(date))
        .sort();
    return {
        statusIds: [...new Set(units.map((unit) => unit.status_id))],
        fueltechIds: [...new Set(units.map((unit) => unit.fueltech_id))],
        earliestCommencement: dates[0] ?? null
    };
}

// Accepts both repeated params (?a=x&a=y) and comma lists (?a=x,y).
// Test: [] -> []; repeated values; comma list; repeated + comma combined;
//       whitespace and empty segments ("a,,b ") -> ["a", "b"].
export function parseParams(values: string[]): string[] {
    return values
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
}

// Reads facility filters from a URL query string (e.g. window.location.search).
// Test: "" -> empty filters, single-value fields null; repeated params; comma lists; unknown params
//       ignored; unknown sort/commenced/expected_closure values -> null.
export function getFiltersFromSearch(search: string): FacilityFilters {
    const params = new URLSearchParams(search);
    return {
        statusIds: parseParams(params.getAll(FacilityParam.STATUS_ID)),
        fueltechIds: parseParams(params.getAll(FacilityParam.FUELTECH_ID)),
        networkRegions: parseParams(params.getAll(FacilityParam.NETWORK_REGION)),
        commenced: parseOption(params.get(FacilityParam.COMMENCED), COMMENCED_OPTIONS),
        expectedClosure: parseOption(params.get(FacilityParam.EXPECTED_CLOSURE), EXPECTED_CLOSURE_OPTIONS),
        sortBy: parseOption(params.get(FacilityParam.SORT), SORT_OPTIONS)
    };
}

// Inverse of getFiltersFromSearch, used to keep the address bar in sync with the filters.
// Test: empty filters -> ""; all params included, list values repeated; null fields omitted;
//       round trip getFiltersFromSearch(buildSearchFromFilters(f)) deep-equals f.
export function buildSearchFromFilters(filters: FacilityFilters): string {
    const {statusIds, fueltechIds, networkRegions, commenced, expectedClosure, sortBy} = filters;
    const params = new URLSearchParams();
    statusIds.forEach((value) => params.append(FacilityParam.STATUS_ID, value));
    fueltechIds.forEach((value) => params.append(FacilityParam.FUELTECH_ID, value));
    networkRegions.forEach((value) => params.append(FacilityParam.NETWORK_REGION, value));
    if (commenced) {
        params.set(FacilityParam.COMMENCED, commenced);
    }
    if (expectedClosure) {
        params.set(FacilityParam.EXPECTED_CLOSURE, expectedClosure);
    }
    if (sortBy) {
        params.set(FacilityParam.SORT, sortBy);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
}

function unitMatches(unit: FacilityUnit, filters: FacilityFilters): boolean {
    const {statusIds, fueltechIds, commenced, expectedClosure} = filters;
    return (statusIds.length === 0 || statusIds.includes(unit.status_id)) &&
        (fueltechIds.length === 0 || fueltechIds.includes(unit.fueltech_id)) &&
        (!commenced || withinMonths(unit.commencement_date, RANGE_MONTHS[commenced])) &&
        (!expectedClosure || (expectedClosure === "noDate"
            ? !unit.expected_closure_date
            : withinMonths(unit.expected_closure_date, RANGE_MONTHS[expectedClosure])));
}

// Region matches at facility level; status, fuel tech and dates must all match on the same unit.
// Units are trimmed to the matching ones (mirrors how the Open Electricity API filters).
// Test: no filters -> all facilities and all units; region only; status only; fuel tech only;
//       status + fuel tech on different units -> excluded; returned units are only matching ones;
//       date filters trim units like status and fuel tech; facility with no units excluded once a
//       unit filter is set.
export function filterFacilities(facilities: Facility[], filters: FacilityFilters): Facility[] {
    const {statusIds, fueltechIds, networkRegions, commenced, expectedClosure} = filters;
    const hasUnitFilter = statusIds.length > 0 || fueltechIds.length > 0 || Boolean(commenced || expectedClosure);

    return facilities.flatMap((facility) => {
        if (networkRegions.length > 0 && !networkRegions.includes(facility.network_region)) {
            return [];
        }
        if (!hasUnitFilter) {
            return [facility];
        }
        const units = facility.units.filter((unit) => unitMatches(unit, filters));
        return units.length > 0 ? [{...facility, units}] : [];
    });
}

type UnitDateField = "commencement_date" | "closure_date" | "expected_closure_date";

// Earliest or latest non-null value of a unit date field (ISO strings compare chronologically).
function pickDate(units: FacilityUnit[], field: UnitDateField, pick: "earliest" | "latest"): string | null {
    const dates = units
        .map((unit) => unit[field])
        .filter((date): date is string => Boolean(date))
        .sort();
    return (pick === "earliest" ? dates[0] : dates[dates.length - 1]) ?? null;
}

// Null dates always sort last regardless of direction
function compareDates(a: string | null, b: string | null, direction: "asc" | "desc"): number {
    if (a === b) {
        return 0;
    }
    if (!a) {
        return 1;
    }
    if (!b) {
        return -1;
    }
    return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

// Status: by the facility's most active unit status (lifecycle order).
// Commencement: earliest commencement, newest first. Closure: latest closure, newest first.
// Expected closure: earliest expected closure, soonest first. Ties broken by name.
// Test: null sortBy -> same order; each mode orders correctly; mixed-status facility ranks by
//       its most active status; null dates last in both directions; ties broken by name;
//       input array not mutated.
export function sortFacilities(facilities: Facility[], sortBy: SortBy | null): Facility[] {
    if (!sortBy) {
        return facilities;
    }
    const keyed = facilities.map((facility) => ({
        facility,
        statusRank: Math.min(...facility.units.map((unit) => {
            const index = STATUS_ORDER.indexOf(unit.status_id);
            return index === -1 ? STATUS_ORDER.length : index;
        })),
        commencement: pickDate(facility.units, "commencement_date", "earliest"),
        closure: pickDate(facility.units, "closure_date", "latest"),
        expectedClosure: pickDate(facility.units, "expected_closure_date", "earliest")
    }));

    const compare = (a: typeof keyed[number], b: typeof keyed[number]): number => {
        switch (sortBy) {
            case "status":
                return a.statusRank - b.statusRank;
            case "commencement":
                return compareDates(a.commencement, b.commencement, "desc");
            case "closure":
                return compareDates(a.closure, b.closure, "desc");
            case "expectedClosure":
                return compareDates(a.expectedClosure, b.expectedClosure, "asc");
        }
    };

    keyed.sort((a, b) => compare(a, b) || a.facility.name.localeCompare(b.facility.name));

    return keyed.map(({facility}) => facility);
}

// Test: page 1 -> first `size` items; last page returns the remainder; page past the end -> [];
//       empty list -> [].
export function paginate<T>(items: T[], page: number, size: number): T[] {
    return items.slice((page - 1) * size, page * size);
}
