import {
    FacilityParam,
    type Facility,
    type FacilityFilters,
    type FilterOption,
    type FueltechOption
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

// Test: known code -> label (VIC1 -> "VIC", WEM -> "WA"); unknown code -> returned as-is.
export function getRegionLabel(code: string): string {
    return NETWORK_REGION_OPTIONS.find((option) => option.value === code)?.label ?? code;
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
// Test: "" -> empty filters; repeated params; comma lists; unknown params ignored.
export function getFiltersFromSearch(search: string): FacilityFilters {
    const params = new URLSearchParams(search);
    return {
        statusIds: parseParams(params.getAll(FacilityParam.STATUS_ID)),
        fueltechIds: parseParams(params.getAll(FacilityParam.FUELTECH_ID)),
        networkRegions: parseParams(params.getAll(FacilityParam.NETWORK_REGION))
    };
}

// Inverse of getFiltersFromSearch, used to keep the address bar in sync with the filters.
// Test: empty filters -> ""; all three params included, list values repeated;
//       round trip getFiltersFromSearch(buildSearchFromFilters(f)) deep-equals f.
export function buildSearchFromFilters({statusIds, fueltechIds, networkRegions}: FacilityFilters): string {
    const params = new URLSearchParams();
    statusIds.forEach((value) => params.append(FacilityParam.STATUS_ID, value));
    fueltechIds.forEach((value) => params.append(FacilityParam.FUELTECH_ID, value));
    networkRegions.forEach((value) => params.append(FacilityParam.NETWORK_REGION, value));
    const query = params.toString();
    return query ? `?${query}` : "";
}

// Region matches at facility level; status and fuel tech must match on the same unit
// (mirrors how the Open Electricity API filters).
// Test: no filters -> all; region only; status only; fuel tech only;
//       status + fuel tech on different units -> excluded; facility with no units
//       excluded once a unit filter is set.
export function filterFacilities(facilities: Facility[], filters: FacilityFilters): Facility[] {
    const {statusIds, fueltechIds, networkRegions} = filters;
    const hasUnitFilter = statusIds.length > 0 || fueltechIds.length > 0;

    return facilities.filter((facility) => {
        if (networkRegions.length > 0 && !networkRegions.includes(facility.network_region)) {
            return false;
        }
        if (!hasUnitFilter) {
            return true;
        }
        return facility.units.some((unit) =>
            (statusIds.length === 0 || statusIds.includes(unit.status_id)) &&
            (fueltechIds.length === 0 || fueltechIds.includes(unit.fueltech_id))
        );
    });
}
