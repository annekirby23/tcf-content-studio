"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const BUG_PRIORITY = [
  { value: "low",      label: "Low",      color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { value: "medium",   label: "Medium",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { value: "high",     label: "High",     color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  { value: "critical", label: "Critical", color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
];
const BUG_STATUS = [
  { value: "open",        label: "Open",        color: "#3B82F6" },
  { value: "in_progress", label: "In Progress", color: "#F59E0B" },
  { value: "resolved",    label: "Resolved",    color: "#10B981" },
];

export default function BugReportsView({ token, currentUser }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingNote, setEditingNote] = useState({});
  const [statusFilter, setStatusFilter] = useState("open");

  const isAdmin = currentUser?.role === "admin";

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "8px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  useEffect(() => {
    apiFetch("/api/bugreports", {}, token)
      .then((r) => r.json())
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/bugreports", {
        method: "POST",
        body: JSON.stringify({ title, description, priority }),
      }, token);
      const newReport = await res.json();
      setReports((prev) => [newReport, ...prev]);
      setTitle(""); setDescription(""); setPriority("medium"); setShowForm(false);
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await apiFetch("/api/bugreports", { method: "PUT", body: JSON.stringify({ id, status }) }, token);
      const updated = await res.json();
      setReports((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const saveNote = async (id) => {
    try {
      const res = await apiFetch("/api/bugreports", { method: "PUT", body: JSON.stringify({ id, adminNote: editingNote[id] ?? "" }) }, token);
      const updated = await res.json();
      setReports((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this bug report?")) return;
    try {
      await apiFetch("/api/bugreports", { method: "DELETE", body: JSON.stringify({ id }) }, token);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const filtered = reports.filter((r) => {
    if (statusFilter === "open") return r.status !== "resolved";
    if (statusFilter === "resolved") return r.status === "resolved";
    return true;
  });

  const openCount = reports.filter((r) => r.status !== "resolved").length;

  return (
    <div style={{ padding: "24px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: C.text }}>🐛 Bug Reports</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Found something broken? Log it here so the team can track and fix it.</p>
      </div>

      {/* Action row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: showForm ? C.border : C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "🐛 Report a Bug"}
        </button>
        <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
          {[["open","Open"], ["resolved","Resolved"], ["all","All"]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${statusFilter === val ? C.accent : C.border}`, background: statusFilter === val ? C.accentLight : "transparent", color: statusFilter === val ? C.accent : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              {lbl} {val === "open" ? `(${openCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Submit form */}
      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", boxShadow: C.shadow }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: C.text }}>Submit a Bug Report</h3>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue…" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Details (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Steps to reproduce, what you expected vs what happened, which page/feature…" style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Priority</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {BUG_PRIORITY.map((p) => (
                  <button key={p.value} onClick={() => setPriority(p.value)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${priority === p.value ? p.color : C.border}`, background: priority === p.value ? p.bg : "transparent", color: priority === p.value ? p.color : C.muted, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submit} disabled={!title.trim() || saving} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: title.trim() && !saving ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: title.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: C.muted }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, borderRadius: "14px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
          <div style={{ fontSize: "15px", fontWeight: "600", color: C.text, marginBottom: "4px" }}>
            {statusFilter === "open" ? "No open bug reports!" : "Nothing here yet."}
          </div>
          <div style={{ fontSize: "13px" }}>Click "Report a Bug" above to log an issue.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((r) => {
            const priCfg = BUG_PRIORITY.find((p) => p.value === r.priority) || BUG_PRIORITY[1];
            const stCfg = BUG_STATUS.find((s) => s.value === r.status) || BUG_STATUS[0];
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${priCfg.color}`, borderRadius: "12px", padding: "16px 20px", transition: "box-shadow 0.15s", boxShadow: expanded ? C.shadowMd : C.shadow }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : r.id)}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: r.status === "resolved" ? C.muted : C.text, textDecoration: r.status === "resolved" ? "line-through" : "none", marginBottom: "6px" }}>
                      {r.title}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: priCfg.bg, color: priCfg.color, fontWeight: "700" }}>{priCfg.label}</span>
                      <span style={{ fontSize: "11px", color: C.muted }}>by {r.submittedBy}</span>
                      <span style={{ fontSize: "11px", color: C.muted }}>{timeAgo(r.createdAt)}</span>
                      {r.adminNote && <span style={{ fontSize: "11px", color: C.accent }}>📝 Has note</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {isAdmin ? (
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        style={{ padding: "4px 10px", borderRadius: "8px", border: `1px solid ${stCfg.color}40`, background: stCfg.color + "18", color: stCfg.color, fontSize: "11px", fontWeight: "700", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {BUG_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: stCfg.color + "18", color: stCfg.color, fontWeight: "700" }}>{stCfg.label}</span>
                    )}
                    {isAdmin && (
                      <button onClick={() => deleteReport(r.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "2px 4px", opacity: 0.6 }} title="Delete">🗑</button>
                    )}
                    <button onClick={() => setExpandedId(expanded ? null : r.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "16px", padding: "2px 4px", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</button>
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
                    {r.description ? (
                      <div style={{ fontSize: "13px", color: C.muted, lineHeight: "1.8", marginBottom: "14px", whiteSpace: "pre-wrap" }}>{r.description}</div>
                    ) : (
                      <div style={{ fontSize: "13px", color: C.muted, fontStyle: "italic", marginBottom: "14px" }}>No additional details provided.</div>
                    )}
                    {r.adminNote && (
                      <div style={{ background: C.accentLight, border: `1px solid ${C.accent}30`, borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", fontSize: "13px", color: C.accent }}>
                        📝 <strong>Note:</strong> {r.adminNote}
                      </div>
                    )}
                    {isAdmin && (
                      <div>
                        <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Admin Note</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            value={editingNote[r.id] !== undefined ? editingNote[r.id] : (r.adminNote || "")}
                            onChange={(e) => setEditingNote((n) => ({ ...n, [r.id]: e.target.value }))}
                            placeholder="Add a note for the team — e.g. status update, workaround, ETA…"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button onClick={() => saveNote(r.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", flexShrink: 0 }}>Save</button>
                        </div>
                      </div>
                    )}
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
