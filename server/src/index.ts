import {Hono} from "hono";
import type {ContentfulStatusCode} from "hono/utils/http-status";
import {buildFacilitiesUrl, parseParams, readErrorMessage, validateFilters} from "./utils";
import {
    FacilityParam,
    type FacilitiesApiResponse,
    type FacilitiesResponse,
    type FacilityFilters
} from "./types";

interface Env {
    OPEN_ELECTRICITY_API_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/facilities", async (c) => {
    const filters: FacilityFilters = {
        statusIds: parseParams(c.req.queries(FacilityParam.STATUS_ID)),
        fueltechGroupIds: parseParams(c.req.queries(FacilityParam.FUELTECH_GROUP_ID)),
        networkRegion: c.req.query(FacilityParam.NETWORK_REGION)?.trim()
    };

    const validationError = validateFilters(filters);
    if (validationError) {
        return c.json({error: validationError}, 400);
    }

    const res = await fetch(buildFacilitiesUrl(filters), {
        headers: {
            Authorization: `Bearer ${c.env.OPEN_ELECTRICITY_API_TOKEN}`
        }
    });

    const body = await res.json<Partial<FacilitiesResponse>>().catch(() => null);

    if (!res.ok || !body?.success) {
        return c.json(
            {error: readErrorMessage(body)},
            (res.ok ? 502 : res.status) as ContentfulStatusCode
        );
    }

    return c.json<FacilitiesApiResponse>({
        facilities: body.data ?? [],
        total_records: body.total_records ?? body.data?.length ?? 0
    });
});

export default app;
