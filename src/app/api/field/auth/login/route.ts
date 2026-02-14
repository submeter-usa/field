// POST /api/field/auth/login
import { eq } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';
import { fieldUsers } from '@/db/schema/index';
import { cookies } from 'next/headers';

export const revalidate = 0;

interface LoginRequest {
  login: string;
  pwd: string;
}

export async function POST(request: Request) {
  const body: LoginRequest = await request.json();
  const { login, pwd } = body;

  if (!login || !pwd) {
    return Response.json(
      { message: 'Missing login or password' },
      { status: 400 }
    );
  }

  try {
    const user = await db
      .select()
      .from(fieldUsers)
      .where(eq(fieldUsers.login, login))
      .limit(1);

    if (user.length === 0) {
      return Response.json(
        { message: 'Invalid login or password' },
        { status: 401 }
      );
    }

    const fieldUser = user[0];

    if (fieldUser.pwd !== pwd) {
      return Response.json(
        { message: 'Invalid login or password' },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(fieldUsers)
      .set({ lastLogin: new Date() })
      .where(eq(fieldUsers.id, fieldUser.id));

    // Set HTTP-only cookie (24 hour expiry)
    const cookieStore = await cookies();
    cookieStore.set('fieldSessionId', fieldUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return Response.json(
      {
        id: fieldUser.id,
        login: fieldUser.login,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json(
      { message: `Login failed: ${message}` },
      { status: 500 }
    );
  }
}