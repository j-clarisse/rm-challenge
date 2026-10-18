import {Hono} from "hono";
import type {ContentfulStatusCode} from "hono/utils/http-status";
import type {FacilitiesApiResponse, FacilitiesResponse} from "./types";

const FACILITIES_URL = "https://api.openelectricity.org.au/v4/facilities/";

interface Env {
    OPEN_ELECTRICITY_API_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/facilities", async (c) => {
    const res = await fetch(FACILITIES_URL, {
        headers: {
            Authorization: `Bearer ${c.env.OPEN_ELECTRICITY_API_TOKEN}`
        }
    });

    const body = await res.json<Partial<FacilitiesResponse>>().catch(() => null);

    if (!res.ok || !body?.success) {
        return c.json(
            {error: body?.error ?? "Failed to fetch facilities"},
            (res.ok ? 502 : res.status) as ContentfulStatusCode
        );
    }

    return c.json<FacilitiesApiResponse>({
        facilities: body.data ?? [],
        total_records: body.total_records ?? body.data?.length ?? 0
    });
});

export default app;
