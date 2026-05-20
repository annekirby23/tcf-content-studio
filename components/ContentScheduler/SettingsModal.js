"use client";

import { useState, useEffect, useCallback } from "react";
import { C, THEMES, PLATFORMS, PILLARS } from "./constants";

const DEFAULT_CONTENT_TYPES = [
  { id: "post", label: "Static Post" },
  { id: "reel", label: "Reel / Short Video" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Long-Form Video" },
  { id: "live", label: "Live Stream" },
  { id: "article", label: "Article / Blog" },
  { id: "newsletter", label: "Newsletter" },
  { id: "podcast", label: "Podcast Episode" },
  { id: "thread", label: "Thread" },
];

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Simple label-only list tab (Content Types, Pillars) ─────────────────────

function SimpleListTab({ items, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === item.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={inputStyle} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(items.map((x) => x.id === item.id ? { ...x, label: editLabel.trim() } : x));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{item.label}</span>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(item.id); setEditLabel(item.label); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this item?")) return;
                        await onSave(items.filter((x) => x.id !== item.id));
                      }}
                      style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}
                    >🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Item</p>
          <form onSubmit={async (e) => { e.preventDefault(); if (!newLabel.trim()) return; await onSave([...items, { id: genId(), label: newLabel.trim() }]); setNewLabel(""); }} style={{ display: "flex", gap: 10 }}>
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (required)" required style={inputStyle} />
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Themes tab (label + emoji + color) ─────────────────────────────────────

