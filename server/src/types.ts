// Query param names of /api/facilities
export enum FacilityParam {
    STATUS_ID = "status_id",
    FUELTECH_GROUP_ID = "fueltech_group_id",
    NETWORK_REGION = "network_region"
}

// Open Electricity response
export interface FacilitiesResponse {
    version: string;
    created_at: string;
    success: boolean;
    error: string | null;
    detail?: unknown; // Present instead of `error` on upstream 422 validation errors
    data: unknown[];
    total_records: number | null;
}

export interface FacilityFilters {
    statusIds: string[];
    fueltechGroupIds: string[];
    networkRegion?: string;
}

// Success response for /api/facilities
export interface FacilitiesApiResponse {
    facilities: unknown[];
    total_records: number;
}
