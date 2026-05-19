"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./constants";
import ContentForm from "./ContentForm";
import Dashboard from "./Dashboard";
import CalendarView from "./CalendarView";
import Pipeline from "./Pipeline";
import ListView from "./ListView";
import AuthScreen from "./AuthScreen";
import TeamManager from "./TeamManager";
import IdeaBoard from "./IdeaBoard";
import SettingsModal from "./SettingsModal";
import SlackPlanner from "./SlackPlanner";
import QuickLinks from "./QuickLinks";
import AssetTracker from "./AssetTracker";
import MemberProfile from "./MemberProfile";
import MyDashboard from "./MyDashboard";

const TOKEN_KEY = "tcf_session";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "mydash", label: "My Workspace", icon: "🏠" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "pipeline", label: "Pipeline", icon: "⬛" },
  { id: "list", label: "List", icon: "☰" },
  { id: "slack", label: "Slack", icon: "💬" },
  { id: "links", label: "Quick Links", icon: "🔗" },
  { id: "assets", label: "Assets", icon: "📦" },
  { id: "profile", label: "Profile", icon: "👤" },
];

function CampaignModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [goal, setGoal] = useState("");

  const inputStyle = {
    width: "100%",
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: C.text }}>New Campaign</h2>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Campaign Name *</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer 2026 Launch" autoFocus />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Start Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "light" }} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>End Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "light" }} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Campaign Goal</label>
          <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Drive 500 email signups" />
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => name.trim() && onSave({ name: name.trim(), startDate: start, endDate: end, goal })}
            disabled={!name.trim()}
            style={{ padding: "8px 24px", borderRadius: "8px", border: "none", background: !name.trim() ? C.muted : C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: !name.trim() ? "default" : "pointer" }}
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 3000,
      background: type === "error" ? "#7F1D1D" : "#064E3B",
      border: `1px solid ${type === "error" ? "#EF4444" : "#10B981"}`,
      borderRadius: "10px",
      padding: "12px 20px",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "fadeIn 0.2s ease",
    }}>
      {message}
    </div>
  );
}

