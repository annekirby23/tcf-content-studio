import { getSession, getUsers } from "@/lib/serverAuth";
import { kvGet, getRedis } from "@/lib/redis";

// Returns the most recent ISO date string from a list of date strings
function latestDate(...dates) {
  const valid = dates.flat().filter(Boolean);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const users = await getUsers();
    const redis = getRedis();

    // Load shared data once
    const teamTasks = (await kvGet("tcf:teamtasks")) || [];

    const now = Date.now();
    const sevenDaysAgo  = now - 7  * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    const stats = await Promise.all(
      users.map(async (u) => {
        const [personalTasks, dailyTasks, lastLoginRaw] = await Promise.all([
          kvGet(`tcf:tasks:${u.id}`).then((t) => t || []),
          kvGet(`tcf:dailytasks:${u.id}`).then((t) => t || []),
          redis.get(`tcf:lastlogin:${u.id}`),
        ]);

        // ── Personal tasks ───────────────────────────────────────────────────
        const totalPersonal   = personalTasks.length;
        const donePersonal    = personalTasks.filter((t) => t.done).length;
        const overduePersonal = personalTasks.filter(
          (t) => !t.done && t.dueDate && new Date(t.dueDate) < new Date()
        ).length;
        const recentPersonal  = personalTasks.filter(
          (t) => new Date(t.createdAt).getTime() > sevenDaysAgo
        ).length;

        // Most recent personal task activity (created or completed)
        const personalDates = personalTasks.flatMap((t) =>
          [t.createdAt, t.updatedAt].filter(Boolean)
        );

        // ── Daily tasks ──────────────────────────────────────────────────────
        const totalDaily = dailyTasks.length;
        const doneDaily  = dailyTasks.filter((t) => t.done).length;
        const dailyDates = dailyTasks.flatMap((t) =>
          [t.createdAt, t.updatedAt].filter(Boolean)
        );

        // ── Team tasks ───────────────────────────────────────────────────────
        const assignedTeam = teamTasks.filter((t) =>
          Array.isArray(t.assignees) &&
          t.assignees.some((a) => (a.id || a) === u.id)
        );
        const completedTeam   = assignedTeam.filter((t) => t.status === "completed").length;
        const inProgressTeam  = assignedTeam.filter((t) => t.status === "in_progress").length;
        const addedTeamTasks  = teamTasks.filter((t) => t.addedById === u.id);
        const recentTeamAdded = addedTeamTasks.filter(
          (t) => new Date(t.createdAt).getTime() > sevenDaysAgo
        ).length;
        const teamDates = addedTeamTasks.flatMap((t) =>
          [t.createdAt, t.updatedAt].filter(Boolean)
        );

        // ── Derive last activity from ALL data sources ───────────────────────
        // Use task timestamps as the primary activity signal — works even
        // without explicit login tracking on the production branch.
        const lastActivityFromData = latestDate(personalDates, dailyDates, teamDates);
        const lastLoginTracked     = lastLoginRaw || null;

        // Prefer whichever is more recent
        const lastSeen = latestDate([lastActivityFromData, lastLoginTracked].filter(Boolean));

        const lastSeenMs     = lastSeen ? new Date(lastSeen).getTime() : null;
        const daysSinceLogin = lastSeenMs
          ? Math.floor((now - lastSeenMs) / (24 * 60 * 60 * 1000))
          : null;

        // ── Health score (0–100) ─────────────────────────────────────────────
        let score = 0;

        // Recency (up to 30pts)
        if (daysSinceLogin !== null) {
          if (daysSinceLogin <= 1)  score += 30;
          else if (daysSinceLogin <= 3)  score += 25;
          else if (daysSinceLogin <= 7)  score += 15;
          else if (daysSinceLogin <= 14) score += 5;
        }

        // Task completion rate (up to 30pts)
        if (totalPersonal > 0) {
          score += Math.round((donePersonal / totalPersonal) * 30);
        } else {
          score += 10; // neutral — no tasks yet
        }

        // Recent activity (up to 20pts)
        const recentActivity = recentPersonal + recentTeamAdded;
        if (recentActivity > 0) score += Math.min(20, recentActivity * 5);

        // Team task engagement (up to 20pts)
        if (assignedTeam.length > 0) {
          score += Math.round((completedTeam / assignedTeam.length) * 20);
        } else {
          score += 10; // neutral
        }

        score = Math.min(100, score);

        // ── Status label ─────────────────────────────────────────────────────
        let status = "active";
        if (daysSinceLogin === null || daysSinceLogin > 14) {
          status = "inactive";
        } else if (
          daysSinceLogin > 7 ||
          (totalPersonal > 0 && donePersonal / totalPersonal < 0.3)
        ) {
          status = "at-risk";
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          score,
          status,
          lastSeen,
          daysSinceLogin,
          personal: {
            total: totalPersonal,
            done: donePersonal,
            overdue: overduePersonal,
            addedThisWeek: recentPersonal,
          },
          daily: { total: totalDaily, done: doneDaily },
          team: {
            assigned: assignedTeam.length,
            completed: completedTeam,
            inProgress: inProgressTeam,
            added: addedTeamTasks.length,
            addedThisWeek: recentTeamAdded,
          },
        };
      })
    );

    // Sort: active → at-risk → inactive, then by score desc
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
