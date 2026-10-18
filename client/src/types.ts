export type Facility = {
    code: string;
    name: string;
    network_region: string;
};

// Query param names of /api/facilities
export const FacilityParam = {
    STATUS_ID: "status_id",
    FUELTECH_GROUP_ID: "fueltech_group_id",
    NETWORK_REGION: "network_region"
} as const;

export type FacilityFilters = {
    statusIds: string[];
    fueltechGroupIds: string[];
    networkRegion?: string;
};
