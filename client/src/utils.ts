import {addMonths, format, isWithinInterval, parseISO, startOfToday} from 'date-fns';
import {
    FacilityParam,
    type PastDateRangeOptions,
    type FutureDateRangeOptions,
    type Facility,
    type FacilityFilters,
    type FacilityUnit,
    type FilterOption,
    type FueltechOption,
    type SortBy
} from './types';

/** LABELS & FORMATTING HELPERS */
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

// Grouped to enable fuel tech preset selections
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

export const SORT_OPTIONS: FilterOption[] = [
    {value: "status", label: "Status"},
    {value: "commencement", label: "Commencement date"},
    {value: "closure", label: "Closure date"},
    {value: "expectedClosure", label: "Expected closure date"},
    {value: "expectedOperation", label: "Expected operation date"}
];

export const PAST_DATE_RANGE_OPTIONS: FilterOption[] = [
    {value: "lastMonth", label: "Last month"},
    {value: "lastQuarter", label: "Last quarter"},
    {value: "lastYear", label: "Last year"}
];

export const FUTURE_DATE_RANGE_OPTIONS: FilterOption[] = [
    {value: "nextMonth", label: "Next month"},
    {value: "nextQuarter", label: "Next quarter"},
    {value: "nextYear", label: "Next year"}
];

// value -> label for every option shown on cards (status, fuel tech and region values must be distinct)
const LABEL_MAP: Record<string, string> = Object.fromEntries(
    [...STATUS_OPTIONS, ...FUELTECH_OPTIONS, ...NETWORK_REGION_OPTIONS].map((option) => [option.value, option.label])
);

export function getLabel(value: string): string {
    return LABEL_MAP[value] ?? value;
}

const CAPACITY_FORMAT = new Intl.NumberFormat("en-AU", {maximumFractionDigits: 0});

export function formatCapacity(mw: number | null | undefined): string {
    return mw == null ? "—" : `${CAPACITY_FORMAT.format(mw)} MW`;
}

/** FILTERING & SORTING HELPERS */
// Accepts both repeated params (?a=x&a=y) and comma lists (?a=x,y).
export function parseParams(values: string[]): string[] {
    return values
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
}

// Returns the value if it's one of the options, else null
function parseOption<T extends string>(value: string | null, options: FilterOption[]): T | null {
    return options.some((option) => option.value === value) ? value as T : null;
}

// Reads facility filters from a URL query string (e.g. window.location.search).
export function getFiltersFromSearch(search: string): FacilityFilters {
    const params = new URLSearchParams(search);
    return {
        statusIds: parseParams(params.getAll(FacilityParam.STATUS_ID)),
        fueltechIds: parseParams(params.getAll(FacilityParam.FUELTECH_ID)),
        networkRegions: parseParams(params.getAll(FacilityParam.NETWORK_REGION)),
        commenced: parseOption(params.get(FacilityParam.COMMENCED), PAST_DATE_RANGE_OPTIONS),
        expectedClosure: parseOption(params.get(FacilityParam.EXPECTED_CLOSURE), FUTURE_DATE_RANGE_OPTIONS),
        expectedOperation: parseOption(params.get(FacilityParam.EXPECTED_OPERATION), FUTURE_DATE_RANGE_OPTIONS),
        sortBy: parseOption(params.get(FacilityParam.SORT), SORT_OPTIONS)
    };
}

// Inverse of getFiltersFromSearch, used to keep the address bar in sync with the filters.
export function buildSearchFromFilters(filters: FacilityFilters): string {
    const {statusIds, fueltechIds, networkRegions, commenced, expectedClosure, expectedOperation, sortBy} = filters;
    const params = new URLSearchParams();
    statusIds.forEach((value) => params.append(FacilityParam.STATUS_ID, value));
    fueltechIds.forEach((value) => params.append(FacilityParam.FUELTECH_ID, value));
    networkRegions.forEach((value) => params.append(FacilityParam.NETWORK_REGION, value));
    const singleValues: [string, string | null][] = [
        [FacilityParam.COMMENCED, commenced],
        [FacilityParam.EXPECTED_CLOSURE, expectedClosure],
        [FacilityParam.EXPECTED_OPERATION, expectedOperation],
        [FacilityParam.SORT, sortBy]
    ];
    singleValues.forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });
    const query = params.toString();
    return query ? `?${query}` : "";
}

const DATE_RANGE_INTERVAL: Record<PastDateRangeOptions | FutureDateRangeOptions, number> = {
    lastMonth: -1,
    lastQuarter: -3,
    lastYear: -12,
    nextMonth: 1,
    nextQuarter: 3,
    nextYear: 12
};

// This extracts calendar day since API returns dates with a timezone offset
function extractDate(value: string): Date {
    return parseISO(value.slice(0, 10));
}

export function isWithinDateRange(value: string | null | undefined, months: number, today = startOfToday()): boolean {
    if (!value) {
        return false;
    }
    const edge = addMonths(today, months);
    return isWithinInterval(extractDate(value), months < 0 ? {start: edge, end: today} : {start: today, end: edge});
}

