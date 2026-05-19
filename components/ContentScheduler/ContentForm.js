"use client";

import { useState, useEffect } from "react";
import {
  PLATFORMS,
  CONTENT_TYPES,
  STATUSES,
  PILLARS,
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
  hashtags: "",
  cta: "",
  assetUrl: "",
  notes: "",
};

export default function ContentForm({ post, campaigns, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(post ? { ...EMPTY, ...post } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState("content");

  useEffect(() => {
    setForm(post ? { ...EMPTY, ...post } : { ...EMPTY });
    setTab("content");
    setConfirmDelete(false);
  }, [post]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const togglePlatform = (id) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id) ? f.platforms.filter((p) => p !== id) : [...f.platforms, id],
    }));
  };

  const charLimit = form.platforms.length > 0
    ? Math.min(...form.platforms.map((p) => CHAR_LIMITS[p] || Infinity).filter((n) => n !== null && isFinite(n)))
    : null;

  const captionLen = form.caption.length;
  const captionOver = charLimit && captionLen > charLimit;

  const bestTimes = form.platforms.length > 0 ? BEST_TIMES[form.platforms[0]] || [] : [];

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
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

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
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: C.muted,
    letterSpacing: "0.08em",
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
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
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
          maxWidth: "680px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${C.border}`, paddingBottom: "0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: C.text }}>
              {post?.id ? "Edit Content" : "New Content"}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: "20px", cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "0" }}>
            {["content", "schedule", "details"].map((t) => (
              <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
                {t === "content" ? "Content" : t === "schedule" ? "Schedule" : "Details"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {tab === "content" && (
            <>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Content Type</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.contentType} onChange={(e) => set("contentType", e.target.value)}>
                    {CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={fieldStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Caption / Copy</label>
                  {charLimit && (
                    <span style={{ fontSize: "11px", color: captionOver ? "#EF4444" : C.muted }}>
                      {captionLen} / {charLimit}
                    </span>
                  )}
                </div>
                <textarea
                  style={{ ...inputStyle, minHeight: "120px", resize: "vertical", lineHeight: "1.5" }}
                  value={form.caption}
                  onChange={(e) => set("caption", e.target.value)}
                  placeholder="Write your caption, article intro, or script here..."
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Hashtags</label>
                <input
                  style={inputStyle}
                  value={form.hashtags}
                  onChange={(e) => set("hashtags", e.target.value)}
                  placeholder="#brand #marketing #contentcreator"
                />
              </div>

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

          {tab === "schedule" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    style={{ ...inputStyle, colorScheme: "dark" }}
                    value={form.scheduledDate}
                    onChange={(e) => set("scheduledDate", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input
                    type="time"
                    style={{ ...inputStyle, colorScheme: "dark" }}
                    value={form.scheduledTime}
                    onChange={(e) => set("scheduledTime", e.target.value)}
                  />
                </div>
              </div>

              {bestTimes.length > 0 && (
                <div style={{ ...fieldStyle, padding: "12px 16px", background: C.accentLight, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: C.accentBright, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Best Times for {PLATFORMS.find((p) => p.id === form.platforms[0])?.label}
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
                          border: `1px solid ${form.scheduledTime === t ? C.accent : C.border}`,
                          background: form.scheduledTime === t ? C.accentLight : "transparent",
                          color: form.scheduledTime === t ? C.accentBright : C.muted,
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
                <select style={{ ...inputStyle, appearance: "none" }} value={form.campaign} onChange={(e) => set("campaign", e.target.value)}>
                  <option value="">— No Campaign —</option>
                  {campaigns.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Content Pillar</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.pillar} onChange={(e) => set("pillar", e.target.value)}>
                    <option value="">— Select —</option>
                    {PILLARS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === "details" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
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
                  <input
                    style={inputStyle}
                    value={form.assignee}
                    onChange={(e) => set("assignee", e.target.value)}
                    placeholder="Team member"
                  />
                </div>
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

              <div style={fieldStyle}>
                <label style={labelStyle}>Internal Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "100px", resize: "vertical", lineHeight: "1.5" }}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Notes for the team, revision requests, context..."
                />
              </div>

              {post?.createdAt && (
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "12px", color: C.muted }}>
                  <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
                  {post.updatedAt && <div style={{ marginTop: "4px" }}>Updated: {new Date(post.updatedAt).toLocaleString()}</div>}
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
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
                  background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
                  color: confirmDelete ? "#EF4444" : C.muted,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 20px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="content-form"
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: "none",
                background: saving || !form.title.trim() ? C.muted : C.accent,
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: saving || !form.title.trim() ? "default" : "pointer",
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
