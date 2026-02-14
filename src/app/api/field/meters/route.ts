// GET /api/field/meters
// Fetch meters for a specific community with latest readings and sort order
// src/app/api/field/meters/route.ts

import { sql } from "drizzle-orm";
import db from "@/db/drizzle-postgres";

export const revalidate = 0;

interface MeterRow {
  unitId: string;
  meterId: string;
  amrId: string;
  meterType: string;
  fieldSortOrder: number;
  currentReading?: string;
  lastReadingDate?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return Response.json(
        { message: "Missing communityId parameter" },
        { status: 400 },
      );
    }

    const metersList = await db.execute(
      sql`
        WITH expanded_meters AS (
          SELECT 
            cu."unit_number",
            jsonb_array_elements(cu."meters")->>'meter_id' AS meter_id,
            jsonb_array_elements(cu."meters")->>'meter_type' AS meter_type
          FROM "community_units" cu
          WHERE cu."community_id" = ${parseInt(communityId, 10)} 
            AND cu."is_deleted" = false
        )
        SELECT DISTINCT ON (em.meter_id)
          em."unit_number" AS "unitId",
          em.meter_id AS "meterId",
          COALESCE(m."amr_id", '') AS "amrId",
          em.meter_type AS "meterType",
          COALESCE(m."field_sort_order", 999) AS "fieldSortOrder",
          cr."readings" AS "currentReading",
          cr."reading_date" AS "lastReadingDate"
        FROM expanded_meters em
        LEFT JOIN "meters" m ON m."meter_id" = em.meter_id
        LEFT JOIN "current_readings" cr ON cr."meter_id" = em.meter_id
        ORDER BY em.meter_id, cr."reading_date" DESC NULLS LAST
      `,
    );

    // Sort by fieldSortOrder
    // Sort by fieldSortOrder
    const sortedMeters = (metersList as unknown as MeterRow[]).sort((a, b) => {
      const aSort = a.fieldSortOrder ?? 999;
      const bSort = b.fieldSortOrder ?? 999;
      return aSort - bSort;
    });

    return Response.json(
      {
        data: sortedMeters,
        count: sortedMeters.length,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching meters:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { message: "Failed to fetch meters: " + message },
      { status: 500 },
    );
  }
}
