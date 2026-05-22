import { getSession, getUsers } from "@/lib/serverAuth";
import { kvGet, getRedis } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const users = await getUsers();
    const redis = getRedis();

    // Load team tasks once (shared across all members)
    const teamTasks = (await kvGet("tcf:teamtasks")) || [];

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const stats = await Promise.all(
      users.map(async (u) => {
        const [personalTasks, dailyTasks, lastLoginRaw] = await Promise.all([
          kvGet(`tcf:tasks:${u.id}`).then((t) => t || []),
          kvGet(`tcf:dailytasks:${u.id}`).then((t) => t || []),
          redis.get(`tcf:lastlogin:${u.id}`),
        ]);

        // Personal tasks
        const totalPersonal = personalTasks.length;
        const donePersonal = personalTasks.filter((t) => t.done).length;
        const overduePersonal = personalTasks.filter(
          (t) => !t.done && t.dueDate && new Date(t.dueDate) < new Date()
        ).length;
        const recentPersonal = personalTasks.filter(
          (t) => new Date(t.createdAt).getTime() > sevenDaysAgo
        ).length;

        // Daily tasks
        const totalDaily = dailyTasks.length;
        const doneDaily = dailyTasks.filter((t) => t.done).length;

        // Team tasks assigned to this member
        const assignedTeam = teamTasks.filter((t) =>
          Array.isArray(t.assignees) && t.assignees.some((a) => a.id === u.id || a === u.id)
        );
        const completedTeam = assignedTeam.filter((t) => t.status === "completed").length;
        const inProgressTeam = assignedTeam.filter((t) => t.status === "in_progress").length;

        // Team tasks added by this member
        const addedTeamTasks = teamTasks.filter((t) => t.addedById === u.id).length;
        const recentTeamAdded = teamTasks.filter(
          (t) => t.addedById === u.id && new Date(t.createdAt).getTime() > sevenDaysAgo
        ).length;

        // Last login
        const lastLogin = lastLoginRaw || null;
        const lastLoginMs = lastLogin ? new Date(lastLogin).getTime() : null;
        const daysSinceLogin = lastLoginMs
          ? Math.floor((now - lastLoginMs) / (24 * 60 * 60 * 1000))
          : null;

        // Health score (0–100)
        let score = 0;
        // Login recency (up to 30pts)
        if (daysSinceLogin !== null) {
          if (daysSinceLogin <= 1) score += 30;
          else if (daysSinceLogin <= 3) score += 25;
          else if (daysSinceLogin <= 7) score += 15;
          else if (daysSinceLogin <= 14) score += 5;
        }
        // Task completion rate (up to 30pts)
        if (totalPersonal > 0) {
          score += Math.round((donePersonal / totalPersonal) * 30);
        } else {
          score += 10; // neutral if no tasks yet
        }
        // Recent activity — added tasks in last 7 days (up to 20pts)
        if (recentPersonal > 0 || recentTeamAdded > 0) score += Math.min(20, (recentPersonal + recentTeamAdded) * 5);
        // Team task engagement (up to 20pts)
        if (assignedTeam.length > 0) {
          score += Math.round((completedTeam / assignedTeam.length) * 20);
        } else {
          score += 10; // neutral
        }
        score = Math.min(100, score);

        // Status label
        let status = "active";
        if (daysSinceLogin === null || daysSinceLogin > 14) status = "inactive";
        else if (daysSinceLogin > 7 || (totalPersonal > 0 && donePersonal / totalPersonal < 0.3)) status = "at-risk";

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          score,
          status,
          lastLogin,
          daysSinceLogin,
          personal: {
            total: totalPersonal,
            done: donePersonal,
            overdue: overduePersonal,
            addedThisWeek: recentPersonal,
          },
          daily: {
            total: totalDaily,
            done: doneDaily,
          },
          team: {
            assigned: assignedTeam.length,
            completed: completedTeam,
            inProgress: inProgressTeam,
            added: addedTeamTasks,
            addedThisWeek: recentTeamAdded,
          },
        };
      })
    );

    // Sort: active first, then by score desc
    stats.sort((a, b) => {
      const order = { active: 0, "at-risk": 1, inactive: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.score - a.score;
    });

    return Response.json(stats);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