function ThemesTab({ themes, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editColor, setEditColor] = useState("#6366F1");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const colorInput = { width: 36, height: 36, border: "none", borderRadius: 7, padding: 2, cursor: "pointer", background: "transparent", flexShrink: 0 };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {themes.map((theme) => (
          <div key={theme.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === theme.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={colorInput} />
                  <input type="text" value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} placeholder="Emoji" maxLength={2} style={{ ...inputStyle, width: 60, flexShrink: 0 }} />
                  <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Label" style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(themes.map((t) => t.id === theme.id ? { ...t, label: editLabel.trim(), emoji: editEmoji.trim().slice(0, 2) || t.emoji, color: editColor } : t));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: theme.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{theme.emoji}</span>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{theme.label}</span>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(theme.id); setEditLabel(theme.label); setEditEmoji(theme.emoji || ""); setEditColor(theme.color || "#6366F1"); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button onClick={async () => { if (!confirm("Delete this theme?")) return; await onSave(themes.filter((t) => t.id !== theme.id)); }} style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Theme</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            await onSave([...themes, { id: genId(), label: newLabel.trim(), emoji: newEmoji.trim().slice(0, 2) || "📌", color: newColor }]);
            setNewLabel(""); setNewEmoji(""); setNewColor("#6366F1");
          }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={colorInput} />
              <input type="text" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="Emoji" maxLength={2} style={{ ...inputStyle, width: 60, flexShrink: 0 }} />
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Theme label (required)" required style={inputStyle} />
            </div>
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content", opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add Theme"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Platforms tab (label + icon/emoji + color) ───────────────────────────────

function PlatformsTab({ platforms, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("#6366F1");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const colorInput = { width: 36, height: 36, border: "none", borderRadius: 7, padding: 2, cursor: "pointer", background: "transparent", flexShrink: 0 };

  return (
    <div>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        Changes here update the platform list in the post form. Icon can be any emoji.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {platforms.map((p) => (
          <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === p.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={colorInput} />
                  <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Icon emoji" maxLength={4} style={{ ...inputStyle, width: 72, flexShrink: 0 }} />
                  <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Platform name" style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(platforms.map((x) => x.id === p.id ? { ...x, label: editLabel.trim(), icon: editIcon.trim() || x.icon, color: editColor, bg: `${editColor}1F` } : x));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{p.label}</span>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(p.id); setEditLabel(p.label); setEditIcon(p.icon || ""); setEditColor(p.color || "#6366F1"); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button onClick={async () => { if (!confirm("Delete this platform?")) return; await onSave(platforms.filter((x) => x.id !== p.id)); }} style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Platform</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            const id = newLabel.trim().toLowerCase().replace(/\s+/g, "-");
            await onSave([...platforms, { id: id + "-" + genId().slice(0, 4), label: newLabel.trim(), icon: newIcon.trim() || "📡", color: newColor, bg: `${newColor}1F` }]);
            setNewLabel(""); setNewIcon(""); setNewColor("#6366F1");
          }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={colorInput} />
              <input type="text" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon emoji" maxLength={4} style={{ ...inputStyle, width: 72, flexShrink: 0 }} />
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Platform name (required)" required style={inputStyle} />
            </div>
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content", opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add Platform"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "themes", label: "Themes" },
  { id: "contentTypes", label: "Content Types" },
  { id: "platforms", label: "Platforms" },
  { id: "pillars", label: "Content Pillars" },
  { id: "bugreports", label: "🐛 Bug Reports" },
];

// ─── Bug Reports Tab ──────────────────────────────────────────────────────────

const BUG_PRIORITY = [
  { value: "low",      label: "Low",      color: "#10B981" },
  { value: "medium",   label: "Medium",   color: "#F59E0B" },
  { value: "high",     label: "High",     color: "#EF4444" },
  { value: "critical", label: "Critical", color: "#7C3AED" },
];
const BUG_STATUS = [
  { value: "open",        label: "Open",        color: "#3B82F6" },
  { value: "in_progress", label: "In Progress", color: "#F59E0B" },
  { value: "resolved",    label: "Resolved",    color: "#10B981" },
];

function BugReportsTab({ token, currentUser, isAdmin }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingNote, setEditingNote] = useState({});

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "7px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  useEffect(() => {
    fetch("/api/bugreports", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bugreports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ title, description, priority }),
      });
      const newReport = await res.json();
      setReports((prev) => [newReport, ...prev]);
      setTitle(""); setDescription(""); setPriority("medium"); setShowForm(false);
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch("/api/bugreports", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ id, status }),
      });
      const updated = await res.json();
      setReports((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const saveNote = async (id) => {
    try {
      const res = await fetch("/api/bugreports", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ id, adminNote: editingNote[id] }),
      });
      const updated = await res.json();
      setReports((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this bug report?")) return;
    try {
      await fetch("/api/bugreports", { method: "DELETE", headers: { "Content-Type": "application/json", "x-session": token }, body: JSON.stringify({ id }) });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const openCount = reports.filter((r) => r.status !== "resolved").length;

  return (
    <div>
      {/* Submit form toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", color: C.muted }}>{openCount} open report{openCount !== 1 ? "s" : ""}</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: showForm ? C.border : C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "+ Report a Bug"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "600", display: "block", marginBottom: "4px" }}>Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue…" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "600", display: "block", marginBottom: "4px" }}>Details (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Steps to reproduce, what you expected vs what happened…" style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {BUG_PRIORITY.map((p) => (
                <button key={p.value} onClick={() => setPriority(p.value)} style={{ padding: "4px 10px", borderRadius: "20px", border: `1px solid ${priority === p.value ? p.color : C.border}`, background: priority === p.value ? p.color + "20" : "transparent", color: priority === p.value ? p.color : C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={submit} disabled={!title.trim() || saving} style={{ padding: "7px 16px", borderRadius: "7px", border: "none", background: title.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: title.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "24px 0", color: C.muted, fontSize: "13px" }}>Loading…</div>
      ) : reports.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: C.muted, fontSize: "13px" }}>No bug reports yet. 🎉</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reports.map((r) => {
            const priCfg = BUG_PRIORITY.find((p) => p.value === r.priority) || BUG_PRIORITY[1];
            const stCfg = BUG_STATUS.find((s) => s.value === r.status) || BUG_STATUS[0];
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${priCfg.color}`, borderRadius: "9px", padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: r.status === "resolved" ? C.muted : C.text, textDecoration: r.status === "resolved" ? "line-through" : "none", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : r.id)}>{r.title}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "10px", background: priCfg.color + "20", color: priCfg.color, fontWeight: "700" }}>{priCfg.label}</span>
                      <span style={{ fontSize: "10px", color: C.muted }}>by {r.submittedBy}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {isAdmin ? (
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        style={{ padding: "3px 8px", borderRadius: "7px", border: `1px solid ${C.border}`, background: stCfg.color + "20", color: stCfg.color, fontSize: "11px", fontWeight: "600", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {BUG_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: stCfg.color + "20", color: stCfg.color, fontWeight: "700" }}>{stCfg.label}</span>
                    )}
                    {isAdmin && (
                      <button onClick={() => deleteReport(r.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "13px", padding: "2px" }}>🗑</button>
                    )}
                  </div>
                </div>
                {expanded && (
                  <div style={{ marginTop: "10px", borderTop: `1px solid ${C.border}`, paddingTop: "10px" }}>
                    {r.description && <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.7", marginBottom: "10px", whiteSpace: "pre-wrap" }}>{r.description}</div>}
                    {isAdmin && (
                      <div>
                        <label style={{ fontSize: "11px", color: C.muted, fontWeight: "600", display: "block", marginBottom: "4px" }}>Admin Note</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            value={editingNote[r.id] !== undefined ? editingNote[r.id] : (r.adminNote || "")}
                            onChange={(e) => setEditingNote((n) => ({ ...n, [r.id]: e.target.value }))}
                            placeholder="Add a note for the team…"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button onClick={() => saveNote(r.id)} style={{ padding: "6px 12px", borderRadius: "7px", border: "none", background: C.accent, color: "#fff", fontSize: "11px", fontWeight: "600", cursor: "pointer", flexShrink: 0 }}>Save</button>
                        </div>
                        {r.adminNote && <div style={{ fontSize: "12px", color: C.accent, marginTop: "6px" }}>📝 {r.adminNote}</div>}
                      </div>
                    )}
                    {!isAdmin && r.adminNote && <div style={{ fontSize: "12px", color: C.accent, marginTop: "6px" }}>📝 Admin note: {r.adminNote}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({ token, currentUser, onClose, onSettingsUpdate }) {
  const [activeTab, setActiveTab] = useState("themes");
  const [data, setData] = useState({ themes: [], contentTypes: [], platforms: [], pillars: [] });
  const [loading, setLoading] = useState({ themes: true, contentTypes: true, platforms: true, pillars: true });
  const [saving, setSaving] = useState({ themes: false, contentTypes: false, platforms: false, pillars: false });

  const isAdmin = currentUser?.role === "admin";

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", "x-session": token }),
    [token]
  );

  const DEFAULTS = {
    themes: THEMES,
    contentTypes: DEFAULT_CONTENT_TYPES,
    platforms: PLATFORMS,
    pillars: PILLARS,
  };

  useEffect(() => {
    const types = ["themes", "contentTypes", "platforms", "pillars"];
    types.forEach(async (type) => {
      try {
        const res = await fetch(`/api/settings?type=${type}`, { headers: authHeaders() });
        const fetched = res.ok ? await res.json() : null;
        setData((d) => ({ ...d, [type]: Array.isArray(fetched) && fetched.length > 0 ? fetched : [...DEFAULTS[type]] }));
      } catch {
        setData((d) => ({ ...d, [type]: [...DEFAULTS[type]] }));
      } finally {
        setLoading((l) => ({ ...l, [type]: false }));
      }
    });
  }, [authHeaders]);

  async function handleSave(type, updated) {
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ type, data: updated }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setData((d) => ({ ...d, [type]: updated }));
      onSettingsUpdate?.({ type, data: updated });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: C.card, borderRadius: 14, boxShadow: C.shadowMd, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>⚙️ App Settings</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: C.muted, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 24px", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "transparent", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                color: activeTab === tab.id ? C.accent : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: 13, padding: "12px 14px", cursor: "pointer", marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!isAdmin && activeTab !== "bugreports" && (
          <div style={{ background: "#FEF3C7", borderBottom: `1px solid #FDE68A`, padding: "10px 24px", fontSize: 13, color: "#92400E" }}>
            Read-only — admin role required to make changes.
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading[activeTab] && activeTab !== "bugreports" ? (
            <div style={{ color: C.muted, fontSize: 14, padding: "24px 0" }}>Loading…</div>
          ) : (
            <>
              {activeTab === "themes" && (
                <ThemesTab themes={data.themes} isAdmin={isAdmin} saving={saving.themes} onSave={(updated) => handleSave("themes", updated)} />
              )}
              {activeTab === "contentTypes" && (
                <SimpleListTab items={data.contentTypes} isAdmin={isAdmin} saving={saving.contentTypes} onSave={(updated) => handleSave("contentTypes", updated)} />
              )}
              {activeTab === "platforms" && (
                <PlatformsTab platforms={data.platforms} isAdmin={isAdmin} saving={saving.platforms} onSave={(updated) => handleSave("platforms", updated)} />
              )}
              {activeTab === "pillars" && (
                <SimpleListTab items={data.pillars} isAdmin={isAdmin} saving={saving.pillars} onSave={(updated) => handleSave("pillars", updated)} />
              )}
              {activeTab === "bugreports" && (
                <BugReportsTab token={token} currentUser={currentUser} isAdmin={isAdmin} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
