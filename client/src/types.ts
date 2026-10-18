export type FacilityUnit = {
    code: string;
    fueltech_id: string;
    status_id: string;
    commencement_date?: string | null;
    capacity_registered?: number | null;
    closure_date?: string | null;
    expected_closure_date?: string | null;
    expected_operation_date?: string | null;
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
    NETWORK_REGION: "network_region",
    SORT: "sort",
    COMMENCED: "commenced",
    EXPECTED_CLOSURE: "expected_closure",
    EXPECTED_OPERATION: "expected_operation"
} as const;

export type SortBy = "status" | "commencement" | "closure" | "expectedClosure" | "expectedOperation";

export type PastDateRangeOptions = "lastMonth" | "lastQuarter" | "lastYear";

export type FutureDateRangeOptions = "nextMonth" | "nextQuarter" | "nextYear";

export type FacilityFilters = {
    statusIds: string[];
    fueltechIds: string[];
    networkRegions: string[];
    commenced: PastDateRangeOptions | null;
    expectedClosure: FutureDateRangeOptions | null;
    expectedOperation: FutureDateRangeOptions | null;
    sortBy: SortBy | null; // null keeps the API order
};

export type FilterOption = {
    value: string;
    label: string;
};

// Add renewable attribute to fuel techs to enable presets
export type FueltechOption = FilterOption & {
    renewable: boolean;
};
