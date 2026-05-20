"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-session": token,
      ...(opts.headers || {}),
    },
  });
}

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
    ...extra,
  };
}

function MemberInitials({ name, size = 24 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0, border: `2px solid ${C.card}` }}>
      {ini}
    </div>
  );
}

const STATUS_CONFIG = {
  idea:      { label: "💡 Idea",      color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  planning:  { label: "📋 Planning",  color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  confirmed: { label: "✅ Confirmed", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  complete:  { label: "🏁 Complete",  color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
};

const ITEM_CATEGORIES = [
  "Venue", "Catering", "Marketing", "Budget", "AV / Tech",
  "Logistics", "Staffing", "Invitations", "Decor", "Other",
];

const EVENT_COLORS = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4","#F97316"];

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idea;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: "700" }}>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ items }) {
  if (!items || items.length === 0) return null;
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", color: C.muted, fontWeight: "600" }}>Checklist</span>
        <span style={{ fontSize: "10px", color: C.muted }}>{done}/{items.length}</span>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: C.border, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: C.accent, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventModal({ event, token, currentUser, teamMembers, onClose, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editField, setEditField] = useState(null);
  const [fieldVal, setFieldVal] = useState("");
  const [itemText, setItemText] = useState("");
  const [itemCategory, setItemCategory] = useState("General");
  const [itemAssignee, setItemAssignee] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const patch = async (body) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/events/${event.id}`, { method: "PUT", body: JSON.stringify(body) }, token);
      const updated = await res.json();
      onUpdate(updated);
    } finally { setSaving(false); }
  };

  const startEdit = (field, val) => { setEditField(field); setFieldVal(val || ""); };
  const cancelEdit = () => { setEditField(null); setFieldVal(""); };
  const saveField = async (field) => {
    await patch({ [field]: fieldVal });
    cancelEdit();
  };

  const addItem = async () => {
    if (!itemText.trim()) return;
    await patch({ itemAction: "add", itemText: itemText.trim(), category: itemCategory, assignedTo: itemAssignee });
    setItemText("");
    setItemAssignee(null);
  };

  const toggleItem = (itemId) => patch({ itemAction: "toggle", itemId });

  const deleteItem = (itemId) => patch({ itemAction: "delete", itemId });

  const addComment = async () => {
    if (!commentText.trim()) return;
    await patch({ commentAction: "add", commentText: commentText.trim() });
    setCommentText("");
  };

  const items = event.items || [];
  const comments = event.comments || [];
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category || "Other")))];
  const filteredItems = filterCat === "All" ? items : items.filter((i) => (i.category || "Other") === filterCat);

  const tabs = [
    { id: "overview", label: "📋 Overview" },
    { id: "checklist", label: `✅ Checklist (${items.length})` },
    { id: "comments", label: `💬 Comments (${comments.length})` },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "680px", maxWidth: "95vw", maxHeight: "90vh",
        background: C.card, border: `1px solid ${C.border}`,
        borderLeft: `5px solid ${event.color || C.accent}`,
        borderRadius: "16px", zIndex: 3001, boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editField === "title" ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    autoFocus value={fieldVal} onChange={(e) => setFieldVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveField("title"); if (e.key === "Escape") cancelEdit(); }}
                    style={{ ...textInput({ flex: 1, fontSize: "18px", fontWeight: "700" }) }}
                  />
                  <button onClick={() => saveField("title")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <h2
                  onClick={() => startEdit("title", event.title)}
                  style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: C.text, cursor: "pointer", lineHeight: "1.3" }}
                  title="Click to edit"
                >
                  {event.title}
                </h2>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <StatusPill status={event.status} />
                {event.date && (
                  <span style={{ fontSize: "12px", color: C.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                    📅 {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {event.createdBy && (
                  <span style={{ fontSize: "11px", color: C.muted, padding: "2px 7px", borderRadius: "10px", background: C.cardBg, border: `1px solid ${C.border}` }}>
                    Created by {event.createdBy}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                onClick={() => { if (confirm("Delete this event?")) onDelete(event.id); }}
                style={{ padding: "6px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: "#EF4444", fontSize: "12px", cursor: "pointer" }}
              >
                🗑 Delete
              </button>
              <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "14px", cursor: "pointer" }}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginTop: "14px" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none",
                  background: activeTab === t.id ? C.accentLight : "transparent",
                  color: activeTab === t.id ? C.accent : C.muted,
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Quick fields row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Status */}
                <div>
                  <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Status</div>
                  <select
                    value={event.status}
                    onChange={(e) => patch({ status: e.target.value })}
                    style={{ ...textInput({ width: "100%", color: C.text }) }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {/* Date */}
                <div>
                  <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Event Date</div>
                  <input
                    type="date"
                    value={event.date || ""}
                    onChange={(e) => patch({ date: e.target.value || null })}
                    style={{ ...textInput({ width: "100%", color: C.text }) }}
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Color</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patch({ color: c })}
                      style={{ width: "26px", height: "26px", borderRadius: "50%", background: c, border: event.color === c ? `3px solid ${C.text}` : "3px solid transparent", cursor: "pointer", padding: 0, transition: "border-color 0.12s" }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Description</div>
                {editField === "description" ? (
                  <div>
                    <textarea
                      autoFocus value={fieldVal} onChange={(e) => setFieldVal(e.target.value)}
                      rows={3} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
                    />
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      <button onClick={() => saveField("description")} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Save</button>
                      <button onClick={cancelEdit} style={{ padding: "4px 8px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEdit("description", event.description)}
                    style={{ fontSize: "13px", color: event.description ? C.text : C.muted, lineHeight: "1.6", padding: "10px 12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, cursor: "pointer", minHeight: "60px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    title="Click to edit"
                  >
                    {event.description || <em>Click to add a description…</em>}
                  </div>
                )}
              </div>

              {/* Google Drive Link */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Google Drive Folder</div>
                {editField === "driveFolderUrl" ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      autoFocus value={fieldVal} onChange={(e) => setFieldVal(e.target.value)}
                      style={{ ...textInput({ flex: 1 }) }} placeholder="https://drive.google.com/…"
                      onKeyDown={(e) => { if (e.key === "Enter") saveField("driveFolderUrl"); if (e.key === "Escape") cancelEdit(); }}
                    />
                    <button onClick={() => saveField("driveFolderUrl")} style={{ padding: "7px 12px", borderRadius: "6px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Save</button>
                    <button onClick={cancelEdit} style={{ padding: "7px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {event.driveFolderUrl ? (
                      <a
                        href={event.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "13px", color: C.accent, display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", border: `1px solid ${C.accent}`, background: C.accentLight, fontWeight: "500", textDecoration: "none" }}
                      >
                        📂 Open Drive Folder
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No Drive folder linked</span>
                    )}
                    <button onClick={() => startEdit("driveFolderUrl", event.driveFolderUrl)} style={{ fontSize: "11px", color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>✏ Edit</button>
                  </div>
                )}
              </div>

              {/* Resource Links */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Resource Links</div>
                <ResourceLinksEditor links={event.resourceLinks || []} onSave={(resourceLinks) => patch({ resourceLinks })} />
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Notes</div>
                {editField === "notes" ? (
                  <div>
                    <textarea
                      autoFocus value={fieldVal} onChange={(e) => setFieldVal(e.target.value)}
                      rows={4} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
                    />
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      <button onClick={() => saveField("notes")} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Save</button>
                      <button onClick={cancelEdit} style={{ padding: "4px 8px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEdit("notes", event.notes)}
                    style={{ fontSize: "13px", color: event.notes ? C.text : C.muted, lineHeight: "1.6", padding: "10px 12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, cursor: "pointer", minHeight: "60px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    title="Click to edit"
                  >
                    {event.notes || <em>Click to add notes…</em>}
                  </div>
                )}
              </div>

              {/* Members */}
              <div>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Team Members</div>
                <MembersEditor
                  members={event.members || []}
                  teamMembers={teamMembers}
                  onSave={(members) => patch({ members })}
                />
              </div>

              {/* Checklist summary */}
              <ProgressBar items={items} />
            </div>
          )}

          {/* ── CHECKLIST TAB ── */}
          {activeTab === "checklist" && (
            <div>
              {/* Category filter */}
              {categories.length > 1 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                        border: `1px solid ${filterCat === cat ? C.accent : C.border}`,
                        background: filterCat === cat ? C.accentLight : "transparent",
                        color: filterCat === cat ? C.accent : C.muted,
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Grouped items */}
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: C.muted, fontSize: "13px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>✅</div>
                  No items yet. Add one below.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px",
                        background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`,
                        opacity: item.done ? 0.65 : 1, transition: "opacity 0.12s",
                      }}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        style={{
                          width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                          border: `2px solid ${item.done ? C.accent : C.border}`,
                          background: item.done ? C.accent : "transparent",
                          cursor: "pointer", padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {item.done && <span style={{ color: "#fff", fontSize: "11px" }}>✓</span>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", color: C.text, textDecoration: item.done ? "line-through" : "none", wordBreak: "break-word" }}>{item.text}</div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                          <span style={{ fontSize: "10px", color: C.muted, padding: "1px 6px", borderRadius: "10px", background: C.border }}>{item.category || "Other"}</span>
                          {item.assignedTo && (
                            <span style={{ fontSize: "10px", color: C.muted }}>{item.assignedTo.name || item.assignedTo}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "12px", opacity: 0.5, flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item form */}
              <div style={{ padding: "14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>Add Item</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    value={itemText} onChange={(e) => setItemText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder="Item description…"
                    style={{ ...textInput({ flex: "1 1 200px", minWidth: "160px" }) }}
                  />
                  <select
                    value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}
                    style={{ ...textInput({ flex: "0 0 auto", color: C.text }) }}
                  >
                    {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {teamMembers.length > 0 && (
                    <select
                      value={itemAssignee?.id || ""}
                      onChange={(e) => setItemAssignee(teamMembers.find((m) => m.id === e.target.value) || null)}
                      style={{ ...textInput({ flex: "0 0 auto", color: itemAssignee ? C.text : C.muted }) }}
                    >
                      <option value="">Assign…</option>
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  )}
                  <button
                    onClick={addItem} disabled={!itemText.trim()}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: itemText.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: itemText.trim() ? "pointer" : "not-allowed" }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── COMMENTS TAB ── */}
          {activeTab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: C.muted, fontSize: "13px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>💬</div>
                  No comments yet. Start the conversation.
                </div>
              ) : (
                comments.map((c, i) => (
                  <div key={c.id || i} style={{ padding: "10px 14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                      <MemberInitials name={c.authorName} size={22} />
                      <span style={{ fontSize: "12px", fontWeight: "700", color: C.accent }}>{c.authorName}</span>
                      <span style={{ fontSize: "10px", color: C.muted }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", marginLeft: "30px" }}>{c.text}</div>
                  </div>
                ))
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <input
                  value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a comment…"
                  style={{ ...textInput({ flex: 1 }) }}
                />
                <button
                  onClick={addComment} disabled={!commentText.trim()}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: commentText.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: commentText.trim() ? "pointer" : "not-allowed" }}
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Resource Links Editor ────────────────────────────────────────────────────

function ResourceLinksEditor({ links, onSave }) {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addLink = () => {
    if (!newUrl.trim()) return;
    const updated = [...links, { id: `rl_${Date.now()}`, label: newLabel.trim() || newUrl.trim(), url: newUrl.trim() }];
    onSave(updated);
    setNewLabel("");
    setNewUrl("");
  };

  const removeLink = (id) => onSave(links.filter((l) => l.id !== id));

  return (
    <div>
      {links.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {links.map((l) => (
            <div key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: C.cardBg, border: `1px solid ${C.border}`, fontSize: "12px" }}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>🔗 {l.label}</a>
              <button onClick={() => removeLink(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "11px", padding: "0 2px" }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (optional)" style={{ ...textInput({ flex: "1 1 120px", minWidth: "100px", fontSize: "12px" }) }} />
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} placeholder="https://…" style={{ ...textInput({ flex: "2 1 200px", minWidth: "140px", fontSize: "12px" }) }} />
        <button onClick={addLink} disabled={!newUrl.trim()} style={{ padding: "7px 14px", borderRadius: "7px", border: "none", background: newUrl.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newUrl.trim() ? "pointer" : "not-allowed" }}>+ Add</button>
      </div>
    </div>
  );
}

// ─── Members Editor ───────────────────────────────────────────────────────────

function MembersEditor({ members, teamMembers, onSave }) {
  const toggle = (m) => {
    const exists = members.find((x) => x.id === m.id);
    onSave(exists ? members.filter((x) => x.id !== m.id) : [...members, { id: m.id, name: m.name }]);
  };
  if (teamMembers.length === 0) return <div style={{ fontSize: "12px", color: C.muted }}>No team members available.</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {teamMembers.map((m) => {
        const selected = !!members.find((x) => x.id === m.id);
        return (
          <button
            key={m.id} onClick={() => toggle(m)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px 4px 5px", borderRadius: "20px",
              border: `1px solid ${selected ? C.accent : C.border}`,
              background: selected ? C.accentLight : "transparent",
              color: selected ? C.accent : C.muted,
              fontSize: "12px", fontWeight: "500", cursor: "pointer", transition: "all 0.12s",
            }}
          >
            <MemberInitials name={m.name} size={20} />
            {m.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── New Event Modal ──────────────────────────────────────────────────────────

function NewEventModal({ onSave, onClose, teamMembers = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idea");
  const [date, setDate] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const toggleMember = (m) => {
    setSelectedMembers((prev) => prev.find((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : [...prev, { id: m.id, name: m.name }]);
  };

  const submit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, status, date: date || null, color, driveFolderUrl: driveFolderUrl.trim(), members: selectedMembers });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px",
        padding: "24px", width: "480px", maxWidth: "92vw", zIndex: 2001,
        boxShadow: "0 16px 48px rgba(0,0,0,0.28)", maxHeight: "92vh", overflowY: "auto",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: "700", color: C.text }}>New Event</h3>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Event Name *</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...textInput({ width: "100%" }) }} placeholder="Summer Gala, Member Appreciation Night…" />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit" }) }} placeholder="What's this event about?" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...textInput({ width: "100%", color: C.text }) }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...textInput({ width: "100%", color: C.text }) }} />
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Google Drive Folder URL</label>
          <input value={driveFolderUrl} onChange={(e) => setDriveFolderUrl(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://drive.google.com/…" />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Color</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {EVENT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{ width: "26px", height: "26px", borderRadius: "50%", background: c, border: color === c ? `3px solid ${C.text}` : "3px solid transparent", cursor: "pointer", padding: 0, transition: "border-color 0.12s" }} />
            ))}
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Members</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {teamMembers.map((m) => {
                const selected = !!selectedMembers.find((x) => x.id === m.id);
                return (
                  <button key={m.id} onClick={() => toggleMember(m)} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", border: `1px solid ${selected ? C.accent : C.border}`, background: selected ? C.accentLight : C.cardBg, color: selected ? C.accent : C.muted, cursor: "pointer" }}>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: title.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: title.trim() ? "pointer" : "not-allowed" }}>
            Create Event
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }) {
  const [hov, setHov] = useState(false);
  const items = event.items || [];
  const done = items.filter((i) => i.done).length;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${hov ? (event.color || C.accent) : C.border}`,
        borderLeft: `4px solid ${event.color || C.accent}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: hov ? C.shadowMd : C.shadow,
        transform: hov ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, lineHeight: "1.3", flex: 1 }}>{event.title}</div>
        <StatusPill status={event.status} />
      </div>

      {event.date && (
        <div style={{ fontSize: "11px", color: C.muted, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          📅 {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}

      {event.description && (
        <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {event.description}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: C.muted }}>Checklist</span>
            <span style={{ fontSize: "10px", color: C.muted }}>{done}/{items.length}</span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: C.border, overflow: "hidden" }}>
            <div style={{ width: `${items.length ? Math.round((done / items.length) * 100) : 0}%`, height: "100%", background: event.color || C.accent, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
        {(event.members || []).length > 0 ? (
          <div style={{ display: "flex" }}>
            {(event.members || []).slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i > 0 ? "-7px" : 0 }} title={m.name}>
                <MemberInitials name={m.name} size={22} />
              </div>
            ))}
            {(event.members || []).length > 4 && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.cardBg, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: C.muted, fontWeight: "700", marginLeft: "-7px" }}>
                +{(event.members || []).length - 4}
              </div>
            )}
          </div>
        ) : <div />}
        {event.driveFolderUrl && (
          <span style={{ fontSize: "10px", color: C.muted }}>📂 Drive</span>
        )}
      </div>
    </div>
  );
}

// ─── Main EventsView ──────────────────────────────────────────────────────────

export default function EventsView({ token, currentUser, teamMembers = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/events", {}, token)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (data) => {
    setShowModal(false);
    try {
      const res = await apiFetch("/api/events", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setEvents((prev) => [saved, ...prev]);
    } catch {}
  };

  const handleUpdate = (updated) => {
    setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
    if (selectedEvent?.id === updated.id) setSelectedEvent(updated);
  };

  const handleDelete = async (id) => {
    setSelectedEvent(null);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await apiFetch(`/api/events/${id}`, { method: "DELETE" }, token);
    } catch {}
  };

  const statusFilters = [
    { id: "all", label: "All" },
    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ id: k, label: v.label })),
  ];

  const filtered = filterStatus === "all" ? events : events.filter((e) => e.status === filterStatus);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>📅 Events</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Plan and track upcoming events for the whole team.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
        >
          + New Event
        </button>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {statusFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
              border: `1px solid ${filterStatus === f.id ? C.accent : C.border}`,
              background: filterStatus === f.id ? C.accentLight : "transparent",
              color: filterStatus === f.id ? C.accent : C.muted,
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            {f.label}
            {f.id !== "all" && (
              <span style={{ marginLeft: "5px", opacity: 0.6 }}>
                ({events.filter((e) => e.status === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted, fontSize: "14px" }}>Loading events…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No events yet</div>
          <div style={{ fontSize: "13px" }}>Create your first event to start planning.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <NewEventModal onSave={handleCreate} onClose={() => setShowModal(false)} teamMembers={teamMembers} />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          token={token}
          currentUser={currentUser}
          teamMembers={teamMembers}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
