import {FacilityParam, type FacilitiesResponse, type FacilityFilters} from "./types";

const FACILITIES_URL = "https://api.openelectricity.org.au/v4/facilities/";

const STATUS_IDS = ["committed", "operating", "commissioning", "retired"] as const;

const FUELTECH_GROUP_IDS = [
    "solar", "wind", "hydro", "biomass", "coal", "gas", "battery",
    "battery_charging", "battery_discharging", "distillate", "bioenergy", "pumps"
] as const;

// Accepts both repeated params (?a=x&a=y) and comma lists (?a=x,y).
// Test: undefined -> []; repeated values; comma list; repeated + comma combined;
//       whitespace and empty segments ("a,,b ") -> ["a", "b"].
export function parseParams(values: string[] | undefined): string[] {
    return (values ?? [])
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
}

// Returns an error message listing any values not in `allowed`, or null if all are valid.
// Test: all valid -> null; empty list -> null; one invalid -> named in message;
//       several invalid -> all listed.
export function invalidValuesError(name: FacilityParam, values: string[], allowed: readonly string[]): string | null {
    const invalid = values.filter((value) => !allowed.includes(value));
    if (invalid.length === 0) {
        return null;
    }
    return `Invalid ${name}: ${invalid.join(", ")}. Allowed: ${allowed.join(", ")}`;
}

// Returns the first validation error for the filters, or null if they are all valid.
// Test: valid filters -> null; bad status_id -> message; bad fueltech_group_id -> message;
//       both bad -> status_id reported first.
export function validateFilters(filters: FacilityFilters): string | null {
    return invalidValuesError(FacilityParam.STATUS_ID, filters.statusIds, STATUS_IDS) ??
        invalidValuesError(FacilityParam.FUELTECH_GROUP_ID, filters.fueltechGroupIds, FUELTECH_GROUP_IDS);
}

// Builds the upstream URL, repeating list params as the API expects (?status_id=a&status_id=b).
// Test: no filters -> bare URL; repeated status_id params in order;
//       network_region omitted when empty; all three filters combined.
export function buildFacilitiesUrl({statusIds, fueltechGroupIds, networkRegion}: FacilityFilters): URL {
    const url = new URL(FACILITIES_URL);
    statusIds.forEach((value) => url.searchParams.append(FacilityParam.STATUS_ID, value));
    fueltechGroupIds.forEach((value) => url.searchParams.append(FacilityParam.FUELTECH_GROUP_ID, value));
    if (networkRegion) {
        url.searchParams.set(FacilityParam.NETWORK_REGION, networkRegion);
    }
    return url;
}

// Test: `error` string used; `detail` stringified when no `error`; null body -> fallback;
//       `error` wins over `detail`.
export function readErrorMessage(body: Partial<FacilitiesResponse> | null): string {
    if (body?.error) {
        return body.error;
    }
    if (body?.detail) {
        return JSON.stringify(body.detail);
    }
    return "Failed to fetch facilities";
}
