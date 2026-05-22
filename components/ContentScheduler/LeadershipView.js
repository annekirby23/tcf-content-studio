"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return crypto.randomBytes(6).toString("hex");
}

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

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function avatarBg(name = "") {
  const palette = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

function sectionLabel(text) {
  return (
    <div style={{
      fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em",
      color: C.muted, fontWeight: 700, marginBottom: 12,
    }}>
      {text}
    </div>
  );
}

function inputStyle(extra = {}) {
  return {
    padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8,
    background: C.inputBg, color: C.text, fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", width: "100%", ...extra,
  };
}

function btnStyle(variant = "primary", extra = {}) {
  const base = {
    border: "none", borderRadius: 8, padding: "7px 14px",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s",
  };
  if (variant === "primary") return { ...base, background: C.accent, color: "#fff", ...extra };
  if (variant === "ghost")   return { ...base, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, ...extra };
  if (variant === "danger")  return { ...base, background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)", ...extra };
  return { ...base, ...extra };
}

const PRIORITY_CFG = {
  high:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   label: "High" },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  label: "Medium" },
  low:    { color: "#10B981", bg: "rgba(16,185,129,0.12)",  label: "Low" },
};

function PriorityChip({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
      background: cfg.bg, color: cfg.color, letterSpacing: "0.04em",
    }}>
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />;
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ children }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "20px 24px", marginBottom: 20,
      boxShadow: C.shadow,
    }}>
      {children}
    </div>
  );
}

// ─── 1. Google Drive Link ─────────────────────────────────────────────────────

