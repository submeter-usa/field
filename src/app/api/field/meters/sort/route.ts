// POST /api/field/meters/sort
// src/app/api/field/meters/sort/route.ts

import { sql } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';

export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { communityId, sortOrder } = body;

    if (!communityId || !sortOrder || !Array.isArray(sortOrder)) {
      return Response.json(
        { message: 'Missing or invalid communityId or sortOrder' },
        { status: 400 }
      );
    }

    for (const item of sortOrder) {
      await db.execute(
        sql`
          UPDATE "meters"
          SET "field_sort_order" = ${item.fieldSortOrder}
          WHERE "meter_id" = ${item.meterId}
            AND "community_id" = ${parseInt(communityId, 10)}
        `
      );
    }

    return Response.json(
      { message: 'Sort order saved' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error saving sort order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { message: 'Failed to save sort order: ' + message },
      { status: 500 }
    );
  }
}