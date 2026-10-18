import {FacilityParam, type FacilityFilters} from './types';

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
// Test: "" -> empty filters; repeated params; comma lists; unknown params ignored;
//       blank network_region -> undefined.
export function getFiltersFromSearch(search: string): FacilityFilters {
    const params = new URLSearchParams(search);
    return {
        statusIds: parseParams(params.getAll(FacilityParam.STATUS_ID)),
        fueltechGroupIds: parseParams(params.getAll(FacilityParam.FUELTECH_GROUP_ID)),
        networkRegion: params.get(FacilityParam.NETWORK_REGION)?.trim() || undefined
    };
}

// Builds the /api/facilities query string, repeating list params (?status_id=a&status_id=b).
// Test: empty filters -> ""; list values repeated in order; region omitted when unset;
//       round trip buildFacilitiesQuery(getFiltersFromSearch(q)) preserves filters.
export function buildFacilitiesQuery({statusIds, fueltechGroupIds, networkRegion}: FacilityFilters): string {
    const params = new URLSearchParams();
    statusIds.forEach((value) => params.append(FacilityParam.STATUS_ID, value));
    fueltechGroupIds.forEach((value) => params.append(FacilityParam.FUELTECH_GROUP_ID, value));
    if (networkRegion) {
        params.set(FacilityParam.NETWORK_REGION, networkRegion);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
}