function unitMatches(unit: FacilityUnit, filters: FacilityFilters): boolean {
    const {statusIds, fueltechIds, commenced, expectedClosure, expectedOperation} = filters;
    return (statusIds.length === 0 || statusIds.includes(unit.status_id)) &&
        (fueltechIds.length === 0 || fueltechIds.includes(unit.fueltech_id)) &&
        (!commenced || isWithinDateRange(unit.commencement_date, DATE_RANGE_INTERVAL[commenced])) &&
        (!expectedOperation || isWithinDateRange(unit.expected_operation_date, DATE_RANGE_INTERVAL[expectedOperation])) &&
        (!expectedClosure || isWithinDateRange(unit.expected_closure_date, DATE_RANGE_INTERVAL[expectedClosure]));
}

// Region matches at facility level; status, fuel tech and dates must all match on the same unit.
// Units are trimmed to the matching ones (mirrors how the Open Electricity API filters).
export function filterFacilities(facilities: Facility[], filters: FacilityFilters): Facility[] {
    const {statusIds, fueltechIds, networkRegions, commenced, expectedClosure, expectedOperation} = filters;
    const hasUnitFilter = statusIds.length > 0 || fueltechIds.length > 0 ||
        Boolean(commenced || expectedClosure || expectedOperation);

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

// Formats an API date e.g ("2005-01-06T00:00:00+10:00") -> "6 Jan 2005"
export function formatDate(date: string | null | undefined): string {
    return date ? format(extractDate(date), "d MMM yyyy") : "—";
}

type UnitDateField = "commencement_date" | "closure_date" | "expected_closure_date" | "expected_operation_date";

// Earliest or latest non-null value of a unit date field, in one pass (ISO strings compare chronologically).
function pickDate(units: FacilityUnit[], field: UnitDateField, pick: "earliest" | "latest"): string | null {
    return units.reduce<string | null>((best, unit) => {
        const date = unit[field];
        if (!date) {
            return best;
        }
        return !best || (pick === "earliest" ? date < best : date > best) ? date : best;
    }, null);
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

// Lifecycle order used by the Status sort
const STATUS_ORDER = ["operating", "commissioning", "committed", "retired"];

// Rank of the facility's most active unit status (unknown statuses rank last)
function statusRank(units: FacilityUnit[]): number {
    return Math.min(...units.map((unit) => {
        const index = STATUS_ORDER.indexOf(unit.status_id);
        return index === -1 ? STATUS_ORDER.length : index;
    }));
}

type SortKey = string | number | null;

// Builds a date sort: which date to pick per facility and which direction to order it
function dateSort(field: UnitDateField, pick: "earliest" | "latest", direction: "asc" | "desc") {
    return {
        key: (units: FacilityUnit[]): SortKey => pickDate(units, field, pick),
        compare: (a: SortKey, b: SortKey) => compareDates(a as string | null, b as string | null, direction)
    };
}

// How each attribute is sorted
const SORT_CONFIG: Record<SortBy, {key: (units: FacilityUnit[]) => SortKey; compare: (a: SortKey, b: SortKey) => number}> = {
    status: {key: statusRank, compare: (a, b) => (a as number) - (b as number)},
    commencement: dateSort("commencement_date", "earliest", "desc"),
    closure: dateSort("closure_date", "latest", "desc"),
    expectedClosure: dateSort("expected_closure_date", "earliest", "asc"),
    expectedOperation: dateSort("expected_operation_date", "earliest", "asc")
};

// Status: by the facility's most active unit status (lifecycle order).
// Commencement: earliest commencement, newest first. Closure: latest closure, newest first.
// Expected closure / expected operation: earliest date, soonest first. Ties broken by name.
// Only the selected sort's key is computed.
export function sortFacilities(facilities: Facility[], sortBy: SortBy | null): Facility[] {
    if (!sortBy) {
        return facilities;
    }
    const {key, compare} = SORT_CONFIG[sortBy];
    return facilities
        .map((facility) => ({facility, sortKey: key(facility.units)}))
        .sort((a, b) => compare(a.sortKey, b.sortKey) || a.facility.name.localeCompare(b.facility.name))
        .map(({facility}) => facility);
}

// Note: Assumed total capacity is the sum of units' registered capacity
// - Skips battery_charging/battery_discharging since it repeats
// - Ignores units w/o registered capacity
function totalCapacity(units: FacilityUnit[]): number | null {
    const capacities = units
        .filter((unit) => unit.fueltech_id !== "battery_charging" && unit.fueltech_id !== "battery_discharging")
        .map((unit) => unit.capacity_registered)
        .filter((capacity): capacity is number => capacity != null);
    return capacities.length > 0 ? capacities.reduce((sum, capacity) => sum + capacity, 0) : null;
}

// Rolls unit details up to facility level for the card summary.
export function summariseUnits(units: FacilityUnit[]) {
    return {
        statusIds: [...new Set(units.map((unit) => unit.status_id))],
        fueltechIds: [...new Set(units.map((unit) => unit.fueltech_id))],
        earliestCommencement: pickDate(units, "commencement_date", "earliest"),
        totalCapacity: totalCapacity(units)
    };
}

// Sum of each facility's total capacity (same assumption as totalCapacity); null if none have one.
export function sumCapacity(facilities: Facility[]): number | null {
    const totals = facilities
        .map((facility) => totalCapacity(facility.units))
        .filter((total): total is number => total != null);
    return totals.length > 0 ? totals.reduce((sum, total) => sum + total, 0) : null;
}
