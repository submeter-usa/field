// POST /api/field/auth/login
// Simple field user authentication - update last_login timestamp
// src\app\api\field\auth\login\route.ts
import { eq } from 'drizzle-orm';
import db from '@/db/drizzle-postgres';
import { fieldUsers } from '@/db/schema/index';

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
    // Find user by login and password
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

    // Simple password comparison (unhashed as per spec)
    // TODO: Consider switching to bcrypt in production
    if (fieldUser.pwd !== pwd) {
      return Response.json(
        { message: 'Invalid login or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db
      .update(fieldUsers)
      .set({ lastLogin: new Date() })
      .where(eq(fieldUsers.id, fieldUser.id));

    return Response.json(
      {
        id: fieldUser.id,
        login: fieldUser.login,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    return Response.json(
      { message: 'Login failed: ' + error.message },
      { status: 500 }
    );
  }
}