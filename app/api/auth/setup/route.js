import { getUsers, setUsers, hashPassword, createSession, genId } from "@/lib/serverAuth";

// GET — check if first-time setup is needed
export async function GET() {
  try {
    const users = await getUsers();
    return Response.json({ needsSetup: users.length === 0 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST — create the first admin account (only works when zero users exist)
export async function POST(req) {
  try {
    const users = await getUsers();
    if (users.length > 0) {
      return Response.json({ error: "Setup already complete" }, { status: 403 });
    }

    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return Response.json({ error: "Name, email, and a password of at least 6 characters are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const admin = {
      id: genId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashPassword(password),
      role: "admin",
      createdAt: now,
    };

    await setUsers([admin]);
    const token = await createSession(admin.id);
    const { password: _, ...safeAdmin } = admin;
    return Response.json({ token, user: safeAdmin }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
