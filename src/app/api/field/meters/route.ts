// GET /api/field/meters
// Fetch meters for a specific community with latest readings
// src/app/api/field/meters/route.ts

import { eq, and, sql } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';
import { communityUnits, currentReadings } from '@/db/schema/index';

export const revalidate = 0;

interface MeterData {
  unitId: string;
  meterId: string;
  amrId: string;
  meterType: string;
  currentReading?: string;
  lastReadingDate?: string;
}

interface MeterJsonData {
  meter_id: string;
  amr_id: string;
  meter_type: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return Response.json(
        { message: 'Missing communityId parameter' },
        { status: 400 }
      );
    }

    // Expanded meters CTE - extracts all meters from JSONB array
    const expandedMeters = db.$with('expanded_meters').as(
      db
        .select({
          unitId: communityUnits.id,
          unitNumber: communityUnits.unitNumber,
          meterData: sql<MeterJsonData>`jsonb_array_elements(
            CASE 
              WHEN jsonb_typeof(${communityUnits.meters}) = 'array' THEN ${communityUnits.meters} 
              ELSE '[]'::jsonb 
            END
          )`.as('meter_data'),
        })
        .from(communityUnits)
        .where(
          and(
            eq(communityUnits.communityId, communityId),
            eq(communityUnits.isDeleted, false)
          )
        )
    );

    // Query with latest readings per meter using DISTINCT ON
    const metersList = await db
      .with(expandedMeters)
      .selectDistinctOn(
        [sql`${expandedMeters.meterData}->>'meter_id'`],
        {
          unitId: expandedMeters.unitNumber,
          meterId: sql<string>`${expandedMeters.meterData}->>'meter_id'`,
          amrId: sql<string>`${expandedMeters.meterData}->>'amr_id'`,
          meterType: sql<string>`${expandedMeters.meterData}->>'meter_type'`,
          currentReading: currentReadings.readings,
          lastReadingDate: currentReadings.readingDate,
        }
      )
      .from(expandedMeters)
      .leftJoin(
        currentReadings,
        eq(sql`${expandedMeters.meterData}->>'meter_id'`, currentReadings.meterId)
      )
      .orderBy(
        sql`${expandedMeters.meterData}->>'meter_id'`,
        sql`${currentReadings.readingDate} DESC NULLS LAST`
      );

    return Response.json(
      {
        data: metersList,
        count: metersList.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching meters:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { message: 'Failed to fetch meters: ' + message },
      { status: 500 }
    );
  }
}