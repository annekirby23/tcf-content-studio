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
    <div
      style={{
        width: 24,
        height: 24,
        border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.accent}`,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── Add / Edit Channel Form ─────────────────────────────────────────────────

function ChannelForm({ initial, onSave, onCancel, teamMembers = [] }) {
  const [emoji, setEmoji] = useState(initial?.emoji || "💬");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Channel name is required."); return; }
    if (name.trim().length > 50) { setError("Name must be 50 characters or fewer."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ emoji, name: name.trim(), description: description.trim(), assignedTo: assignedTo || null });
    } catch (e) {
      setError(e.message || "Failed to save.");
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: C.inputBg,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "10px 12px", background: C.cardBg, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="💬"
          maxLength={4}
          style={{ ...inputStyle, width: 44, textAlign: "center", padding: "6px 4px" }}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Channel name"
          maxLength={50}
          style={{ ...inputStyle, flex: 1 }}
          autoFocus
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{ ...inputStyle, marginBottom: 6 }}
      />
      {teamMembers.length > 0 && (
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          style={{ ...inputStyle, marginBottom: 6, color: C.text }}
        >
          <option value="">Unassigned</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
      {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 6 }}>{error}</div>}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "5px 14px",
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 13,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "5px 14px",
            background: "transparent",
            color: C.muted,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
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

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: C.inputBg,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: C.shadow,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 10 }}>New Idea</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Idea title…"
        style={{ ...inputStyle, marginBottom: 8 }}
        autoFocus
      />
      <textarea
        value={copy}
        onChange={(e) => setCopy(e.target.value)}
        placeholder="Write your copy here…"
        rows={4}
        style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
      />
      {teamMembers.length > 0 && (
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8, color: C.text }}
        >
          <option value="">Unassigned</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
      {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "7px 18px",
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontWeight: 500,
          }}
        >
          {saving ? "Saving…" : "Save Idea"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 18px",
            background: "transparent",
            color: C.muted,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Edit Idea Form ──────────────────────────────────────────────────────────

function EditIdeaForm({ idea, onSave, onCancel, teamMembers = [] }) {
  const [title, setTitle] = useState(idea.title || "");
  const [copy, setCopy] = useState(idea.copy || "");
  const [assignedTo, setAssignedTo] = useState(idea.assignedTo || "");
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

  const inputStyle = {
    width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, background: C.inputBg, color: C.text,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.accent}40`, borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: C.shadow }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 10 }}>Edit Idea</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Idea title…" style={{ ...inputStyle, marginBottom: 8 }} autoFocus />
      <textarea value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Write your copy here…" rows={4} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
      {teamMembers.length > 0 && (
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ ...inputStyle, marginBottom: 8, color: C.text }}>
          <option value="">Unassigned</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "7px 18px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 500 }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} style={{ padding: "7px 18px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Idea Card ───────────────────────────────────────────────────────────────

