"use client";

import { useState } from "react";
import { C } from "./constants";

function Avatar({ name, size = 32 }) {
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: "700", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "member" };

export default function TeamManager({ teamMembers, currentUser, token, onClose, onTeamUpdate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [editingPassword, setEditingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [tab, setTab] = useState("team");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { ...(opts.headers || {}), "x-session": token, "Content-Type": "application/json" } });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await authFetch("/api/team", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onTeamUpdate([...teamMembers, data]);
      setForm(EMPTY_FORM);
    } catch {
      setError("Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (confirmRemove !== id) { setConfirmRemove(id); return; }
    setRemovingId(id);
    try {
      await authFetch(`/api/team/${id}`, { method: "DELETE" });
      onTeamUpdate(teamMembers.filter((m) => m.id !== id));
      setConfirmRemove(null);
    } catch {
      setError("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (member, role) => {
    try {
      const res = await authFetch(`/api/team/${member.id}`, { method: "PUT", body: JSON.stringify({ role }) });
      if (!res.ok) return;
      onTeamUpdate(teamMembers.map((m) => m.id === member.id ? { ...m, role } : m));
    } catch {}
  };

  const handlePasswordReset = async (memberId) => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      const res = await authFetch(`/api/team/${memberId}`, { method: "PUT", body: JSON.stringify({ password: newPassword }) });
      if (!res.ok) { setError("Failed to reset password"); return; }
      setEditingPassword(null);
      setNewPassword("");
    } catch {
      setError("Failed to reset password");
    }
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
    borderRadius: "8px", padding: "9px 12px", color: C.text, fontSize: "13px",
    outline: "none", boxSizing: "border-box",
  };

  const tabStyle = (active) => ({
    padding: "7px 16px", borderRadius: "6px", border: "none",
    background: active ? C.accentLight : "transparent",
    color: active ? C.accentBright : C.muted,
    fontSize: "13px", fontWeight: active ? "600" : "400", cursor: "pointer",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: C.text }}>Team</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: "12px 24px 0", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "4px" }}>
          <button style={tabStyle(tab === "team")} onClick={() => setTab("team")}>Members</button>
          <button style={tabStyle(tab === "add")} onClick={() => setTab("add")}>+ Add Member</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {error && (
            <div style={{ marginBottom: "14px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#EF4444", fontSize: "13px" }}>
              {error}
              <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {tab === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {teamMembers.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px", color: C.muted, fontSize: "13px" }}>No team members yet</div>
              )}
              {teamMembers.map((member) => (
                <div key={member.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={member.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: C.text }}>{member.name}
                        {member.id === currentUser.id && <span style={{ fontSize: "10px", color: C.muted, marginLeft: "6px" }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: C.muted }}>{member.email}</div>
                    </div>

                    {/* Role badge / selector */}
                    {currentUser.role === "admin" && member.id !== currentUser.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        style={{ ...inputStyle, width: "auto", padding: "4px 8px", fontSize: "11px", fontWeight: "600", color: member.role === "admin" ? C.accentBright : C.muted }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: member.role === "admin" ? C.accentLight : "rgba(255,255,255,0.07)", color: member.role === "admin" ? C.accentBright : C.muted }}>
                        {member.role}
                      </span>
                    )}

                    {/* Admin actions */}
                    {currentUser.role === "admin" && member.id !== currentUser.id && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => { setEditingPassword(editingPassword === member.id ? null : member.id); setNewPassword(""); }}
                          title="Reset password"
                          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.muted, padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleRemove(member.id)}
                          disabled={removingId === member.id}
                          style={{ background: confirmRemove === member.id ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${confirmRemove === member.id ? "#EF4444" : C.border}`, borderRadius: "6px", color: confirmRemove === member.id ? "#EF4444" : C.muted, padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}
                        >
                          {confirmRemove === member.id ? "Confirm" : "✕"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Password reset inline */}
                  {editingPassword === member.id && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                      <input
                        type="password"
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="New password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        onClick={() => handlePasswordReset(member.id)}
                        style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Set Password
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "add" && (
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Full Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sarah Johnson" required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Email *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="sarah@tcf.com" required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Temporary Password *</label>
                <input type="password" style={inputStyle} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "5px" }}>Share this with them — they can't change it yet.</div>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Role</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["member", "admin"].map((r) => (
                    <button key={r} type="button" onClick={() => set("role", r)}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${form.role === r ? C.accent : C.border}`, background: form.role === r ? C.accentLight : "transparent", color: form.role === r ? C.accentBright : C.muted, fontSize: "13px", fontWeight: form.role === r ? "600" : "400", cursor: "pointer", textTransform: "capitalize" }}>
                      {r}
                      <div style={{ fontSize: "10px", marginTop: "3px", fontWeight: "400", color: C.muted }}>
                        {r === "member" ? "Create & submit posts" : "Full access + manage team"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving}
                style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: saving ? C.muted : C.accent, color: "#fff", fontSize: "14px", fontWeight: "700", cursor: saving ? "default" : "pointer" }}>
                {saving ? "Adding…" : "Add Team Member"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
