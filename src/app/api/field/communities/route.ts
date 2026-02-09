// GET /api/field/communities
// Fetch list of communities for dropdown/autocomplete
// src\app\api\field\communities\route.ts
import db from '@/db/drizzle-postgres';
import { communities } from '@/db/schema/index';
import { eq } from 'drizzle-orm';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const communitiesList = await db
      .select({
        id: communities.id,
        name: communities.name,
      })
      .from(communities)
      .where(eq(communities.isDeleted, false))
      .orderBy(communities.name);

    return Response.json(communitiesList, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching communities:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { message: 'Failed to fetch communities: ' + message },
      { status: 500 }
    );
  }
}