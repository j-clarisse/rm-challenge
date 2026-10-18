export type FacilityUnit = {
    code: string;
    fueltech_id: string;
    status_id: string;
    commencement_date?: string | null;
};

export type Facility = {
    code: string;
    name: string;
    network_region: string;
    units: FacilityUnit[];
};

// Filter param names used in the page URL
export const FacilityParam = {
    STATUS_ID: "status_id",
    FUELTECH_ID: "fueltech_id",
    NETWORK_REGION: "network_region"
} as const;

export type FacilityFilters = {
    statusIds: string[];
    fueltechIds: string[];
    networkRegions: string[];
};

export type FilterOption = {
    value: string;
    label: string;
};

export type FueltechOption = FilterOption & {
    renewable: boolean;
};
