import { getSession, getUsers, setUsers, hashPassword, genId } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const users = await getUsers();
    const safe = users.map(({ password, ...u }) => u);
    return Response.json(safe);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const currentUser = await getSession(req);
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const { name, email, password, role = "member" } = await req.json();
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return Response.json({ error: "Name, email, and a password (min 6 chars) are required" }, { status: 400 });
    }

    const users = await getUsers();
    if (users.some((u) => u.email === email.trim().toLowerCase())) {
      return Response.json({ error: "A user with that email already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newUser = {
      id: genId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "member",
      createdAt: now,
    };

    users.push(newUser);
    await setUsers(users);
    const { password: _, ...safeUser } = newUser;
    return Response.json(safeUser, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
