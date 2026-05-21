"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./constants";

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Spinner() {
  return (
    <div style={{ width: 22, height: 22, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );
}

function MiniAvatar({ name, size = 22 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  return (
    <div title={name} style={{ width: size, height: size, borderRadius: "50%", background: cols[Math.abs(h) % cols.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.38), fontWeight: "700", flexShrink: 0 }}>
      {(name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0,2)}
    </div>
  );
}

const ENGAGEMENT_LEVELS = [
  { value: "none",     label: "None",     color: "#94A3B8", dot: "⚪" },
  { value: "low",      label: "Low",      color: "#F59E0B", dot: "🟡" },
  { value: "moderate", label: "Moderate", color: "#3B82F6", dot: "🔵" },
  { value: "high",     label: "High",     color: "#10B981", dot: "🟢" },
];

const inputStyle = (extra = {}) => ({
  width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13, background: C.inputBg, color: C.text, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", ...extra,
});

const labelStyle = {
  display: "block", fontSize: "11px", color: C.muted, fontWeight: "700",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
};

// ─── Channel Form Modal ───────────────────────────────────────────────────────

function ChannelFormModal({ initial, onSave, onCancel, teamMembers = [], clubs = [] }) {
  const isNew = !initial?.id;
  const [emoji, setEmoji] = useState(initial?.emoji || "💬");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [purpose, setPurpose] = useState(initial?.purpose || "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo || "");
  const [helpers, setHelpers] = useState(initial?.helpers || []);
  const [memberManagers, setMemberManagers] = useState(initial?.memberManagers || []);
  const [newMM, setNewMM] = useState({ name: "", role: "" });
  const [engagementLevel, setEngagementLevel] = useState(initial?.engagementLevel || "none");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [isMemberClub, setIsMemberClub] = useState(initial?.isMemberClub || false);
  const [clubId, setClubId] = useState(initial?.clubId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  const toggleHelper = (id) => {
    setHelpers((prev) => prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]);
  };

  const addMemberManager = () => {
    if (!newMM.name.trim()) return;
    setMemberManagers((prev) => [...prev, { name: newMM.name.trim(), role: newMM.role.trim() }]);
    setNewMM({ name: "", role: "" });
  };

  const removeMemberManager = (i) => setMemberManagers((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { setError("Channel name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ emoji, name: name.trim(), description, purpose, assignedTo: assignedTo || null, helpers, memberManagers, engagementLevel, notes, isMemberClub, clubId: clubId || null });
    } catch (e) {
      setError(e.message || "Failed to save.");
      setSaving(false);
    }
  };

  const helperOptions = teamMembers.filter((m) => m.id !== assignedTo);

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(680px, 95vw)", maxHeight: "90vh", overflowY: "auto", background: C.card, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", zIndex: 3001, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>{isNew ? "Add Channel" : "Edit Channel"}</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>✕</button>
        </div>

        {/* Name + Emoji */}
        <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Icon</label>
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} style={{ ...inputStyle(), textAlign: "center", padding: "8px 4px" }} />
          </div>
          <div>
            <label style={labelStyle}>Channel Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="#channel-name" style={inputStyle()} />
          </div>
        </div>

        {/* Description + Purpose */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description…" style={inputStyle()} />
          </div>
          <div>
            <label style={labelStyle}>Channel Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What is this channel for?" style={inputStyle()} />
          </div>
        </div>

        {/* Lead + Engagement */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Lead (Assigned To)</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle()}>
              <option value="">Unassigned</option>
              {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Engagement Level</label>
            <select value={engagementLevel} onChange={(e) => setEngagementLevel(e.target.value)} style={inputStyle()}>
              {ENGAGEMENT_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.dot} {l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Helper Members */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Engagement Helpers (other team members who help)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {helperOptions.map((m) => {
              const on = helpers.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleHelper(m.id)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accentLight : "none", color: on ? C.accentBright : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {on ? "✓ " : ""}{m.name}
                </button>
              );
            })}
            {helperOptions.length === 0 && <span style={{ fontSize: 12, color: C.muted }}>No other team members available.</span>}
          </div>
        </div>

        {/* Member Club */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start", marginBottom: 14, padding: "12px 14px", background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <div style={{ paddingTop: 2 }}>
            <input type="checkbox" checked={isMemberClub} onChange={(e) => setIsMemberClub(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.accent, cursor: "pointer" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Member-Run Club Channel</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: isMemberClub ? 10 : 0 }}>This channel is associated with a TCF member club or group.</div>
            {isMemberClub && (
              <div>
                <label style={labelStyle}>Club</label>
                <select value={clubId} onChange={(e) => setClubId(e.target.value)} style={inputStyle()}>
                  <option value="">— Select club —</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {clubs.length === 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>No clubs yet — an admin can add them in the Clubs settings panel.</div>}
              </div>
            )}
          </div>
        </div>

        {/* TCF Member Managers */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>TCF Member Managers</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {memberManagers.map((mm, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{mm.name}</span>
                {mm.role && <span style={{ fontSize: 11, color: C.muted, padding: "2px 8px", borderRadius: 20, background: C.card, border: `1px solid ${C.border}` }}>{mm.role}</span>}
                <button onClick={() => removeMemberManager(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
            <input value={newMM.name} onChange={(e) => setNewMM((f) => ({ ...f, name: e.target.value }))} placeholder="Member name…" style={inputStyle()} />
            <input value={newMM.role} onChange={(e) => setNewMM((f) => ({ ...f, role: e.target.value }))} placeholder="Role (optional)…" style={inputStyle()} />
            <button onClick={addMemberManager} disabled={!newMM.name.trim()} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: newMM.name.trim() ? C.accent : C.border, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add</button>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes about this channel — strategy, context, goals…" style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.6 }} />
        </div>

        {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "Saving…" : isNew ? "Add Channel" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Clubs Manager (admin panel) ──────────────────────────────────────────────

function ClubsManager({ token, clubs, onClubsChange }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const addClub = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/slack/clubs", { method: "POST", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
      const club = await res.json();
      onClubsChange([...clubs, club]);
      setNewName("");
    } finally { setSaving(false); }
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    const res = await fetch("/api/slack/clubs", { method: "PUT", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName.trim() }) });
    const updated = await res.json();
    onClubsChange(clubs.map((c) => c.id === id ? updated : c));
    setEditingId(null);
  };

  const deleteClub = async (id) => {
    await fetch(`/api/slack/clubs?id=${id}`, { method: "DELETE", headers: { "x-session": token } });
    onClubsChange(clubs.filter((c) => c.id !== id));
  };

  return (
    <div style={{ padding: "16px 20px", background: C.cardBg, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>⭕ Manage Clubs List</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {clubs.length === 0 && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No clubs yet.</div>}
        {clubs.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
            {editingId === c.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus style={{ ...inputStyle({ flex: 1, padding: "4px 8px", fontSize: 12 }) }} />
                <button onClick={() => saveEdit(c.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 12, cursor: "pointer" }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>{c.name}</span>
                <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✏️</button>
                <button onClick={() => deleteClub(c.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12 }}>🗑</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addClub()} placeholder="New club name…" style={{ ...inputStyle({ flex: 1 }) }} />
        <button onClick={addClub} disabled={saving || !newName.trim()} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !newName.trim() ? 0.5 : 1 }}>Add</button>
      </div>
    </div>
  );
}

// ─── Add Idea Form ───────────────────────────────────────────────────────────

function AddIdeaForm({ onSave, onCancel, teamMembers = [] }) {
  const [title, setTitle] = useState("");
  const [copy, setCopy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!copy.trim()) { setError("Copy is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), copy: copy.trim(), assignedTo: assignedTo || null });
    } catch (e) {
      setError(e.message || "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: C.shadow }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 10 }}>New Idea</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Idea title…" style={{ ...inputStyle(), marginBottom: 8 }} autoFocus />
      <textarea value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Write your copy here…" rows={4} style={{ ...inputStyle(), resize: "vertical", marginBottom: 8 }} />
      {teamMembers.length > 0 && (
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ ...inputStyle(), marginBottom: 8 }}>
          <option value="">Unassigned</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "7px 18px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1, fontWeight: 500 }}>
          {saving ? "Saving…" : "Save Idea"}
        </button>
        <button onClick={onCancel} style={{ padding: "7px 18px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Idea Card ────────────────────────────────────────────────────────────────

function IdeaCard({ idea, currentUser, token, onDelete, onUpdate, onMakePost, teamMembers = [] }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title || "");
  const [editCopy, setEditCopy] = useState(idea.copy || "");
  const [editAssigned, setEditAssigned] = useState(idea.assignedTo || "");
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isSubmitter = idea.submittedById === currentUser?.id;
  const canDelete = isAdmin || isSubmitter;
  const isLong = (idea.copy || "").length > 200;

  const handleCopy = () => {
    navigator.clipboard.writeText(idea.copy || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this idea?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/slack/ideas?id=${idea.id}`, { method: "DELETE", headers: { "x-session": token } });
      onDelete(idea.id);
    } catch { setDeleting(false); }
  };

  const handleEdit = async () => {
    if (!editTitle.trim() || !editCopy.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/slack/ideas", { method: "PUT", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ id: idea.id, title: editTitle.trim(), copy: editCopy.trim(), assignedTo: editAssigned || null }) });
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const btnBase = { padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, cursor: "pointer", background: "transparent", color: C.muted, fontFamily: "inherit" };

  if (editing) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: C.shadow }}>
        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle(), marginBottom: 8 }} />
        <textarea value={editCopy} onChange={(e) => setEditCopy(e.target.value)} rows={4} style={{ ...inputStyle(), resize: "vertical", marginBottom: 8 }} />
        <select value={editAssigned} onChange={(e) => setEditAssigned(e.target.value)} style={{ ...inputStyle(), marginBottom: 10 }}>
          <option value="">Unassigned</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleEdit} disabled={saving} style={{ ...btnBase, background: C.accent, color: "#fff", border: "none", fontWeight: 600 }}>{saving ? "Saving…" : "Save"}</button>
          <button onClick={() => setEditing(false)} style={btnBase}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: C.shadow }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{idea.title}</div>
      <div style={{ fontSize: 13, color: C.muted, whiteSpace: "pre-wrap", lineHeight: 1.55, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: expanded ? "unset" : 3, overflow: expanded ? "visible" : "hidden", marginBottom: isLong ? 4 : 10 }}>
        {idea.copy}
      </div>
      {isLong && <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 10, fontFamily: "inherit" }}>{expanded ? "Show less" : "Show more"}</button>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleCopy} style={{ ...btnBase, color: copied ? "#10B981" : C.muted }}>{copied ? "✓ Copied!" : "📋 Copy"}</button>
        <button onClick={() => onMakePost({ title: idea.title, description: idea.copy })} style={{ ...btnBase, background: C.accent, color: "#fff", border: "none", fontWeight: 500 }}>Make into Post →</button>
        {(isAdmin || isSubmitter) && <button onClick={() => setEditing(true)} style={btnBase}>✏️ Edit</button>}
        {canDelete && <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, color: "#EF4444", borderColor: "#FECACA", opacity: deleting ? 0.5 : 1 }}>🗑</button>}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{idea.submittedBy} · {relativeTime(idea.createdAt)}</span>
        {idea.assignedTo && (() => { const m = teamMembers.find((t) => t.id === idea.assignedTo); return m ? <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "#6366F1", fontWeight: 600 }}>→ {m.name}</span> : null; })()}
      </div>
    </div>
  );
}

// ─── AI Engagement Suggestions ────────────────────────────────────────────────

function EngagementSuggestions({ channel, token }) {
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    setSuggestions("");
    try {
      const res = await fetch("/api/workspace-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({
          prompt: `You are a community engagement expert for a coworking space called TCF. Give 5 specific, actionable suggestions to increase activity and engagement for the Slack channel "#${channel.name}".\n\nChannel purpose: ${channel.purpose || channel.description || "Not specified"}\nCurrent engagement level: ${channel.engagementLevel || "unknown"}\nNotes: ${channel.notes || "None"}\n\nFormat as a numbered list. Keep each suggestion concise (2-3 sentences). Focus on realistic tactics that a small community team can execute.`,
        }),
      });
      const data = await res.json();
      setSuggestions(data.summary || data.message || "");
    } catch {
      setError("Failed to generate suggestions.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: suggestions ? 12 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>💡 Engagement Suggestions</div>
        <button
          onClick={generate}
          disabled={loading}
          style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
        >
          {loading ? <><Spinner /><span>Generating…</span></> : "✨ Get AI Suggestions"}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>{error}</div>}
      {suggestions && (
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", marginTop: 12, padding: "12px 14px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {suggestions}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SlackPlanner({ currentUser, token, onMakePost, teamMembers = [] }) {
  const isAdmin = currentUser?.role === "admin";

  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelHover, setChannelHover] = useState(null);
  const [showClubsManager, setShowClubsManager] = useState(false);

  const [clubs, setClubs] = useState([]);

  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);

  const [rightTab, setRightTab] = useState("ideas"); // "ideas" | "details"

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  // ── Fetch channels + clubs ─────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/slack/channels", { headers: { "x-session": token } }).then((r) => r.json()),
      fetch("/api/slack/clubs", { headers: { "x-session": token } }).then((r) => r.json()),
    ]).then(([ch, cl]) => {
      setChannels(Array.isArray(ch) ? ch : []);
      setClubs(Array.isArray(cl) ? cl : []);
    }).catch(() => {}).finally(() => setChannelsLoading(false));
  }, [token]);

  // ── Fetch ideas when channel changes ──────────────────────────────────────

  const loadIdeas = useCallback(async (channelId) => {
    if (!channelId) return;
    setIdeasLoading(true);
    setIdeas([]);
    try {
      const res = await fetch(`/api/slack/ideas?channelId=${channelId}`, { headers: { "x-session": token } });
      if (res.ok) setIdeas(await res.json());
    } finally { setIdeasLoading(false); }
  }, [token]);

  useEffect(() => {
    if (selectedChannelId) { loadIdeas(selectedChannelId); setShowAddIdea(false); }
  }, [selectedChannelId, loadIdeas]);

  // ── Channel actions ────────────────────────────────────────────────────────

  const saveChannel = async (data) => {
    if (editingChannel?.id) {
      const res = await fetch("/api/slack/channels", { method: "PUT", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ id: editingChannel.id, ...data }) });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setChannels((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } else {
      const res = await fetch("/api/slack/channels", { method: "POST", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to add channel");
      const newCh = await res.json();
      setChannels((prev) => [newCh, ...prev]);
      setSelectedChannelId(newCh.id);
    }
    setShowChannelModal(false);
    setEditingChannel(null);
  };

  const handleDeleteChannel = async (id) => {
    if (!window.confirm("Delete this channel and all its ideas?")) return;
    const res = await fetch(`/api/slack/channels?id=${id}`, { method: "DELETE", headers: { "x-session": token } });
    if (res.ok) {
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (selectedChannelId === id) { setSelectedChannelId(null); setIdeas([]); }
    }
  };

  // ── Idea actions ───────────────────────────────────────────────────────────

  const handleAddIdea = async ({ title, copy, assignedTo }) => {
    const res = await fetch("/api/slack/ideas", { method: "POST", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ channelId: selectedChannelId, title, copy, assignedTo: assignedTo || null }) });
    if (!res.ok) throw new Error("Failed to add idea");
    const idea = await res.json();
    setIdeas((prev) => [idea, ...prev]);
    setShowAddIdea(false);
  };

  // ── AI Idea Generator ──────────────────────────────────────────────────────

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const generateIdea = async () => {
    if (!selectedChannel) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/slack/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ channelId: selectedChannel.id, channelName: selectedChannel.name, description: selectedChannel.description, purpose: selectedChannel.purpose, notes: selectedChannel.notes }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const idea = await res.json();
      setIdeas((prev) => [idea, ...prev]);
    } catch (e) {
      setAiError(e.message || "Failed to generate idea.");
    } finally { setAiLoading(false); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", height: "calc(100vh - 160px)", fontFamily: "inherit" }}>

        {/* ── Left Sidebar ──────────────────────────────────────────────── */}
        <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: C.surface, display: "flex", flexDirection: "column" }}>

          {/* Sidebar Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 10px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Slack Channels</span>
            {isAdmin && (
              <button onClick={() => { setEditingChannel(null); setShowChannelModal(true); }} title="Add channel"
                style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                +
              </button>
            )}
          </div>

          {/* Admin: Clubs Manager toggle */}
          {isAdmin && (
            <button onClick={() => setShowClubsManager((v) => !v)}
              style={{ margin: "8px 10px 0", padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: showClubsManager ? C.accentLight : "none", color: showClubsManager ? C.accentBright : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              ⭕ {showClubsManager ? "Hide Clubs Manager" : "Manage Clubs List"}
            </button>
          )}
          {showClubsManager && isAdmin && (
            <div style={{ padding: "8px 10px" }}>
              <ClubsManager token={token} clubs={clubs} onClubsChange={setClubs} />
            </div>
          )}

          {/* Channel List */}
          <div style={{ flex: 1 }}>
            {channelsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner /></div>
            ) : channels.length === 0 ? (
              <div style={{ padding: "24px 16px", fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>No channels yet — add one to get started</div>
            ) : channels.map((channel) => {
              const isSelected = selectedChannelId === channel.id;
              const isHovered = channelHover === channel.id;
              const engCfg = ENGAGEMENT_LEVELS.find((l) => l.value === channel.engagementLevel) || ENGAGEMENT_LEVELS[0];
              return (
                <div key={channel.id}>
                  <div
                    onClick={() => { setSelectedChannelId(channel.id); setRightTab("ideas"); }}
                    onMouseEnter={() => setChannelHover(channel.id)}
                    onMouseLeave={() => setChannelHover(null)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", cursor: "pointer", background: isSelected ? C.accentLight : isHovered ? C.hover : "transparent", color: isSelected ? C.accentBright : C.text, fontWeight: isSelected ? 600 : 400, fontSize: 13, transition: "background 0.12s", userSelect: "none" }}
                  >
                    <span style={{ flexShrink: 0 }}>{channel.emoji}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>#{channel.name}</span>
                    {channel.isMemberClub && <span title="Member Club" style={{ fontSize: 10, color: "#8B5CF6" }}>⭕</span>}
                    <span title={`Engagement: ${engCfg.label}`} style={{ fontSize: 8, color: engCfg.color, flexShrink: 0 }}>●</span>
                    {channel.assignedTo && (() => { const m = teamMembers.find((t) => t.id === channel.assignedTo); if (!m) return null; return <MiniAvatar name={m.name} size={18} />; })()}
                    {isSelected && isAdmin && (
                      <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingChannel(channel); setShowChannelModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "1px 3px", color: C.muted }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "1px 3px", color: C.muted }}>🗑</button>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {!selectedChannel ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 15 }}>
              ← Select a channel
            </div>
          ) : (
            <div style={{ padding: 24, maxWidth: 740 }}>

              {/* Channel header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{selectedChannel.emoji} #{selectedChannel.name}</span>
                    {(() => { const e = ENGAGEMENT_LEVELS.find((l) => l.value === selectedChannel.engagementLevel); return e && e.value !== "none" ? <span style={{ fontSize: 11, fontWeight: 700, color: e.color, padding: "2px 10px", borderRadius: 20, background: `${e.color}18`, border: `1px solid ${e.color}40` }}>{e.dot} {e.label}</span> : null; })()}
                    {selectedChannel.isMemberClub && (() => { const club = clubs.find((c) => c.id === selectedChannel.clubId); return <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", padding: "2px 10px", borderRadius: 20, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>⭕ {club ? club.name : "Member Club"}</span>; })()}
                  </div>
                  {selectedChannel.description && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{selectedChannel.description}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => { setEditingChannel(selectedChannel); setShowChannelModal(true); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    ✏️ Edit Channel
                  </button>
                )}
              </div>

              {/* Team info bar */}
              {(selectedChannel.assignedTo || (selectedChannel.helpers || []).length > 0 || (selectedChannel.memberManagers || []).length > 0) && (
                <div style={{ display: "flex", gap: 16, marginBottom: 16, padding: "10px 14px", background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                  {selectedChannel.assignedTo && (() => { const m = teamMembers.find((t) => t.id === selectedChannel.assignedTo); return m ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lead</span>
                      <MiniAvatar name={m.name} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{m.name}</span>
                    </div>
                  ) : null; })()}
                  {(selectedChannel.helpers || []).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Helpers</span>
                      {selectedChannel.helpers.map((hId) => { const m = teamMembers.find((t) => t.id === hId); return m ? <MiniAvatar key={hId} name={m.name} /> : null; })}
                    </div>
                  )}
                  {(selectedChannel.memberManagers || []).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Members</span>
                      {selectedChannel.memberManagers.map((mm, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#8B5CF6", padding: "2px 8px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                          {mm.name}{mm.role ? ` · ${mm.role}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedChannel.notes && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 10, fontSize: 13, color: "#92400e", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  <span style={{ fontWeight: 700 }}>📝 Notes: </span>{selectedChannel.notes}
                </div>
              )}

              {/* Tab strip */}
              <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
                {[{ id: "ideas", label: "💬 Ideas & AI" }, { id: "engagement", label: "✨ Engagement Tips" }].map((t) => (
                  <button key={t.id} onClick={() => setRightTab(t.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: rightTab === t.id ? 700 : 500, color: rightTab === t.id ? C.accentBright : C.muted, borderBottom: `2px solid ${rightTab === t.id ? C.accent : "transparent"}`, marginBottom: -1, transition: "all 0.12s" }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Ideas & AI tab */}
              {rightTab === "ideas" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setShowAddIdea((v) => !v)} style={{ padding: "7px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {showAddIdea ? "Cancel" : "+ Add Idea"}
                    </button>
                    <button onClick={generateIdea} disabled={aiLoading} style={{ padding: "7px 16px", background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                      {aiLoading ? <><Spinner /><span>Generating…</span></> : "✨ AI Idea"}
                    </button>
                    {aiError && <span style={{ fontSize: 12, color: "#EF4444" }}>{aiError}</span>}
                  </div>
                  {showAddIdea && <AddIdeaForm onSave={handleAddIdea} onCancel={() => setShowAddIdea(false)} teamMembers={teamMembers} />}
                  {ideasLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
                  ) : ideas.length === 0 ? (
                    <div style={{ textAlign: "center", color: C.muted, fontSize: 14, padding: "48px 0" }}>No ideas yet — add one or generate with AI!</div>
                  ) : ideas.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} currentUser={currentUser} token={token} onDelete={(id) => setIdeas((prev) => prev.filter((i) => i.id !== id))} onUpdate={(u) => setIdeas((prev) => prev.map((i) => i.id === u.id ? u : i))} onMakePost={onMakePost} teamMembers={teamMembers} />
                  ))}
                </>
              )}

              {/* Engagement Tips tab */}
              {rightTab === "engagement" && (
                <EngagementSuggestions channel={selectedChannel} token={token} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Channel form modal */}
      {showChannelModal && (
        <ChannelFormModal
          initial={editingChannel}
          onSave={saveChannel}
          onCancel={() => { setShowChannelModal(false); setEditingChannel(null); }}
          teamMembers={teamMembers}
          clubs={clubs}
        />
      )}
    </>
  );
}
