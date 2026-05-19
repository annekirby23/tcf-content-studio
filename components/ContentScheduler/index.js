"use client";

import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";
import ContentForm from "./ContentForm";
import Dashboard from "./Dashboard";
import CalendarView from "./CalendarView";
import Pipeline from "./Pipeline";
import ListView from "./ListView";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "pipeline", label: "Pipeline", icon: "⬛" },
  { id: "list", label: "List", icon: "☰" },
];

function CampaignModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [goal, setGoal] = useState("");

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: C.text }}>New Campaign</h2>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Campaign Name *</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer 2026 Launch" autoFocus />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Start Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "dark" }} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>End Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "dark" }} value={end} onChange={(e) => setEnd(e.target.value)} />
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
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, campaignsRes] = await Promise.all([
        fetch("/api/scheduler"),
        fetch("/api/scheduler?type=campaigns"),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
    } catch (e) {
      showToast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
      const res = await fetch(isNew ? "/api/scheduler" : `/api/scheduler/${form.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
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

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/scheduler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((p) => p.filter((x) => x.id !== id));
      setFormOpen(false);
      setEditingPost(null);
      showToast("Post deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleCampaignSave = async (data) => {
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                onMouseEnter={(e) => !active && (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>🎯</span>
              {sidebarOpen && "New Campaign"}
            </button>
          </div>

          {/* Campaigns list */}
          {sidebarOpen && campaigns.length > 0 && (
            <div style={{ padding: "0 4px" }}>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px", marginBottom: "4px" }}>Campaigns</div>
              {campaigns.slice(0, 8).map((c) => (
                <div key={c.id} style={{ fontSize: "12px", color: C.muted, padding: "5px 8px", borderRadius: "6px", cursor: "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  · {c.name}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", textAlign: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
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
              {view === "dashboard" && <Dashboard posts={posts} onEdit={openEdit} onNewPost={() => openNew()} />}
              {view === "calendar" && <CalendarView posts={posts} onEdit={openEdit} onNewPost={(date) => openNew(date)} />}
              {view === "pipeline" && <Pipeline posts={posts} onEdit={openEdit} onNewPost={(date, status) => openNew(date, status || "draft")} />}
              {view === "list" && <ListView posts={posts} campaigns={campaigns} onEdit={openEdit} onNewPost={() => openNew()} />}
            </>
          )}
        </div>
      </div>

      {/* Content form modal */}
      {formOpen && (
        <ContentForm
          post={editingPost}
          campaigns={campaigns}
          onSave={handleSave}
          onDelete={handleDelete}
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

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
