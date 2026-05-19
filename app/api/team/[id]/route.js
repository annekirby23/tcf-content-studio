import { getSession, getUsers, setUsers, hashPassword } from "@/lib/serverAuth";

export async function PUT(req, { params }) {
  try {
    const currentUser = await getSession(req);
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Members can only update their own profile (name only); admins can update anyone
    const isSelf = currentUser.id === params.id;
    if (!isSelf && currentUser.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === params.id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    const updates = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.password && body.password.length >= 6) updates.password = hashPassword(body.password);
    // Only admins can change roles, and cannot demote themselves
    if (currentUser.role === "admin" && body.role && !isSelf) {
      updates.role = body.role === "admin" ? "admin" : "member";
    }

    users[idx] = { ...users[idx], ...updates };
    await setUsers(users);
    const { password, ...safeUser } = users[idx];
    return Response.json(safeUser);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const currentUser = await getSession(req);
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    if (currentUser.id === params.id) return Response.json({ error: "Cannot remove yourself" }, { status: 400 });

    const users = await getUsers();
    const filtered = users.filter((u) => u.id !== params.id);
    if (filtered.length === users.length) return Response.json({ error: "Not found" }, { status: 404 });

    await setUsers(filtered);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