export default function ContentScheduler() {
  const [view, setView] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [goals, setGoals] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [listFilters, setListFilters] = useState({});
  const [ideas, setIdeas] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authFetch = useCallback((url, opts = {}) => {
    const token = authToken || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    return fetch(url, {
      ...opts,
      headers: { ...(opts.headers || {}), "x-session": token || "", "Content-Type": "application/json" },
    });
  }, [authToken]);

  // Check session on mount
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        // Check if first-time setup needed
        const res = await fetch("/api/auth/setup");
        const data = await res.json();
        setNeedsSetup(data.needsSetup);
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", { headers: { "x-session": stored } });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          setAuthToken(stored);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          const setupRes = await fetch("/api/auth/setup");
          const data = await setupRes.json();
          setNeedsSetup(data.needsSetup);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleAuth = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setCurrentUser(user);
    setNeedsSetup(false);
  }, []);

  const handleLogout = async () => {
    const token = authToken;
    setCurrentUser(null);
    setAuthToken(null);
    setPosts([]);
    setCampaigns([]);
    setTeamMembers([]);
    localStorage.removeItem(TOKEN_KEY);
    await fetch("/api/auth/logout", { method: "POST", headers: { "x-session": token } });
  };

  const fetchAll = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [postsRes, campaignsRes, teamRes, goalsRes] = await Promise.all([
        authFetch("/api/scheduler"),
        authFetch("/api/scheduler?type=campaigns"),
        authFetch("/api/team"),
        authFetch("/api/goals"),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (teamRes.ok) setTeamMembers(await teamRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      const ideasRes = await authFetch("/api/ideas");
      if (ideasRes.ok) setIdeas(await ideasRes.json());
    } catch (e) {
      showToast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, [authToken, authFetch]);

  // Poll notifications every 30s
  useEffect(() => {
    if (!authToken) return;
    const fetchNotifs = async () => {
      try {
        const res = await authFetch("/api/notifications");
        if (res.ok) setNotifications(await res.json());
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [authToken, authFetch]);

  useEffect(() => { if (authToken) fetchAll(); }, [authToken, fetchAll]);

  const openNew = (scheduledDate = null, status = "draft") => {
    setEditingPost({ scheduledDate: scheduledDate || "", status });
    setFormOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    try {
      const isNew = !form.id;
      const res = await authFetch(isNew ? "/api/scheduler" : `/api/scheduler/${form.id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      if (isNew) {
        setPosts((p) => [saved, ...p]);
      } else {
        setPosts((p) => p.map((x) => (x.id === saved.id ? saved : x)));
      }
      setFormOpen(false);
      setEditingPost(null);
      showToast(isNew ? "Post created" : "Post updated");
    } catch {
      showToast("Failed to save", "error");
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: newStatus } : p));
    try {
      const res = await authFetch(`/api/scheduler/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ ...post, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Moved to ${statusLabel}`);
    } catch {
      // Revert on failure
      setPosts((prev) => prev.map((p) => p.id === postId ? post : p));
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/scheduler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((p) => p.filter((x) => x.id !== id));
      setFormOpen(false);
      setEditingPost(null);
      showToast("Post deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleNavigate = (targetView, filters = {}) => {
    setView(targetView);
    setListFilters(filters);
  };

  const handleGoalsUpdate = (updated) => setGoals(updated);

  const handleDateChange = async (postId, newDate) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.scheduledDate === newDate) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, scheduledDate: newDate } : p));
    try {
      const res = await authFetch(`/api/scheduler/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ ...post, scheduledDate: newDate }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? post : p));
      showToast("Failed to move post", "error");
    }
  };

  const handleNoteAdded = (postId, note) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, notes: [...(p.notes || []), note] } : p
      )
    );
  };

  const handleMakePost = (idea) => {
    setEditingPost({ title: idea.title || "", caption: idea.description || "", status: "draft" });
    setFormOpen(true);
  };

  const handleMarkAllRead = async () => {
    try {
      const token = authToken;
      await fetch("/api/notifications", { method: "POST", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ ids: [] }) });
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch {}
  };

  const handleCampaignSave = async (data) => {
    try {
      const res = await authFetch("/api/scheduler", {
        method: "POST",
        body: JSON.stringify({ type: "campaign", ...data }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setCampaigns((c) => [...c, saved]);
      setCampaignModalOpen(false);
      showToast("Campaign created");
    } catch {
      showToast("Failed to create campaign", "error");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const scheduledToday = posts.filter((p) => p.scheduledDate === today && p.status === "scheduled").length;

  // Auth guard
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen needsSetup={needsSetup} onAuth={handleAuth} />;
  }

  // Avatar helper
  const userInitials = currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarColors = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let hash = 0;
  for (let i = 0; i < currentUser.name.length; i++) hash = currentUser.name.charCodeAt(i) + ((hash << 5) - hash);
  const userColor = avatarColors[Math.abs(hash) % avatarColors.length];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select option { background: ${C.card}; color: ${C.text}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "220px" : "56px",
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px", minHeight: "64px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${C.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "#fff", flexShrink: 0 }}>T</div>
          {sidebarOpen && <span style={{ fontSize: "15px", fontWeight: "800", color: C.text, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>TCF Studio</span>}
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                title={!sidebarOpen ? v.label : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: active ? C.accentLight : "transparent",
                  color: active ? C.accentBright : C.muted,
                  fontSize: "13px",
                  fontWeight: active ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  marginBottom: "2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.background = C.hover)}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{v.icon}</span>
                {sidebarOpen && v.label}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: "12px 0", padding: "12px 0 0" }}>
            <button
              onClick={() => setCampaignModalOpen(true)}
              title={!sidebarOpen ? "New Campaign" : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: C.muted,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>🎯</span>
              {sidebarOpen && "New Campaign"}
            </button>
          </div>

          {/* Settings button — admin only */}
          {currentUser.role === "admin" && (
            <button
              onClick={() => setSettingsOpen(true)}
              title={!sidebarOpen ? "Settings" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>⚙️</span>
              {sidebarOpen && "Settings"}
            </button>
          )}

          {/* Team button — admin only */}
          {currentUser.role === "admin" && (
            <button
              onClick={() => setTeamModalOpen(true)}
              title={!sidebarOpen ? "Manage Team" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>👥</span>
              {sidebarOpen && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Team
                  {teamMembers.length > 0 && <span style={{ fontSize: "10px", background: "rgba(0,0,0,0.08)", padding: "1px 6px", borderRadius: "10px" }}>{teamMembers.length}</span>}
                </span>
              )}
            </button>
          )}

          {/* Campaigns list — clickable */}
          {sidebarOpen && campaigns.length > 0 && (
            <div style={{ padding: "0 4px", marginTop: "8px" }}>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px", marginBottom: "4px" }}>Campaigns</div>
              {campaigns.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate("list", { campaign: c.name })}
                  style={{ width: "100%", textAlign: "left", fontSize: "12px", color: listFilters.campaign === c.name ? C.accentBright : C.muted, padding: "5px 8px", borderRadius: "6px", cursor: "pointer", border: "none", background: listFilters.campaign === c.name ? C.accentLight : "transparent", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { if (listFilters.campaign !== c.name) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = listFilters.campaign === c.name ? C.accentLight : "transparent"; }}
                >
                  🎯 {c.name}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User + collapse */}
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
          {/* Current user */}
          {sidebarOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", marginBottom: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: userColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>{userInitials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
                <div style={{ fontSize: "10px", color: C.muted, textTransform: "capitalize" }}>{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} title="Sign out" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}>↩</button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
              <div title={`${currentUser.name} · ${currentUser.role}`} style={{ width: "28px", height: "28px", borderRadius: "50%", background: userColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#fff", cursor: "default" }}>{userInitials}</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", textAlign: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: "0 28px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: C.text }}>
              {VIEWS.find((v) => v.id === view)?.label}
            </h1>
            {scheduledToday > 0 && (
              <div style={{ fontSize: "11px", color: C.accentBright, marginTop: "1px" }}>{scheduledToday} post{scheduledToday !== 1 ? "s" : ""} going out today</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>
              {posts.length} total posts
            </div>
            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                style={{ position: "relative", padding: "8px", borderRadius: "8px", border: `1px solid ${notifOpen ? C.accent : C.border}`, background: notifOpen ? C.accentLight : C.inputBg, color: notifOpen ? C.accentBright : C.muted, fontSize: "16px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Notifications"
              >
                🔔
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                    {notifications.filter((n) => !n.read).length > 9 ? "9+" : notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              {/* Notification panel */}
              {notifOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "340px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", boxShadow: C.shadowMd, zIndex: 1000, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>Notifications</span>
                    {notifications.some((n) => !n.read) && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: "11px", color: C.accentBright, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: C.muted, fontSize: "13px" }}>No notifications yet</div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { setNotifOpen(false); const post = posts.find((p) => p.id === n.postId); if (post) openEdit(post); }}
                          style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: n.read ? "transparent" : C.accentLight, cursor: "pointer", transition: "background 0.1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : C.accentLight)}
                        >
                          {!n.read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />}
                          <span style={{ fontSize: "12px", color: C.text }}>
                            <strong>{n.mentionedBy}</strong> mentioned you in <strong>{n.postTitle}</strong>
                          </span>
                          <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            "{n.noteText}"
                          </div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
                            {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => openNew()}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: `linear-gradient(135deg, ${C.accent}, #8B5CF6)`,
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: `0 0 20px rgba(99,102,241,0.3)`,
              }}
            >
              + Create Post
            </button>
          </div>
        </div>

        {/* View area */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
              <div style={{ width: "32px", height: "32px", border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <>
              {view === "dashboard" && <Dashboard posts={posts} campaigns={campaigns} goals={goals} currentUser={currentUser} ideas={ideas} onEdit={openEdit} onNewPost={() => openNew()} onNavigate={handleNavigate} onGoalsUpdate={handleGoalsUpdate} onIdeasUpdate={setIdeas} onMakePost={handleMakePost} token={authToken} />}
              {view === "calendar" && <CalendarView posts={posts} onEdit={openEdit} onNewPost={(date) => openNew(date)} onDateChange={handleDateChange} />}
              {view === "pipeline" && <Pipeline posts={posts} onEdit={openEdit} onNewPost={(date, status) => openNew(date, status || "draft")} onStatusChange={handleStatusChange} currentUser={currentUser} />}
              {view === "list" && <ListView key={JSON.stringify(listFilters)} posts={posts} campaigns={campaigns} onEdit={openEdit} onNewPost={() => openNew()} initialFilters={listFilters} />}
              {view === "slack" && <SlackPlanner currentUser={currentUser} token={authToken} onMakePost={handleMakePost} />}
              {view === "links" && <QuickLinks currentUser={currentUser} token={authToken} />}
              {view === "assets" && <AssetTracker currentUser={currentUser} token={authToken} teamMembers={teamMembers} />}
              {view === "mydash" && <MyDashboard currentUser={currentUser} token={authToken} />}
              {view === "profile" && <MemberProfile currentUser={currentUser} token={authToken} teamMembers={teamMembers} />}
            </>
          )}
        </div>
      </div>

      {/* Content form modal */}
      {formOpen && (
        <ContentForm
          post={editingPost}
          campaigns={campaigns}
          teamMembers={teamMembers}
          currentUser={currentUser}
          token={authToken}
          onSave={handleSave}
          onDelete={handleDelete}
          onNoteAdded={handleNoteAdded}
          onClose={() => { setFormOpen(false); setEditingPost(null); }}
        />
      )}

      {/* Campaign modal */}
      {campaignModalOpen && (
        <CampaignModal
          onSave={handleCampaignSave}
          onClose={() => setCampaignModalOpen(false)}
        />
      )}

      {/* Team manager modal */}
      {teamModalOpen && (
        <TeamManager
          teamMembers={teamMembers}
          currentUser={currentUser}
          token={authToken}
          onClose={() => setTeamModalOpen(false)}
          onTeamUpdate={setTeamMembers}
        />
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          token={authToken}
          currentUser={currentUser}
          onClose={() => setSettingsOpen(false)}
          onSettingsUpdate={() => {}}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
