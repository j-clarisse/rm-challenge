// Open Electricity response
export interface FacilitiesResponse {
    version: string;
    created_at: string;
    success: boolean;
    error: string | null;
    data: unknown[];
    total_records: number | null;
}

// Success response for /api/facilities
export interface FacilitiesApiResponse {
    facilities: unknown[];
    total_records: number;
}
