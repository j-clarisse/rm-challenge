import {Hono} from "hono";
import type {ContentfulStatusCode} from "hono/utils/http-status";

interface Env {
    OPEN_ELECTRICITY_API_TOKEN: string;
}

interface FacilitiesResponse {
    version: string;
    created_at: string;
    success: boolean;
    error: string | null;
    data: unknown[];
    total_records: number | null;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/facilities", async (c) => {
    const res = await fetch("https://api.openelectricity.org.au/v4/facilities/", {
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

    return c.json({
        facilities: body.data
    });
});

export default app;
