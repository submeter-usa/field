// POST /api/field/readings
// Bulk save meter readings from field employees
// src/app/api/field/readings/route.ts

import { eq } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';
import { currentReadings } from '@/db/schema/index';

export const revalidate = 0;

interface SingleReading {
  meterId: string;
  amrId: string;
  reading: string;
}

interface BulkReadingsRequest {
  fieldUserId: string;
  communityId: string;
  readingDate: string;
  inputType: string;
  readings: SingleReading[];
}

export async function POST(request: Request) {
  const body: BulkReadingsRequest = await request.json();
  const { readingDate, readings } = body;

  if (!readings || readings.length === 0) {
    return Response.json(
      { message: 'Readings array is required and cannot be empty' },
      { status: 400 }
    );
  }

  if (!readingDate) {
    return Response.json(
      { message: 'Reading date is required' },
      { status: 400 }
    );
  }

  try {
    const results = await db.transaction(async (tx) => {
      const savedReadings = [];

      for (const reading of readings) {
        const { meterId, amrId, reading: readingValue } = reading;

        if (!meterId) {
          throw new Error('Meter ID is required for each reading');
        }

        const existing = await tx
          .select()
          .from(currentReadings)
          .where(eq(currentReadings.meterId, meterId))
          .limit(1);

        let result;

        if (existing.length > 0) {
          const [updated] = await tx
            .update(currentReadings)
            .set({
              readings: readingValue,
              readingDate: readingDate,
              inputType: 'Field',
            })
            .where(eq(currentReadings.id, existing[0].id))
            .returning();

          result = updated;
        } else {
          const [inserted] = await tx
            .insert(currentReadings)
            .values({
              meterId,
              readings: readingValue,
              readingDate,
              inputType: 'Field',
            })
            .returning();

          result = inserted;
        }

        if (!result) {
          throw new Error(`Failed to save reading for meter ${meterId}`);
        }

        savedReadings.push({
          meterId,
          reading: readingValue,
          readingDate,
          success: true,
        });
      }

      return savedReadings;
    });

    return Response.json(
      {
        message: `Successfully saved ${results.length} reading(s)`,
        data: {
          saved: results.length,
          total: readings.length,
          readings: results,
          savedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error saving readings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { message: `Failed to save readings: ${message}` },
      { status: 500 }
    );
  }
}