function DriveCard({ driveUrl, isAdmin, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(driveUrl || "");

  useEffect(() => { setDraft(driveUrl || ""); }, [driveUrl]);

  const handleSave = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  return (
    <SectionCard>
      {sectionLabel("Google Drive")}
      {editing ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={inputStyle({ flex: 1 })}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste Google Drive folder URL…"
            autoFocus
          />
          <button style={btnStyle("primary")} onClick={handleSave}>Save</button>
          <button style={btnStyle("ghost")} onClick={() => { setDraft(driveUrl || ""); setEditing(false); }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {driveUrl ? (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: C.accent, fontWeight: 600, fontSize: 14,
                textDecoration: "none", padding: "7px 14px",
                background: C.accentLight, borderRadius: 8,
                border: `1px solid ${C.accent}33`,
              }}
            >
              📂 Open Leadership Folder →
            </a>
          ) : (
            <span style={{ color: C.muted, fontSize: 13 }}>No Drive folder linked yet.</span>
          )}
          {isAdmin && (
            <button
              title="Edit Drive URL"
              onClick={() => setEditing(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.muted, fontSize: 16, padding: "4px 6px",
                borderRadius: 6, lineHeight: 1,
              }}
            >
              ✏️
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── 2. Who's Working On What ────────────────────────────────────────────────

function WorkingOnCard({ member, isAdmin, onSaveStatus }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member.status || "");

  useEffect(() => { setDraft(member.status || ""); }, [member.status]);

  const handleSave = () => {
    onSaveStatus(member.memberId, draft.trim());
    setEditing(false);
  };

  return (
    <div
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: C.shadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: avatarBg(member.memberName),
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>
          {initials(member.memberName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{member.memberName}</div>
          {member.updatedAt && (
            <div style={{ fontSize: 11, color: C.muted }}>Updated {timeAgo(member.updatedAt)}</div>
          )}
        </div>
        {isAdmin && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 15, padding: "2px 4px" }}
            title="Edit status"
          >
            ✏️
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            style={inputStyle()}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What are they working on?"
            autoFocus
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btnStyle("primary", { flex: 1, padding: "6px 10px", fontSize: 12 })} onClick={handleSave}>Save</button>
            <button style={btnStyle("ghost", { padding: "6px 10px", fontSize: 12 })} onClick={() => { setDraft(member.status || ""); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 13, color: member.status ? C.text : C.muted,
          background: C.card, borderRadius: 8, padding: "8px 10px",
          border: `1px solid ${C.border}`, minHeight: 36,
          fontStyle: member.status ? "normal" : "italic",
        }}>
          {member.status || "No status set."}
        </div>
      )}
    </div>
  );
}

function WorkingOnSection({ workingOn, teamMembers, isAdmin, onSave }) {
  // Merge teamMembers into workingOn (ensure every leadership member has an entry)
  const merged = teamMembers.map((tm) => {
    const existing = (workingOn || []).find((w) => w.memberId === tm.id);
    return existing || { memberId: tm.id, memberName: tm.name, status: "", updatedAt: null };
  });

  const handleSaveStatus = (memberId, status) => {
    const updated = merged.map((w) =>
      w.memberId === memberId ? { ...w, status, updatedAt: new Date().toISOString() } : w
    );
    onSave(updated);
  };

  if (merged.length === 0) {
    return (
      <SectionCard>
        {sectionLabel("Who's Working On What")}
        <div style={{ color: C.muted, fontSize: 13 }}>No leadership team members found.</div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      {sectionLabel("Who's Working On What")}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}>
        {merged.map((member) => (
          <WorkingOnCard
            key={member.memberId}
            member={member}
            isAdmin={isAdmin}
            onSaveStatus={handleSaveStatus}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 3. Meeting Schedule ─────────────────────────────────────────────────────

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const EMPTY_MEETING = { title: "", dayOfWeek: "Monday", time: "", location: "", notes: "" };

function MeetingScheduleSection({ meetings, isAdmin, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_MEETING);
  const [editId, setEditId] = useState(null);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const newMeeting = { ...form, id: genId() };
    onSave([...(meetings || []), newMeeting]);
    setForm(EMPTY_MEETING);
    setShowForm(false);
  };

  const handleEdit = (m) => {
    setEditId(m.id);
    setForm({ title: m.title, dayOfWeek: m.dayOfWeek, time: m.time, location: m.location, notes: m.notes || "" });
    setShowForm(false);
  };

  const handleSaveEdit = () => {
    onSave((meetings || []).map((m) => m.id === editId ? { ...m, ...form } : m));
    setEditId(null);
    setForm(EMPTY_MEETING);
  };

  const handleDelete = (id) => {
    onSave((meetings || []).filter((m) => m.id !== id));
  };

  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {sectionLabel("Meeting Schedule")}
        {isAdmin && !showForm && !editId && (
          <button style={btnStyle("primary", { padding: "5px 12px", fontSize: 12 })} onClick={() => setShowForm(true)}>
            + Add Meeting
          </button>
        )}
      </div>

      {/* Inline add form */}
      {isAdmin && showForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input style={inputStyle()} placeholder="Meeting title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select style={inputStyle()} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input style={inputStyle()} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <input style={inputStyle()} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <input style={inputStyle({ marginBottom: 8 })} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btnStyle("primary", { fontSize: 12, padding: "6px 12px" })} onClick={handleAdd}>Add</button>
            <button style={btnStyle("ghost", { fontSize: 12, padding: "6px 12px" })} onClick={() => { setShowForm(false); setForm(EMPTY_MEETING); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Meeting list */}
      {(meetings || []).length === 0 && !showForm && (
        <div style={{ color: C.muted, fontSize: 13 }}>No meetings scheduled yet.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(meetings || []).map((m) => (
          <div key={m.id}>
            {editId === m.id ? (
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input style={inputStyle()} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <select style={inputStyle()} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <input style={inputStyle()} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  <input style={inputStyle()} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <input style={inputStyle({ marginBottom: 8 })} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btnStyle("primary", { fontSize: 12, padding: "6px 12px" })} onClick={handleSaveEdit}>Save</button>
                  <button style={btnStyle("ghost", { fontSize: 12, padding: "6px 12px" })} onClick={() => { setEditId(null); setForm(EMPTY_MEETING); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: C.cardBg, border: `1px solid ${C.border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {m.dayOfWeek}{m.time ? ` · ${m.time}` : ""}{m.location ? ` · ${m.location}` : ""}
                    {m.notes ? <span style={{ fontStyle: "italic" }}> — {m.notes}</span> : null}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14, padding: "2px 4px" }} onClick={() => handleEdit(m)}>✏️</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 14, padding: "2px 4px" }} onClick={() => handleDelete(m.id)}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 4. Current Agenda ───────────────────────────────────────────────────────

function AgendaSection({ agenda, isAdmin, onSave }) {
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    const item = { id: genId(), text: newText.trim(), priority: newPriority, done: false };
    onSave([...(agenda || []), item]);
    setNewText("");
    setNewPriority("medium");
    setShowForm(false);
  };

  const handleToggle = (id) => {
    onSave((agenda || []).map((a) => a.id === id ? { ...a, done: !a.done } : a));
  };

  const handleDelete = (id) => {
    onSave((agenda || []).filter((a) => a.id !== id));
  };

  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {sectionLabel("Current Agenda")}
        {isAdmin && !showForm && (
          <button style={btnStyle("primary", { padding: "5px 12px", fontSize: 12 })} onClick={() => setShowForm(true)}>
            + Add Item
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={inputStyle({ flex: 1 })}
            placeholder="Agenda item…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <select
            style={inputStyle({ width: 100, flexShrink: 0 })}
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button style={btnStyle("primary", { fontSize: 12, padding: "6px 12px", flexShrink: 0 })} onClick={handleAdd}>Add</button>
          <button style={btnStyle("ghost", { fontSize: 12, padding: "6px 12px", flexShrink: 0 })} onClick={() => { setShowForm(false); setNewText(""); }}>Cancel</button>
        </div>
      )}

      {(agenda || []).length === 0 && !showForm && (
        <div style={{ color: C.muted, fontSize: 13 }}>No agenda items yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(agenda || []).map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: C.cardBg, border: `1px solid ${C.border}` }}>
            <input
              type="checkbox"
              checked={!!item.done}
              onChange={() => handleToggle(item.id)}
              style={{ cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
            />
            <PriorityDot priority={item.priority} />
            <span style={{
              flex: 1, fontSize: 13, color: C.text,
              textDecoration: item.done ? "line-through" : "none",
              opacity: item.done ? 0.5 : 1,
            }}>
              {item.text}
            </span>
            <PriorityChip priority={item.priority} />
            {isAdmin && (
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 14, padding: "2px 4px" }} onClick={() => handleDelete(item.id)}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 5. Meeting Notes ────────────────────────────────────────────────────────

function NoteEntry({ note, isAdmin, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{note.title}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{formatDate(note.date)}</span>
            <span style={{ fontSize: 11, color: C.muted }}>· added {timeAgo(note.createdAt)}</span>
          </div>
          <div
            style={{
              fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.6,
              overflow: expanded ? "visible" : "hidden",
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {note.content}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 12, padding: "4px 0", fontWeight: 600 }}
          >
            {expanded ? "Show less ↑" : "Show more ↓"}
          </button>
        </div>
        {isAdmin && (
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 14, padding: "2px 4px", flexShrink: 0 }} onClick={() => onDelete(note.id)}>🗑</button>
        )}
      </div>
    </div>
  );
}

function MeetingNotesSection({ meetingNotes, isAdmin, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", content: "" });

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const note = {
      id: genId(),
      date: form.date || new Date().toISOString().slice(0, 10),
      title: form.title.trim(),
      content: form.content.trim(),
      createdAt: new Date().toISOString(),
    };
    // Most recent first
    onSave([note, ...(meetingNotes || [])]);
    setForm({ title: "", date: "", content: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave((meetingNotes || []).filter((n) => n.id !== id));
  };

  const sorted = [...(meetingNotes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {sectionLabel("Meeting Notes")}
        {isAdmin && !showForm && (
          <button style={btnStyle("primary", { padding: "5px 12px", fontSize: 12 })} onClick={() => setShowForm(true)}>
            + Add Note
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
            <input style={inputStyle()} placeholder="Note title…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input style={inputStyle({ width: 150 })} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <textarea
            style={{ ...inputStyle(), height: 100, resize: "vertical", marginBottom: 8 }}
            placeholder="Meeting notes content…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btnStyle("primary", { fontSize: 12, padding: "6px 12px" })} onClick={handleAdd}>Save Note</button>
            <button style={btnStyle("ghost", { fontSize: 12, padding: "6px 12px" })} onClick={() => { setShowForm(false); setForm({ title: "", date: "", content: "" }); }}>Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <div style={{ color: C.muted, fontSize: 13 }}>No meeting notes yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((note) => (
          <NoteEntry key={note.id} note={note} isAdmin={isAdmin} onDelete={handleDelete} />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 6. Leadership Tasks ─────────────────────────────────────────────────────

const EMPTY_TASK_FORM = { text: "", assignedTo: null, priority: "medium", dueDate: "" };

function TaskItem({ task, isAdmin, teamMembers, onToggle, onDelete }) {
  const overdue = !task.done && isOverdue(task.dueDate);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", borderRadius: 9,
      background: C.cardBg, border: `1px solid ${C.border}`,
      opacity: task.done ? 0.65 : 1,
    }}>
      <input
        type="checkbox"
        checked={!!task.done}
        onChange={() => onToggle(task.id)}
        style={{ cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
      />
      <PriorityDot priority={task.priority} />
      <span style={{
        flex: 1, fontSize: 13, color: C.text,
        textDecoration: task.done ? "line-through" : "none",
      }}>
        {task.text}
      </span>

      {/* Assignee pill */}
      {task.assignedTo?.name && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
          background: `${avatarBg(task.assignedTo.name)}22`,
          color: avatarBg(task.assignedTo.name),
          border: `1px solid ${avatarBg(task.assignedTo.name)}44`,
        }}>
          {task.assignedTo.name}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span style={{ fontSize: 11, color: overdue ? "#EF4444" : C.muted, fontWeight: overdue ? 700 : 400 }}>
          {overdue ? "⚠ " : ""}{formatDate(task.dueDate)}
        </span>
      )}

      <PriorityChip priority={task.priority} />

      {isAdmin && (
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 14, padding: "2px 4px" }} onClick={() => onDelete(task.id)}>🗑</button>
      )}
    </div>
  );
}

function TasksSection({ tasks, isAdmin, teamMembers, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TASK_FORM);

  const handleAdd = () => {
    if (!form.text.trim()) return;
    const task = {
      id: genId(),
      text: form.text.trim(),
      done: false,
      assignedTo: form.assignedTo || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };
    onSave([...(tasks || []), task]);
    setForm(EMPTY_TASK_FORM);
    setShowForm(false);
  };

  const handleToggle = (id) => {
    onSave((tasks || []).map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDelete = (id) => {
    onSave((tasks || []).filter((t) => t.id !== id));
  };

  const sorted = [...(tasks || [])].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const prioOrder = { high: 0, medium: 1, low: 2 };
    return (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
  });

  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {sectionLabel("Leadership Tasks")}
        {isAdmin && !showForm && (
          <button style={btnStyle("primary", { padding: "5px 12px", fontSize: 12 })} onClick={() => setShowForm(true)}>
            + Add Task
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <input
            style={inputStyle({ marginBottom: 8 })}
            placeholder="Task description…"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            autoFocus
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <select
              style={inputStyle()}
              value={form.assignedTo?.id || ""}
              onChange={(e) => {
                const member = teamMembers.find((m) => m.id === e.target.value);
                setForm({ ...form, assignedTo: member ? { id: member.id, name: member.name } : null });
              }}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select style={inputStyle()} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input style={inputStyle()} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btnStyle("primary", { fontSize: 12, padding: "6px 12px" })} onClick={handleAdd}>Add Task</button>
            <button style={btnStyle("ghost", { fontSize: 12, padding: "6px 12px" })} onClick={() => { setShowForm(false); setForm(EMPTY_TASK_FORM); }}>Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <div style={{ color: C.muted, fontSize: 13 }}>No tasks yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isAdmin={isAdmin}
            teamMembers={teamMembers}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Main LeadershipView ──────────────────────────────────────────────────────

export default function LeadershipView({ token, currentUser, teamMembers = [] }) {
  const isAdmin = currentUser?.role === "admin";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/leadership", {}, token);
        if (!res.ok) throw new Error("Failed to load leadership data");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Optimistic save helper
  const save = async (patch) => {
    const optimistic = { ...data, ...patch };
    setData(optimistic);
    try {
      const res = await apiFetch("/api/leadership", {
        method: "PUT",
        body: JSON.stringify(patch),
      }, token);
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setData(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
        Loading leadership hub…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 60px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>
            🏛 Leadership Hub
          </h1>
          {isAdmin && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              background: C.accentLight, color: C.accent,
              border: `1px solid ${C.accent}33`, letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Admin
            </span>
          )}
        </div>
        <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
          Leadership team resources — meetings, agenda, notes, and tasks.
        </p>
      </div>

      {/* Google Drive */}
      <DriveCard
        driveUrl={data?.driveUrl || ""}
        isAdmin={isAdmin}
        onSave={(driveUrl) => save({ driveUrl })}
      />

      {/* Who's Working On What */}
      <WorkingOnSection
        workingOn={data?.workingOn || []}
        teamMembers={teamMembers}
        isAdmin={isAdmin}
        onSave={(workingOn) => save({ workingOn })}
      />

      {/* Meeting Schedule */}
      <MeetingScheduleSection
        meetings={data?.meetings || []}
        isAdmin={isAdmin}
        onSave={(meetings) => save({ meetings })}
      />

      {/* Current Agenda */}
      <AgendaSection
        agenda={data?.agenda || []}
        isAdmin={isAdmin}
        onSave={(agenda) => save({ agenda })}
      />

      {/* Meeting Notes */}
      <MeetingNotesSection
        meetingNotes={data?.meetingNotes || []}
        isAdmin={isAdmin}
        onSave={(meetingNotes) => save({ meetingNotes })}
      />

      {/* Leadership Tasks */}
      <TasksSection
        tasks={data?.tasks || []}
        isAdmin={isAdmin}
        teamMembers={teamMembers}
        onSave={(tasks) => save({ tasks })}
      />
    </div>
  );
}
