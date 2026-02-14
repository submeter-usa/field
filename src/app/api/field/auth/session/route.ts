// GET /api/field/auth/session
// Check if user has valid session
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';
import { fieldUsers } from '@/db/schema/index';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('fieldSessionId')?.value;

    if (!sessionId) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    const user = await db
      .select()
      .from(fieldUsers)
      .where(eq(fieldUsers.id, sessionId))
      .limit(1);

    if (user.length === 0) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    return Response.json(
      {
        authenticated: true,
        id: user[0].id,
        login: user[0].login,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}