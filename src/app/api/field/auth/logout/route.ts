// POST /api/field/auth/logout
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('fieldSessionId');

  return Response.json({ message: 'Logged out' }, { status: 200 });
}