import { getUsers, verifyPassword, createSession } from "@/lib/serverAuth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());

    if (!user || !verifyPassword(password, user.password)) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(user.id);
    const { password: _, ...safeUser } = user;
    return Response.json({ token, user: safeUser });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