function IdeaCard({ idea, currentUser, token, onDelete, onUpdate, onMakePost, teamMembers = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isSubmitter = idea.submittedById === currentUser?.id;
  const canDelete = isAdmin || isSubmitter;

  const copyLines = idea.copy ? idea.copy.split("\n") : [];
  const isLong = idea.copy && (copyLines.length > 3 || idea.copy.length > 200);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(idea.copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: silently fail
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this idea?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/slack/ideas?id=${idea.id}`, {
        method: "DELETE",
        headers: { "x-session": token },
      });
      if (!res.ok) throw new Error("Delete failed");
      onDelete(idea.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleEdit({ title, copy, assignedTo }) {
    const res = await fetch("/api/slack/ideas", {
      method: "PUT",
      headers: { "x-session": token, "Content-Type": "application/json" },
      body: JSON.stringify({ id: idea.id, title, copy, assignedTo }),
    });
    if (!res.ok) throw new Error("Failed to update idea");
    const updated = await res.json();
    onUpdate(updated);
    setEditing(false);
  }

  const btnBase = {
    padding: "5px 12px",
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    fontSize: 12,
    cursor: "pointer",
    background: "transparent",
    color: C.muted,
    fontFamily: "inherit",
  };

  if (editing) {
    return (
      <EditIdeaForm
        idea={idea}
        onSave={handleEdit}
        onCancel={() => setEditing(false)}
        teamMembers={teamMembers}
      />
    );
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        boxShadow: C.shadow,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{idea.title}</div>

      <div
        style={{
          fontSize: 13,
          color: C.muted,
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expanded ? "unset" : 3,
          overflow: expanded ? "visible" : "hidden",
          marginBottom: isLong ? 4 : 10,
        }}
      >
        {idea.copy}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: C.accent,
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            marginBottom: 10,
            fontFamily: "inherit",
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleCopy} style={{ ...btnBase, color: copied ? "#10B981" : C.muted }}>
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
        <button
          onClick={() => onMakePost({ title: idea.title, description: idea.copy })}
          style={{
            ...btnBase,
            background: C.accent,
            color: "#fff",
            border: "none",
            fontWeight: 500,
            paddingRight: 14,
          }}
        >
          Make into Post →
        </button>
        {(isAdmin || isSubmitter) && (
          <button
            onClick={() => setEditing(true)}
            style={{ ...btnBase }}
          >
            ✏️ Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ ...btnBase, color: "#EF4444", borderColor: "#FECACA", opacity: deleting ? 0.5 : 1 }}
          >
            🗑
          </button>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{idea.submittedBy} · {relativeTime(idea.createdAt)}</span>
        {idea.assignedTo && (() => {
          const member = teamMembers.find((m) => m.id === idea.assignedTo);
          return member ? (
            <span style={{ padding: "2px 8px", borderRadius: "20px", background: "rgba(99,102,241,0.12)", color: "#6366F1", fontWeight: 600, fontSize: 11 }}>
              → {member.name}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SlackPlanner({ currentUser, token, onMakePost, teamMembers = [] }) {
  const isAdmin = currentUser?.role === "admin";

  // Channels state
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [channelHover, setChannelHover] = useState(null);

  // Ideas state
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  // ── Fetch channels on mount ──────────────────────────────────────────────

  useEffect(() => {
    async function loadChannels() {
      setChannelsLoading(true);
      try {
        const res = await fetch("/api/slack/channels", {
          headers: { "x-session": token },
        });
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
        }
      } finally {
        setChannelsLoading(false);
      }
    }
    loadChannels();
  }, [token]);

  // ── Fetch ideas when channel changes ────────────────────────────────────

  const loadIdeas = useCallback(
    async (channelId) => {
      if (!channelId) return;
      setIdeasLoading(true);
      setIdeas([]);
      try {
        const res = await fetch(`/api/slack/ideas?channelId=${channelId}`, {
          headers: { "x-session": token },
        });
        if (res.ok) {
          const data = await res.json();
          setIdeas(data);
        }
      } finally {
        setIdeasLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (selectedChannelId) {
      loadIdeas(selectedChannelId);
      setShowAddIdea(false);
    }
  }, [selectedChannelId, loadIdeas]);

  // ── Channel actions ──────────────────────────────────────────────────────

  async function handleAddChannel({ emoji, name, description }) {
    const res = await fetch("/api/slack/channels", {
      method: "POST",
      headers: { "x-session": token, "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, name, description }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to add channel");
    }
    const newChannel = await res.json();
    setChannels((prev) => [newChannel, ...prev]);
    setSelectedChannelId(newChannel.id);
    setShowAddChannel(false);
  }

  async function handleEditChannel({ emoji, name, description, assignedTo }) {
    const res = await fetch("/api/slack/channels", {
      method: "PUT",
      headers: { "x-session": token, "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingChannelId, emoji, name, description, assignedTo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update channel");
    }
    const updated = await res.json();
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingChannelId(null);
  }

  async function handleDeleteChannel(channelId) {
    if (!window.confirm("Delete this channel and all its ideas?")) return;
    const res = await fetch(`/api/slack/channels?id=${channelId}`, {
      method: "DELETE",
      headers: { "x-session": token },
    });
    if (res.ok) {
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      if (selectedChannelId === channelId) {
        setSelectedChannelId(null);
        setIdeas([]);
      }
    }
  }

  // ── Idea actions ─────────────────────────────────────────────────────────

  async function handleAddIdea({ title, copy, assignedTo }) {
    const res = await fetch("/api/slack/ideas", {
      method: "POST",
      headers: { "x-session": token, "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: selectedChannelId, title, copy, assignedTo: assignedTo || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to add idea");
    }
    const newIdea = await res.json();
    setIdeas((prev) => [newIdea, ...prev]);
    setShowAddIdea(false);
  }

  function handleIdeaDeleted(ideaId) {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }

  function handleIdeaUpdated(updatedIdea) {
    setIdeas((prev) => prev.map((i) => i.id === updatedIdea.id ? updatedIdea : i));
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const headerBtnStyle = {
    padding: "4px 10px",
    background: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
    lineHeight: 1.4,
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 160px)", fontFamily: "inherit" }}>
        {/* ── Left Sidebar: Channels ─────────────────────────────────── */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            overflowY: "auto",
            background: C.surface,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 14px 10px",
              borderBottom: `1px solid ${C.border}`,
              position: "sticky",
              top: 0,
              background: C.surface,
              zIndex: 1,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Slack Channels</span>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAddChannel((v) => !v);
                  setEditingChannelId(null);
                }}
                title="Add channel"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: showAddChannel ? C.accentLight : "transparent",
                  color: showAddChannel ? C.accentBright : C.muted,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                +
              </button>
            )}
          </div>

          {/* Add Channel Form */}
          {showAddChannel && isAdmin && (
            <ChannelForm
              onSave={handleAddChannel}
              onCancel={() => setShowAddChannel(false)}
              teamMembers={teamMembers}
            />
          )}

          {/* Channel List */}
          <div style={{ flex: 1 }}>
            {channelsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                <Spinner />
              </div>
            ) : channels.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                No channels yet — add one to get started
              </div>
            ) : (
              channels.map((channel) => {
                const isSelected = selectedChannelId === channel.id;
                const isHovered = channelHover === channel.id;
                const isEditing = editingChannelId === channel.id;

                return (
                  <div key={channel.id}>
                    <div
                      onClick={() => {
                        setSelectedChannelId(channel.id);
                        setEditingChannelId(null);
                        setShowAddChannel(false);
                      }}
                      onMouseEnter={() => setChannelHover(channel.id)}
                      onMouseLeave={() => setChannelHover(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 14px",
                        cursor: "pointer",
                        background: isSelected ? C.accentLight : isHovered ? C.hover : "transparent",
                        color: isSelected ? C.accentBright : C.text,
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: 13,
                        transition: "background 0.12s",
                        userSelect: "none",
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{channel.emoji}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        #{channel.name}
                      </span>
                      {channel.assignedTo && (() => {
                        const m = teamMembers.find((t) => t.id === channel.assignedTo);
                        if (!m) return null;
                        const colors = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
                        let h = 0; for (let i = 0; i < m.name.length; i++) h = m.name.charCodeAt(i) + ((h << 5) - h);
                        const bg = colors[Math.abs(h) % colors.length];
                        return (
                          <div title={m.name} style={{ width:18, height:18, borderRadius:"50%", background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:"700", flexShrink:0 }}>
                            {m.name.split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0,2)}
                          </div>
                        );
                      })()}
                      {isSelected && isAdmin && (
                        <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChannelId(isEditing ? null : channel.id);
                              setShowAddChannel(false);
                            }}
                            title="Edit channel"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: "1px 3px",
                              borderRadius: 4,
                              color: C.muted,
                              lineHeight: 1,
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(channel.id);
                            }}
                            title="Delete channel"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: "1px 3px",
                              borderRadius: 4,
                              color: C.muted,
                              lineHeight: 1,
                            }}
                          >
                            🗑
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Edit Channel Form */}
                    {isEditing && isAdmin && (
                      <ChannelForm
                        initial={channel}
                        onSave={handleEditChannel}
                        onCancel={() => setEditingChannelId(null)}
                        teamMembers={teamMembers}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Panel: Ideas ─────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            background: C.bg,
          }}
        >
          {!selectedChannel ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: C.muted,
                fontSize: 15,
              }}
            >
              ← Select a channel to view copy ideas
            </div>
          ) : (
            <div style={{ maxWidth: 680 }}>
              {/* Channel Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                    {selectedChannel.emoji} #{selectedChannel.name}
                  </div>
                  {selectedChannel.description && (
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                      {selectedChannel.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAddIdea((v) => !v)}
                  style={headerBtnStyle}
                >
                  {showAddIdea ? "Cancel" : "+ Add Idea"}
                </button>
              </div>

              {/* Add Idea Form */}
              {showAddIdea && (
                <AddIdeaForm
                  onSave={handleAddIdea}
                  onCancel={() => setShowAddIdea(false)}
                  teamMembers={teamMembers}
                />
              )}

              {/* Ideas List */}
              {ideasLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <Spinner />
                </div>
              ) : ideas.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 14,
                    padding: "48px 0",
                  }}
                >
                  No ideas for this channel yet — add the first one!
                </div>
              ) : (
                ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    currentUser={currentUser}
                    token={token}
                    onDelete={handleIdeaDeleted}
                    onUpdate={handleIdeaUpdated}
                    onMakePost={onMakePost}
                    teamMembers={teamMembers}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
