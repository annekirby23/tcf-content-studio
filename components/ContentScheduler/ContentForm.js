"use client";

import { useState, useEffect, useRef } from "react";
import {
  PLATFORMS,
  CONTENT_TYPES,
  STATUSES,
  PILLARS,
  THEMES,
  AUDIENCES,
  PRIORITIES,
  BEST_TIMES,
  CHAR_LIMITS,
  C,
} from "./constants";

const EMPTY = {
  title: "",
  caption: "",
  platforms: [],
  contentType: "post",
  status: "draft",
  scheduledDate: "",
  scheduledTime: "",
  campaign: "",
  pillar: "",
  priority: "medium",
  author: "",
  assignee: "",
  assignedTo: "",
  hashtags: "",
  cta: "",
  assetUrl: "",
  internalNotes: "",
  audience: "external",
  theme: "",
  threadNotes: [],
};

const MEMBER_STATUSES = ["draft", "review"];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(name = "") {
  const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function highlightMentions(text) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} style={{ color: C.accentBright, fontWeight: "600" }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ContentForm({
  post,
  campaigns,
  teamMembers = [],
  currentUser,
  onSave,
  onDelete,
  onClose,
  onNoteAdded,
  token,
}) {
  const isAdmin = currentUser?.role === "admin";
  const allowedStatuses = isAdmin ? STATUSES : STATUSES.filter((s) => MEMBER_STATUSES.includes(s.id));

  const [form, setForm] = useState(() => {
    if (!post) return { ...EMPTY };
    const { notes, ...postRest } = post;
    return {
      ...EMPTY,
      ...postRest,
      internalNotes: post.internalNotes ?? (typeof notes === "string" ? notes : ""),
    };
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState("content");

  // AI improve state
  const [improving, setImproving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Thread / notes state
  const [threadNotes, setThreadNotes] = useState(Array.isArray(post?.notes) ? post.notes : []);
  const [noteInput, setNoteInput] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // null or string
  const [mentionDropdownIndex, setMentionDropdownIndex] = useState(0);
  const noteInputRef = useRef(null);
  const threadBottomRef = useRef(null);

  useEffect(() => {
    let next;
    if (post) {
      const { notes, ...postRest } = post;
      next = {
        ...EMPTY,
        ...postRest,
        internalNotes: post.internalNotes ?? (typeof notes === "string" ? notes : ""),
      };
    } else {
      next = { ...EMPTY };
    }
    setForm(next);
    setTab("content");
    setConfirmDelete(false);
    setAiSuggestion(null);
    setThreadNotes(Array.isArray(post?.notes) ? post.notes : []);
    setNoteInput("");
    setMentionQuery(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  useEffect(() => {
    if (threadBottomRef.current) {
      threadBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadNotes.length]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const togglePlatform = (id) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
  };

  const charLimit =
    form.platforms.length > 0
      ? Math.min(
          ...form.platforms
            .map((p) => CHAR_LIMITS[p])
            .filter((n) => n !== null && n !== undefined && isFinite(n))
        )
      : null;
  const effectiveCharLimit = isFinite(charLimit) ? charLimit : null;
  const captionLen = form.caption.length;
  const captionOver = effectiveCharLimit && captionLen > effectiveCharLimit;

  const bestTimes =
    form.platforms.length > 0 ? BEST_TIMES[form.platforms[0]] || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleImprove = async () => {
    if (improving) return;
    setImproving(true);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/ai/improve-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-session": token } : {}),
        },
        body: JSON.stringify({
          caption: form.caption,
          platforms: form.platforms,
          contentType: form.contentType,
        }),
      });
      const data = await res.json();
      setAiSuggestion(data.improved || data.result || data.text || "");
    } catch {
      setAiSuggestion(null);
    } finally {
      setImproving(false);
    }
  };

  const handleNoteInputChange = (e) => {
    const val = e.target.value;
    setNoteInput(val);
    // detect @mention
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(" ")) {
        setMentionQuery(afterAt.toLowerCase());
        setMentionDropdownIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  };

  const filteredMembers =
    mentionQuery !== null
      ? teamMembers.filter((m) =>
          m.name?.toLowerCase().startsWith(mentionQuery)
        )
      : [];

  const insertMention = (memberName) => {
    const lastAt = noteInput.lastIndexOf("@");
    const before = noteInput.slice(0, lastAt);
    setNoteInput(before + "@" + memberName + " ");
    setMentionQuery(null);
    noteInputRef.current?.focus();
  };

  const handleNoteKeyDown = (e) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionDropdownIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionDropdownIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionDropdownIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendNote();
    }
  };

  const handleSendNote = async () => {
    const text = noteInput.trim();
    if (!text || sendingNote) return;
    setSendingNote(true);
    const optimistic = {
      id: `temp-${Date.now()}`,
      text,
      authorName: currentUser?.name || "You",
      createdAt: new Date().toISOString(),
    };
    setThreadNotes((prev) => [...prev, optimistic]);
    setNoteInput("");
    setMentionQuery(null);
    try {
      if (post?.id) {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-session": token } : {}),
          },
          body: JSON.stringify({ postId: post.id, text }),
        });
        if (res.ok) {
          const saved = await res.json();
          setThreadNotes((prev) => prev.map((n) => n.id === optimistic.id ? saved : n));
          onNoteAdded?.(post.id, saved);
        }
      }
    } catch {
      // optimistic note stays visible; silent fail
    } finally {
      setSendingNote(false);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────────────────

  const inputStyle = {
    width: "100%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: C.muted,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "6px",
  };

  const fieldStyle = { marginBottom: "16px" };

  const tabStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: active ? C.accentLight : "transparent",
    color: active ? C.accentBright : C.muted,
    fontSize: "13px",
    fontWeight: active ? "600" : "400",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px 0",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "700",
                color: C.text,
              }}
            >
              {post?.id ? "Edit Content" : "New Content"}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                fontSize: "20px",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "-1px" }}>
            {["content", "schedule", "notes", "details"].map((t) => {
              const labels = {
                content: "Content",
                schedule: "Schedule",
                notes: "Notes",
                details: "Details",
              };
              return (
                <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}
        >
          {/* ════════════════ CONTENT TAB ════════════════ */}
          {tab === "content" && (
            <>
              {/* Title */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Title *</label>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Summer Campaign Launch Post"
                  required
                />
              </div>

              {/* Audience toggle */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Audience</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {AUDIENCES.map((a) => {
                    const active = form.audience === a.id;
                    const icon = a.id === "external" ? "🌐" : "🏛";
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => set("audience", a.id)}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: `2px solid ${active ? a.color : C.border}`,
                          background: active ? a.bg : C.surface,
                          color: active ? a.color : C.muted,
                          fontSize: "14px",
                          fontWeight: active ? "600" : "400",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <span style={{ fontSize: "15px" }}>
                          {icon} {a.label}
                        </span>
                        <span style={{ fontSize: "12px", opacity: 0.75, fontWeight: "400" }}>
                          {a.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform pills */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Platforms</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {PLATFORMS.map((p) => {
                    const active = form.platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          border: `1px solid ${active ? p.color : C.border}`,
                          background: active ? p.bg : "transparent",
                          color: active ? p.color : C.muted,
                          fontSize: "12px",
                          fontWeight: active ? "600" : "400",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>{p.icon}</span> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Type + Status */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Content Type</label>
                  <select
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.contentType}
                    onChange={(e) => set("contentType", e.target.value)}
                  >
                    {CONTENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {allowedStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {!isAdmin && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: C.muted,
                        marginTop: "4px",
                      }}
                    >
                      Admin approval required for Approved / Published
                    </div>
                  )}
                </div>
              </div>

              {/* Theme */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Theme</label>
                <select
                  style={{ ...inputStyle, appearance: "none" }}
                  value={form.theme}
                  onChange={(e) => set("theme", e.target.value)}
                >
                  <option value="">— No Theme —</option>
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption with AI button */}
              <div style={fieldStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Caption / Copy
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {effectiveCharLimit && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: captionOver ? "#EF4444" : C.muted,
                        }}
                      >
                        {captionLen} / {effectiveCharLimit}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleImprove}
                      disabled={improving}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${C.border}`,
                        background: improving ? C.cardBg : C.accentLight,
                        color: improving ? C.muted : C.accentBright,
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: improving ? "default" : "pointer",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {improving ? "Improving..." : "✨ Improve with AI"}
                    </button>
                  </div>
                </div>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "120px",
                    resize: "vertical",
                    lineHeight: "1.6",
                    borderColor: captionOver ? "#EF4444" : C.border,
                  }}
                  value={form.caption}
                  onChange={(e) => set("caption", e.target.value)}
                  placeholder="Write your caption, article intro, or script here..."
                />

                {/* AI suggestion panel */}
                {aiSuggestion !== null && (
                  <div
                    style={{
                      marginTop: "10px",
                      borderRadius: "10px",
                      border: `1px solid rgba(16,185,129,0.3)`,
                      background: "rgba(16,185,129,0.08)",
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#059669",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        AI Suggestion:
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            set("caption", aiSuggestion);
                            setAiSuggestion(null);
                          }}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#10B981",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Use this →
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiSuggestion(null)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#059669",
                            fontSize: "12px",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: C.text,
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {aiSuggestion}
                    </p>
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Hashtags</label>
                <input
                  style={inputStyle}
                  value={form.hashtags}
                  onChange={(e) => set("hashtags", e.target.value)}
                  placeholder="#brand #marketing #contentcreator"
                />
              </div>

              {/* CTA */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Call to Action</label>
                <input
                  style={inputStyle}
                  value={form.cta}
                  onChange={(e) => set("cta", e.target.value)}
                  placeholder="e.g. Link in bio, Swipe up, Comment below..."
                />
              </div>
            </>
          )}

          {/* ════════════════ SCHEDULE TAB ════════════════ */}
          {tab === "schedule" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    style={{ ...inputStyle, colorScheme: "light" }}
                    value={form.scheduledDate}
                    onChange={(e) => set("scheduledDate", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input
                    type="time"
                    style={{ ...inputStyle, colorScheme: "light" }}
                    value={form.scheduledTime}
                    onChange={(e) => set("scheduledTime", e.target.value)}
                  />
                </div>
              </div>

              {bestTimes.length > 0 && (
                <div
                  style={{
                    ...fieldStyle,
                    padding: "12px 16px",
                    background: C.accentLight,
                    borderRadius: "10px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: C.accentBright,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Best Times for{" "}
                    {PLATFORMS.find((p) => p.id === form.platforms[0])?.label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {bestTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("scheduledTime", t)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          border: `1px solid ${
                            form.scheduledTime === t ? C.accent : C.border
                          }`,
                          background:
                            form.scheduledTime === t
                              ? C.accentLight
                              : "transparent",
                          color:
                            form.scheduledTime === t ? C.accentBright : C.muted,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={fieldStyle}>
                <label style={labelStyle}>Campaign</label>
                <select
                  style={{ ...inputStyle, appearance: "none" }}
                  value={form.campaign}
                  onChange={(e) => set("campaign", e.target.value)}
                >
                  <option value="">— No Campaign —</option>
                  {(campaigns || []).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Content Pillar</label>
                  <select
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.pillar}
                    onChange={(e) => set("pillar", e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {PILLARS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.priority}
                    onChange={(e) => set("priority", e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ════════════════ NOTES TAB ════════════════ */}
          {tab === "notes" && (
            <>
              {/* Internal notes */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Internal Notes</label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                    resize: "vertical",
                    lineHeight: "1.6",
                  }}
                  value={form.internalNotes}
                  onChange={(e) => set("internalNotes", e.target.value)}
                  placeholder="Notes for yourself, revision requests, context..."
                />
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1, height: "1px", background: C.border }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: C.muted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Team Chat
                </span>
                <div style={{ flex: 1, height: "1px", background: C.border }} />
              </div>

              {/* Thread */}
              <div
                style={{
                  minHeight: "80px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  marginBottom: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {threadNotes.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: C.muted,
                      fontSize: "13px",
                      padding: "24px 0",
                    }}
                  >
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  threadNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: avatarColor(note.authorName || note.author || ""),
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(note.authorName || note.author || "?")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "8px",
                            marginBottom: "3px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: C.text,
                            }}
                          >
                            {note.authorName || note.author || "Unknown"}
                          </span>
                          <span style={{ fontSize: "11px", color: C.muted }}>
                            {formatTimestamp(note.createdAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: C.text,
                            lineHeight: "1.5",
                            wordBreak: "break-word",
                          }}
                        >
                          {highlightMentions(note.text || "")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadBottomRef} />
              </div>

              {/* New note input + @mention dropdown */}
              <div style={{ position: "relative" }}>
                {/* Mention dropdown */}
                {mentionQuery !== null && filteredMembers.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      boxShadow: C.shadow,
                      zIndex: 10,
                      overflow: "hidden",
                      maxHeight: "160px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredMembers.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertMention(m.name);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "8px 12px",
                          background:
                            idx === mentionDropdownIndex
                              ? C.accentLight
                              : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.1s",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: avatarColor(m.name),
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(m.name)}
                        </div>
                        <span style={{ fontSize: "13px", color: C.text }}>
                          {m.name}
                        </span>
                        {m.role && (
                          <span style={{ fontSize: "11px", color: C.muted }}>
                            {m.role}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    ref={noteInputRef}
                    style={{ ...inputStyle, flex: 1 }}
                    value={noteInput}
                    onChange={handleNoteInputChange}
                    onKeyDown={handleNoteKeyDown}
                    placeholder="Add a note… type @ to mention someone"
                    disabled={sendingNote}
                  />
                  <button
                    type="button"
                    onClick={handleSendNote}
                    disabled={!noteInput.trim() || sendingNote}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        !noteInput.trim() || sendingNote ? C.border : C.accent,
                      color:
                        !noteInput.trim() || sendingNote ? C.muted : "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor:
                        !noteInput.trim() || sendingNote
                          ? "default"
                          : "pointer",
                      transition: "background 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sendingNote ? "..." : "Send"}
                  </button>
                </div>

                {!post?.id && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: C.muted,
                      marginTop: "6px",
                    }}
                  >
                    Notes save when you send
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════ DETAILS TAB ════════════════ */}
          {tab === "details" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Author</label>
                  <input
                    style={inputStyle}
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Assignee</label>
                  {teamMembers.length > 0 ? (
                    <select
                      style={{ ...inputStyle, appearance: "none" }}
                      value={form.assignee}
                      onChange={(e) => set("assignee", e.target.value)}
                    >
                      <option value="">— Unassigned —</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      style={inputStyle}
                      value={form.assignee}
                      onChange={(e) => set("assignee", e.target.value)}
                      placeholder="Team member name"
                    />
                  )}
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Assigned To</label>
                <select
                  style={{ ...inputStyle, appearance: "none" }}
                  value={form.assignedTo || ""}
                  onChange={(e) => set("assignedTo", e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Asset URL / Drive Link</label>
                <input
                  style={inputStyle}
                  value={form.assetUrl}
                  onChange={(e) => set("assetUrl", e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {post?.createdAt && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: C.cardBg,
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                    fontSize: "12px",
                    color: C.muted,
                    lineHeight: "1.7",
                  }}
                >
                  <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
                  {post.updatedAt && (
                    <div>Updated: {new Date(post.updatedAt).toLocaleString()}</div>
                  )}
                </div>
              )}
            </>
          )}
        </form>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            background: C.surface,
          }}
        >
          <div>
            {post?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${confirmDelete ? "#EF4444" : C.border}`,
                  background: confirmDelete
                    ? "rgba(239,68,68,0.1)"
                    : "transparent",
                  color: confirmDelete ? "#EF4444" : C.muted,
                  fontSize: "13px",
                  cursor: deleting ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {deleting
                  ? "Deleting..."
                  : confirmDelete
                  ? "Confirm Delete"
                  : "Delete"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: "none",
                background:
                  saving || !form.title.trim() ? C.border : C.accent,
                color: saving || !form.title.trim() ? C.muted : "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor:
                  saving || !form.title.trim() ? "default" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {saving ? "Saving..." : post?.id ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
