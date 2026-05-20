"use client";

import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: C.muted,
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "6px",
};

function textInput(extra = {}) {
  return {
    padding: "8px 10px",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    background: C.inputBg,
    color: C.text,
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    ...extra,
  };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const WAIT_STATUSES = {
  Waiting: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  Offered: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  Confirmed: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  Cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const RELOC_STATUSES = {
  Requested: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  Scheduled: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  Completed: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

function StatusBadge({ status, statusMap }) {
  const s = statusMap[status] || { color: C.muted, bg: C.cardBg };
  return (
    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, fontWeight: "700" }}>{status}</span>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button onClick={handleCopy} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: copied ? "rgba(16,185,129,0.1)" : "none", color: copied ? "#10B981" : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
      {copied ? "✓ Copied!" : `📋 ${label}`}
    </button>
  );
}

// ── Link Button ───────────────────────────────────────────────────────────────
function LinkButton({ url, label }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.accent, fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
      {label} ↗
    </a>
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────────
function InfoCard({ icon, title, children, isAdmin, editContent, onToggleEdit, editing, saving, onSave, onCancel }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px", boxShadow: C.shadow, marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: C.text }}>{title}</h3>
        </div>
        {isAdmin && !editing && (
          <button onClick={onToggleEdit} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>✏️ Edit</button>
        )}
      </div>
      {editing ? (
        <div>
          {editContent}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "14px" }}>
            <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={onSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ── Waiting List ──────────────────────────────────────────────────────────────
function WaitingListCard({ list, isAdmin, token, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", email: "", date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newEntry.name.trim()) return;
    setSaving(true);
    const updated = [...list, { id: genId(), ...newEntry, status: "Waiting" }];
    try {
      const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ waitingList: updated }) }, token);
      const data = await res.json();
      onUpdate(data);
      setNewEntry({ name: "", email: "", date: "", notes: "" });
      setShowAddForm(false);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    const updated = list.map((e) => e.id === id ? { ...e, status: newStatus } : e);
    const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ waitingList: updated }) }, token);
    const data = await res.json();
    onUpdate(data);
  }

  async function handleRemove(id) {
    if (!confirm("Remove this entry from the waiting list?")) return;
    const updated = list.filter((e) => e.id !== id);
    const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ waitingList: updated }) }, token);
    const data = await res.json();
    onUpdate(data);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px", boxShadow: C.shadow, marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>📋</span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: C.text }}>Office Waiting List</h3>
          <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: C.accentLight, color: C.accent, fontWeight: "700" }}>{list.length}</span>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddForm((s) => !s)} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>+ Add</button>
        )}
      </div>

      {showAddForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={newEntry.name} onChange={(e) => setNewEntry((d) => ({ ...d, name: e.target.value }))} style={textInput({ width: "100%" })} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={newEntry.email} onChange={(e) => setNewEntry((d) => ({ ...d, email: e.target.value }))} style={textInput({ width: "100%" })} placeholder="email@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Date Added</label>
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry((d) => ({ ...d, date: e.target.value }))} style={textInput({ width: "100%" })} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input value={newEntry.notes} onChange={(e) => setNewEntry((d) => ({ ...d, notes: e.target.value }))} style={textInput({ width: "100%" })} placeholder="Optional notes" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddForm(false)} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving || !newEntry.name.trim()} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", opacity: saving || !newEntry.name.trim() ? 0.6 : 1 }}>{saving ? "Saving…" : "Add"}</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", padding: "20px" }}>No entries on the waiting list.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Email", "Date", "Notes", "Status", ""].map((h) => (
                  <th key={h} style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((entry, i) => (
                <tr key={entry.id} style={{ background: i % 2 === 0 ? "transparent" : C.cardBg }}>
                  <td style={{ padding: "10px", fontSize: "13px", color: C.text, fontWeight: "600", borderBottom: `1px solid ${C.border}` }}>{entry.name}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{entry.email}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{entry.date}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}`, maxWidth: "160px" }}>{entry.notes}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                    {isAdmin ? (
                      <select
                        value={entry.status || "Waiting"}
                        onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                        style={{ padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: "6px", background: C.inputBg, color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none" }}
                      >
                        {Object.keys(WAIT_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <StatusBadge status={entry.status || "Waiting"} statusMap={WAIT_STATUSES} />
                    )}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                    {isAdmin && (
                      <button onClick={() => handleRemove(entry.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Desk Relocation List ──────────────────────────────────────────────────────
function DeskRelocationCard({ list, isAdmin, token, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", fromDesk: "", toDesk: "", date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newEntry.name.trim()) return;
    setSaving(true);
    const updated = [...list, { id: genId(), ...newEntry, status: "Requested" }];
    try {
      const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ deskRelocationList: updated }) }, token);
      const data = await res.json();
      onUpdate(data);
      setNewEntry({ name: "", fromDesk: "", toDesk: "", date: "", notes: "" });
      setShowAddForm(false);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    const updated = list.map((e) => e.id === id ? { ...e, status: newStatus } : e);
    const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ deskRelocationList: updated }) }, token);
    const data = await res.json();
    onUpdate(data);
  }

  async function handleRemove(id) {
    if (!confirm("Remove this relocation entry?")) return;
    const updated = list.filter((e) => e.id !== id);
    const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify({ deskRelocationList: updated }) }, token);
    const data = await res.json();
    onUpdate(data);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px", boxShadow: C.shadow, marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🔄</span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: C.text }}>Desk Relocation List</h3>
          <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: C.accentLight, color: C.accent, fontWeight: "700" }}>{list.length}</span>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddForm((s) => !s)} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>+ Add</button>
        )}
      </div>

      {showAddForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={labelStyle}>Member Name *</label>
              <input value={newEntry.name} onChange={(e) => setNewEntry((d) => ({ ...d, name: e.target.value }))} style={textInput({ width: "100%" })} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry((d) => ({ ...d, date: e.target.value }))} style={textInput({ width: "100%" })} />
            </div>
            <div>
              <label style={labelStyle}>From Desk</label>
              <input value={newEntry.fromDesk} onChange={(e) => setNewEntry((d) => ({ ...d, fromDesk: e.target.value }))} style={textInput({ width: "100%" })} placeholder="e.g. Desk 12A" />
            </div>
            <div>
              <label style={labelStyle}>To Desk</label>
              <input value={newEntry.toDesk} onChange={(e) => setNewEntry((d) => ({ ...d, toDesk: e.target.value }))} style={textInput({ width: "100%" })} placeholder="e.g. Desk 8B" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <input value={newEntry.notes} onChange={(e) => setNewEntry((d) => ({ ...d, notes: e.target.value }))} style={textInput({ width: "100%" })} placeholder="Optional notes" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddForm(false)} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving || !newEntry.name.trim()} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", opacity: saving || !newEntry.name.trim() ? 0.6 : 1 }}>{saving ? "Saving…" : "Add"}</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", padding: "20px" }}>No desk relocations on file.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Member", "From", "To", "Date", "Notes", "Status", ""].map((h) => (
                  <th key={h} style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((entry, i) => (
                <tr key={entry.id} style={{ background: i % 2 === 0 ? "transparent" : C.cardBg }}>
                  <td style={{ padding: "10px", fontSize: "13px", color: C.text, fontWeight: "600", borderBottom: `1px solid ${C.border}` }}>{entry.name}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{entry.fromDesk}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{entry.toDesk}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{entry.date}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}`, maxWidth: "140px" }}>{entry.notes}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                    {isAdmin ? (
                      <select
                        value={entry.status || "Requested"}
                        onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                        style={{ padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: "6px", background: C.inputBg, color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none" }}
                      >
                        {Object.keys(RELOC_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <StatusBadge status={entry.status || "Requested"} statusMap={RELOC_STATUSES} />
                    )}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                    {isAdmin && (
                      <button onClick={() => handleRemove(entry.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MembershipInfoView({ token, currentUser }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing state per card
  const [editingCard, setEditingCard] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/membershipinfo", {}, token);
      if (res.ok) setInfo(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  function startEdit(cardKey, fields) {
    const d = {};
    fields.forEach((f) => { d[f] = info?.[f] || ""; });
    setDraft(d);
    setEditingCard(cardKey);
  }

  function cancelEdit() { setEditingCard(null); setDraft({}); }

  async function saveEdit(fields) {
    setSaving(true);
    const payload = {};
    fields.forEach((f) => { payload[f] = draft[f] || ""; });
    try {
      const res = await apiFetch("/api/membershipinfo", { method: "PUT", body: JSON.stringify(payload) }, token);
      const data = await res.json();
      setInfo(data);
      setEditingCard(null);
      setDraft({});
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>Loading membership info…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: C.text }}>Membership Information</h2>
        <p style={{ margin: "6px 0 0", fontSize: "14px", color: C.muted }}>Centralized reference for membership onboarding, billing, and management.</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Left Column */}
        <div style={{ flex: "1 1 380px", minWidth: 0 }}>
          {/* 1. New Member Onboarding */}
          <InfoCard
            icon="🆕"
            title="New Member Onboarding"
            isAdmin={isAdmin}
            editing={editingCard === "onboarding"}
            saving={saving}
            onToggleEdit={() => startEdit("onboarding", ["signupFormDetails", "signupFormUrl", "signupLink"])}
            onSave={() => saveEdit(["signupFormDetails", "signupFormUrl", "signupLink"])}
            onCancel={cancelEdit}
            editContent={
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Sign-Up Form Details</label>
                  <textarea value={draft.signupFormDetails || ""} onChange={(e) => setDraft((d) => ({ ...d, signupFormDetails: e.target.value }))} rows={3} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Details about the sign-up form and process…" />
                </div>
                <div>
                  <label style={labelStyle}>Sign-Up Form URL</label>
                  <input value={draft.signupFormUrl || ""} onChange={(e) => setDraft((d) => ({ ...d, signupFormUrl: e.target.value }))} style={textInput({ width: "100%" })} placeholder="https://…" />
                </div>
                <div>
                  <label style={labelStyle}>Sign-Up Direct Link</label>
                  <input value={draft.signupLink || ""} onChange={(e) => setDraft((d) => ({ ...d, signupLink: e.target.value }))} style={textInput({ width: "100%" })} placeholder="https://…" />
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ paddingBottom: "14px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Sign-Up Form</div>
                {info?.signupFormDetails && <p style={{ margin: "0 0 10px", fontSize: "13px", color: C.text, lineHeight: "1.7" }}>{info.signupFormDetails}</p>}
                {info?.signupFormUrl ? <LinkButton url={info.signupFormUrl} label="Open Form" /> : <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No URL set.</span>}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Sign-Up Link</div>
                {info?.signupLink ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <code style={{ fontSize: "12px", color: C.text, background: C.cardBg, padding: "6px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, flex: 1, wordBreak: "break-all" }}>{info.signupLink}</code>
                    <CopyButton text={info.signupLink} label="Copy" />
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No link set.</span>
                )}
              </div>
            </div>
          </InfoCard>

          {/* 2. Welcome Email */}
          <InfoCard
            icon="📧"
            title="Welcome Email"
            isAdmin={isAdmin}
            editing={editingCard === "welcomeEmail"}
            saving={saving}
            onToggleEdit={() => startEdit("welcomeEmail", ["welcomeEmail"])}
            onSave={() => saveEdit(["welcomeEmail"])}
            onCancel={cancelEdit}
            editContent={
              <div>
                <label style={labelStyle}>Welcome Email Template</label>
                <textarea value={draft.welcomeEmail || ""} onChange={(e) => setDraft((d) => ({ ...d, welcomeEmail: e.target.value }))} rows={10} style={textInput({ width: "100%", resize: "vertical", lineHeight: "1.7" })} placeholder="Paste your welcome email template here…" />
              </div>
            }
          >
            {info?.welcomeEmail ? (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                  <CopyButton text={info.welcomeEmail} label="Copy Email" />
                </div>
                <pre style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word", background: C.cardBg, padding: "14px", borderRadius: "10px", border: `1px solid ${C.border}`, maxHeight: "280px", overflowY: "auto" }}>
                  {info.welcomeEmail}
                </pre>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "13px", color: C.muted, fontStyle: "italic" }}>{isAdmin ? "Click Edit to add the welcome email template." : "No welcome email set."}</p>
            )}
          </InfoCard>

          {/* 3. Membership Terms */}
          <InfoCard
            icon="📄"
            title="Membership Terms"
            isAdmin={isAdmin}
            editing={editingCard === "terms"}
            saving={saving}
            onToggleEdit={() => startEdit("terms", ["membershipTerms", "membershipTermsUrl"])}
            onSave={() => saveEdit(["membershipTerms", "membershipTermsUrl"])}
            onCancel={cancelEdit}
            editContent={
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Terms Notes / Summary</label>
                  <textarea value={draft.membershipTerms || ""} onChange={(e) => setDraft((d) => ({ ...d, membershipTerms: e.target.value }))} rows={4} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Summary or key points of the membership terms…" />
                </div>
                <div>
                  <label style={labelStyle}>Terms URL</label>
                  <input value={draft.membershipTermsUrl || ""} onChange={(e) => setDraft((d) => ({ ...d, membershipTermsUrl: e.target.value }))} style={textInput({ width: "100%" })} placeholder="https://…" />
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {info?.membershipTerms && <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.7" }}>{info.membershipTerms}</p>}
              {info?.membershipTermsUrl ? <LinkButton url={info.membershipTermsUrl} label="View Terms" /> : <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No terms URL set.</span>}
            </div>
          </InfoCard>

          {/* 4. Billing */}
          <InfoCard
            icon="💳"
            title="Billing & Payments"
            isAdmin={isAdmin}
            editing={editingCard === "billing"}
            saving={saving}
            onToggleEdit={() => startEdit("billing", ["billingDetails", "billingUrl"])}
            onSave={() => saveEdit(["billingDetails", "billingUrl"])}
            onCancel={cancelEdit}
            editContent={
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Billing Details</label>
                  <textarea value={draft.billingDetails || ""} onChange={(e) => setDraft((d) => ({ ...d, billingDetails: e.target.value }))} rows={4} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Billing schedule, payment methods, policies…" />
                </div>
                <div>
                  <label style={labelStyle}>Billing Portal URL</label>
                  <input value={draft.billingUrl || ""} onChange={(e) => setDraft((d) => ({ ...d, billingUrl: e.target.value }))} style={textInput({ width: "100%" })} placeholder="https://…" />
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {info?.billingDetails && <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.7" }}>{info.billingDetails}</p>}
              {info?.billingUrl ? <LinkButton url={info.billingUrl} label="Manage Billing" /> : <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No billing URL set.</span>}
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div style={{ flex: "1 1 380px", minWidth: 0 }}>
          {/* 5. Ending a Membership */}
          <InfoCard
            icon="👋"
            title="Ending a Membership"
            isAdmin={isAdmin}
            editing={editingCard === "ending"}
            saving={saving}
            onToggleEdit={() => startEdit("ending", ["endingInfo", "endingUrl"])}
            onSave={() => saveEdit(["endingInfo", "endingUrl"])}
            onCancel={cancelEdit}
            editContent={
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Offboarding Process</label>
                  <textarea value={draft.endingInfo || ""} onChange={(e) => setDraft((d) => ({ ...d, endingInfo: e.target.value }))} rows={4} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Steps for ending a membership, notice period, final billing…" />
                </div>
                <div>
                  <label style={labelStyle}>Offboarding Form URL</label>
                  <input value={draft.endingUrl || ""} onChange={(e) => setDraft((d) => ({ ...d, endingUrl: e.target.value }))} style={textInput({ width: "100%" })} placeholder="https://…" />
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {info?.endingInfo && <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.7" }}>{info.endingInfo}</p>}
              {info?.endingUrl ? <LinkButton url={info.endingUrl} label="View Process" /> : <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No process URL set.</span>}
            </div>
          </InfoCard>

          {/* 6. Waiting List */}
          <WaitingListCard
            list={info?.waitingList || []}
            isAdmin={isAdmin}
            token={token}
            onUpdate={setInfo}
          />

          {/* 7. Desk Relocation */}
          <DeskRelocationCard
            list={info?.deskRelocationList || []}
            isAdmin={isAdmin}
            token={token}
            onUpdate={setInfo}
          />
        </div>
      </div>
    </div>
  );
}
