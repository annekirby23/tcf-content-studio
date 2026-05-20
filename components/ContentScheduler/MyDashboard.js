"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";
import WorkspaceAISummary from "./WorkspaceAISummary";

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function genId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().split("T")[0];
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < new Date().toISOString().split("T")[0];
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr > today;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function AddBtn({ onClick, label = "+ Add" }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: `1px solid ${hov ? C.accent : C.border}`,
        background: hov ? C.accentLight : C.cardBg,
        color: hov ? C.accent : C.muted,
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
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

function EmptyState({ icon, message }) {
  return (
    <div style={{
      textAlign: "center", padding: "28px 16px",
      background: C.cardBg, borderRadius: "10px",
      border: `1px dashed ${C.border}`,
      color: C.muted, fontSize: "13px",
    }}>
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
      {message}
    </div>
  );
}

const PRIORITY_MAP = {
  high:   { emoji: "🔴", label: "High",   color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  medium: { emoji: "🟡", label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  low:    { emoji: "🟢", label: "Low",    color: "#10B981", bg: "rgba(16,185,129,0.10)" },
};

function PriorityPill({ priority }) {
  const cfg = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "20px",
      background: cfg.bg, color: cfg.color,
      fontSize: "11px", fontWeight: "700",
      display: "inline-flex", alignItems: "center", gap: "3px",
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Editable section title ───────────────────────────────────────────────────

function EditableSectionTitle({ title, onSave, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);
  const [hov, setHov] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setVal(title); }, [title]);

  const save = () => {
    setEditing(false);
    if (val.trim() && val.trim() !== title) onSave(val.trim());
    else setVal(title);
  };

  if (readOnly) {
    return (
      <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em" }}>
        {title}
      </h2>
    );
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "6px" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(title); setEditing(false); } }}
          style={{
            fontSize: "14px", fontWeight: "700", color: C.text,
            background: "transparent", border: "none", borderBottom: `2px solid ${C.accent}`,
            outline: "none", padding: "0 2px", width: `${Math.max(val.length, 10)}ch`,
          }}
          autoFocus
        />
      ) : (
        <>
          <h2
            onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 10); }}
            style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em", cursor: "pointer" }}
          >
            {title}
          </h2>
          {hov && (
            <span
              onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 10); }}
              style={{ fontSize: "11px", color: C.muted, cursor: "pointer", opacity: 0.6 }}
              title="Edit title"
            >
              ✏
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ─── TASK DETAIL MODAL ────────────────────────────────────────────────────────

function TaskDetailModal({ task, token, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.text || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: title, description, priority, dueDate: dueDate || null }),
      }, token);
      if (res.ok) {
        const saved = await res.json();
        onUpdate(saved);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm("Delete this task?")) return;
    await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" }, token);
    onDelete(task.id);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "16px", padding: "24px", width: "500px", maxWidth: "92vw",
        zIndex: 2001, boxShadow: C.shadowMd,
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: C.text }}>Task Details</h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Task title" />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
            placeholder="Add more detail…"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...textInput({ width: "100%" }), color: C.text }}>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...textInput({ width: "100%", colorScheme: "light" }) }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
          <button
            onClick={del}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #FECACA", background: "rgba(239,68,68,0.06)", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            Delete
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete, onOpen, readOnly }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "9px 10px", borderRadius: "8px",
        background: hov ? C.hover : "transparent",
        transition: "background 0.12s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => !readOnly && onToggle(task)}
        style={{
          width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
          border: `2px solid ${task.done ? C.accent : C.border}`,
          background: task.done ? C.accent : "transparent",
          cursor: readOnly ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, transition: "all 0.12s", marginTop: "1px",
        }}
      >
        {task.done && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
      </button>

      {/* Text + meta */}
      <div
        style={{ flex: 1, minWidth: 0, cursor: readOnly ? "default" : "pointer" }}
        onClick={() => !readOnly && onOpen && onOpen(task)}
      >
        <div style={{
          fontSize: "13px", fontWeight: "500",
          color: task.done ? C.muted : C.text,
          textDecoration: task.done ? "line-through" : "none",
          lineHeight: "1.4",
        }}>
          {task.text}
        </div>
        {task.description && (
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.description}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
          {task.priority && <PriorityPill priority={task.priority} />}
          {task.dueDate && (
            <span style={{
              fontSize: "11px",
              padding: "2px 7px",
              borderRadius: "20px",
              background: isOverdue(task.dueDate) && !task.done ? "rgba(239,68,68,0.12)" : C.cardBg,
              border: `1px solid ${isOverdue(task.dueDate) && !task.done ? "rgba(239,68,68,0.3)" : C.border}`,
              color: isOverdue(task.dueDate) && !task.done ? "#EF4444" : C.muted,
              fontWeight: isOverdue(task.dueDate) && !task.done ? "700" : "500",
            }}>
              {isOverdue(task.dueDate) && !task.done ? "⚠ " : ""}Due: {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      {hov && !readOnly && (
        <button
          onClick={() => onDelete(task.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: "14px", padding: "2px 4px",
            opacity: 0.6, flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "4px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          width: "100%", background: "none", border: "none",
          padding: "6px 10px", cursor: "pointer", borderRadius: "6px",
          color: C.muted, fontSize: "11px", fontWeight: "700",
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}
      >
        <span style={{ fontSize: "9px", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.15s" }}>
          ▶
        </span>
        {title}
        <span style={{
          marginLeft: "auto", background: C.cardBg, border: `1px solid ${C.border}`,
          borderRadius: "10px", padding: "0 7px", fontSize: "11px",
          fontWeight: "700", color: C.muted,
        }}>
          {count}
        </span>
      </button>
      {open && <div style={{ paddingLeft: "4px" }}>{children}</div>}
    </div>
  );
}

function AddTaskForm({ onAdd }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [focused, setFocused] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), priority, dueDate: dueDate || null, description: description || "" });
    setText(""); setDueDate(""); setDescription(""); setShowDetails(false);
  };

  return (
    <div style={{
      marginBottom: "16px", padding: "12px",
      background: C.cardBg, borderRadius: "10px",
      border: `1px solid ${focused ? C.accent : C.border}`,
      transition: "border-color 0.15s",
    }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="New task…"
        style={{ ...textInput({ width: "100%", background: "transparent", border: "none", padding: "4px 0", marginBottom: "8px", fontSize: "14px" }) }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: showDetails ? "8px" : 0 }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ ...textInput({ flex: "0 0 auto" }), color: C.text }}
        >
          {Object.entries(PRIORITY_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "10px", fontWeight: "600", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ ...textInput({ width: "100%", colorScheme: "light" }) }}
          />
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          style={{ padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {showDetails ? "▲ Less" : "▼ Details"}
        </button>
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            padding: "8px 16px", borderRadius: "8px",
            border: "none", background: text.trim() ? C.accent : C.border,
            color: "#fff", fontSize: "13px", fontWeight: "600",
            cursor: text.trim() ? "pointer" : "not-allowed",
            transition: "background 0.15s", flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
      {showDetails && (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Add description (optional)…"
          style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
        />
      )}
    </div>
  );
}

function TasksColumn({ token, viewingUserId, currentUserId, sectionTitle, onSaveTitle }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [openTask, setOpenTask] = useState(null);
  // readOnly means you can't edit/delete existing tasks, but you CAN add new tasks for someone
  const isOwnWorkspace = viewingUserId === currentUserId;

  const fetchUrl = isOwnWorkspace ? "/api/tasks" : `/api/tasks?userId=${viewingUserId}`;
  const postUrl = isOwnWorkspace ? "/api/tasks" : `/api/tasks?userId=${viewingUserId}`;

  useEffect(() => {
    setLoading(true);
    apiFetch(fetchUrl, {}, token)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [token, fetchUrl]);

  const handleAdd = async (taskData) => {
    const tempId = genId();
    const optimistic = { id: tempId, ...taskData, done: false, addedBy: isOwnWorkspace ? undefined : "You" };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const res = await apiFetch(postUrl, { method: "POST", body: JSON.stringify(taskData) }, token);
      const saved = await res.json();
      setTasks((prev) => prev.map((t) => t.id === tempId ? saved : t));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const handleToggle = async (task) => {
    if (!isOwnWorkspace) return;
    const updated = { ...task, done: !task.done };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ done: updated.done }) }, token);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    }
  };

  const handleDelete = async (id) => {
    if (!isOwnWorkspace) return;
    const prev = tasks.find((t) => t.id === id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" }, token);
    } catch {
      if (prev) setTasks((ts) => [...ts, prev]);
    }
  };

  const handleUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  };

  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const todayOverdue = active.filter((t) => t.dueDate && (isToday(t.dueDate) || isOverdue(t.dueDate)));
  const upcoming = active.filter((t) => t.dueDate && isUpcoming(t.dueDate));
  const noDue = active.filter((t) => !t.dueDate);

  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={!isOwnWorkspace} />
        <AddBtn onClick={() => setShowForm((v) => !v)} label={showForm ? "✕ Cancel" : `+ Add${!isOwnWorkspace ? " for them" : ""}`} />
      </div>

      {showForm && <AddTaskForm onAdd={handleAdd} />}

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px", color: C.muted, fontSize: "13px" }}>Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" message={!isOwnWorkspace ? "No tasks yet." : "No tasks yet. Add your first task above."} />
      ) : (
        <div>
          {todayOverdue.length > 0 && (
            <CollapsibleSection title="Today & Overdue" count={todayOverdue.length}>
              {todayOverdue.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onOpen={isOwnWorkspace ? setOpenTask : null} readOnly={!isOwnWorkspace} />
              ))}
            </CollapsibleSection>
          )}
          {(upcoming.length > 0 || noDue.length > 0) && (
            <CollapsibleSection title="Upcoming" count={upcoming.length + noDue.length}>
              {[...upcoming, ...noDue].map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onOpen={setOpenTask} readOnly={!isOwnWorkspace} />
              ))}
            </CollapsibleSection>
          )}
          {done.length > 0 && (
            <CollapsibleSection title="Done" count={done.length} defaultOpen={false}>
              {done.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onOpen={isOwnWorkspace ? setOpenTask : null} readOnly={!isOwnWorkspace} />
              ))}
            </CollapsibleSection>
          )}
        </div>
      )}

      {openTask && isOwnWorkspace && (
        <TaskDetailModal
          task={openTask}
          token={token}
          onClose={() => setOpenTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ─── DAILY ROUTINES ───────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { id: "mon", label: "Mon", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  { id: "tue", label: "Tue", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { id: "wed", label: "Wed", color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
  { id: "thu", label: "Thu", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { id: "fri", label: "Fri", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { id: "sat", label: "Sat", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { id: "sun", label: "Sun", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
];

function DailyTaskItem({ task, onToggle, onDelete, onEdit, readOnly, isDone }) {
  const [hov, setHov] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text || "");
  const [editDays, setEditDays] = useState(task.days || ["mon","tue","wed","thu","fri"]);

  const activeDays = task.days && task.days.length > 0 ? task.days : ["mon","tue","wed","thu","fri"];
  const todayId = todayDayId();
  const isToday = activeDays.includes(todayId);

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEdit(task.id, editText.trim(), editDays);
    setEditing(false);
  };

  const toggleEditDay = (id) => setEditDays((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  if (editing) {
    return (
      <div style={{ background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: "10px", padding: "10px 12px", marginBottom: "0" }}>
        <input
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
          style={{ ...textInput({ width: "100%", fontSize: "13px", marginBottom: "8px" }), display: "block", marginBottom: "8px" }}
        />
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "8px" }}>
          {DAY_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => toggleEditDay(d.id)}
              style={{
                padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "700",
                border: `1px solid ${editDays.includes(d.id) ? d.color : C.border}`,
                background: editDays.includes(d.id) ? d.bg : "transparent",
                color: editDays.includes(d.id) ? d.color : C.muted,
                cursor: "pointer",
              }}
            >{d.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={saveEdit} disabled={!editText.trim()} style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: editText.trim() ? C.accent : C.border, color: "#fff", fontSize: "11px", fontWeight: "600", cursor: editText.trim() ? "pointer" : "not-allowed" }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isDone ? "transparent" : hov ? C.hover : C.card,
        border: `1px solid ${isDone ? C.border : isToday ? "rgba(99,102,241,0.2)" : C.border}`,
        borderLeft: `3px solid ${isDone ? C.border : isToday ? C.accent : activeDays.length > 0 ? DAY_OPTIONS.find(d => d.id === activeDays[0])?.color || C.border : C.border}`,
        borderRadius: "10px",
        padding: "10px 12px",
        transition: "all 0.12s",
        opacity: isDone ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
        {/* Checkbox */}
        <button
          onClick={() => !readOnly && onToggle(task)}
          style={{
            width: "17px", height: "17px", borderRadius: "5px", flexShrink: 0, marginTop: "1px",
            border: `2px solid ${isDone ? "#10B981" : C.border}`,
            background: isDone ? "#10B981" : "transparent",
            cursor: readOnly ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, transition: "all 0.12s",
          }}
        >
          {isDone && <span style={{ color: "#fff", fontSize: "10px", lineHeight: 1 }}>✓</span>}
        </button>

        {/* Text + day dots */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "500", color: isDone ? C.muted : C.text, textDecoration: isDone ? "line-through" : "none", lineHeight: "1.4", wordBreak: "break-word" }}>
            {task.text}
          </div>
          {/* Day pills */}
          {activeDays.length < 7 && (
            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "5px" }}>
              {DAY_OPTIONS.filter((d) => activeDays.includes(d.id)).map((d) => (
                <span
                  key={d.id}
                  style={{
                    fontSize: "9px", fontWeight: "700", padding: "1px 6px", borderRadius: "20px",
                    background: d.id === todayId ? d.bg : "transparent",
                    color: d.id === todayId ? d.color : C.muted,
                    border: `1px solid ${d.id === todayId ? d.color : C.border}`,
                  }}
                >{d.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {hov && !readOnly && (
          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            <button onClick={() => { setEditText(task.text); setEditDays(task.days || ["mon","tue","wed","thu","fri"]); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "12px", padding: "1px 4px", opacity: 0.7 }} title="Edit">✏️</button>
            <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: "12px", padding: "1px 4px", opacity: 0.6 }} title="Delete">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

function todayDayId() {
  const days = ["sun","mon","tue","wed","thu","fri","sat"];
  return days[new Date().getDay()];
}

function currentISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)}`;
}

function DailyRoutinesSection({ token, viewingUserId, currentUserId, sectionTitle, onSaveTitle }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newDays, setNewDays] = useState(["mon","tue","wed","thu","fri"]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("all");
  const readOnly = viewingUserId !== currentUserId;

  const url = readOnly ? `/api/dailytasks?userId=${viewingUserId}` : "/api/dailytasks";

  useEffect(() => {
    setLoading(true);
    apiFetch(url, {}, token)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [token, url]);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const text = newText.trim();
    const days = newDays.length > 0 ? newDays : ["mon","tue","wed","thu","fri"];
    setNewText("");
    setNewDays(["mon","tue","wed","thu","fri"]);
    setShowAddForm(false);
    const tempId = genId();
    setTasks((prev) => [...prev, { id: tempId, text, done: false, days }]);
    try {
      const res = await apiFetch("/api/dailytasks", { method: "POST", body: JSON.stringify({ text, days }) }, token);
      const saved = await res.json();
      setTasks((prev) => prev.map((t) => t.id === tempId ? saved : t));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const thisWeek = currentISOWeek();
  const isDoneThisWeek = (task) => task.done && task.doneWeek === thisWeek;

  const handleToggle = async (task) => {
    const nowDone = !isDoneThisWeek(task);
    const updated = { ...task, done: nowDone, doneWeek: nowDone ? thisWeek : null };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try {
      await apiFetch(`/api/dailytasks/${task.id}`, { method: "PUT", body: JSON.stringify({ done: nowDone, doneWeek: updated.doneWeek }) }, token);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    }
  };

  const handleDelete = async (id) => {
    const prev = tasks.find((t) => t.id === id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/dailytasks/${id}`, { method: "DELETE" }, token);
    } catch {
      if (prev) setTasks((ts) => [...ts, prev]);
    }
  };

  const handleEdit = async (id, text, days) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, text, days } : t));
    try {
      await apiFetch(`/api/dailytasks/${id}`, { method: "PUT", body: JSON.stringify({ text, days }) }, token);
    } catch {}
  };

  const toggleNewDay = (dayId) => {
    setNewDays((prev) => prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]);
  };

  const currentDayId = todayDayId();

  const filteredTasks = selectedDay === "all"
    ? tasks
    : tasks.filter((t) => {
        const d = t.days || ["mon","tue","wed","thu","fri"];
        return d.length === 0 || d.includes(selectedDay);
      });

  const selectedDayCfg = DAY_OPTIONS.find((d) => d.id === selectedDay);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={readOnly} />
      </div>

      {/* Day filter tabs — color-coded */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedDay("all")}
          style={{
            padding: "4px 12px", borderRadius: "20px",
            border: selectedDay === "all" ? "none" : `1px solid ${C.border}`,
            background: selectedDay === "all" ? C.accent : "transparent",
            color: selectedDay === "all" ? "#fff" : C.muted,
            fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.12s",
          }}
        >All</button>
        {DAY_OPTIONS.map((d) => {
          const isToday = d.id === currentDayId;
          const isActive = selectedDay === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              style={{
                padding: "4px 12px", borderRadius: "20px",
                border: `1px solid ${isActive || isToday ? d.color : C.border}`,
                background: isActive ? d.bg : isToday ? d.bg : "transparent",
                color: isActive || isToday ? d.color : C.muted,
                fontSize: "11px", fontWeight: isActive || isToday ? "700" : "600",
                cursor: "pointer", transition: "all 0.12s",
                boxShadow: isToday && !isActive ? `0 0 0 1.5px ${d.color}` : "none",
              }}
            >
              {d.label}{isToday ? " •" : ""}
            </button>
          );
        })}
      </div>

      {/* Section label when filtered */}
      {selectedDay !== "all" && selectedDayCfg && (
        <div style={{ fontSize: "11px", fontWeight: "700", color: selectedDayCfg.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selectedDayCfg.color }} />
          {selectedDayCfg.label} Routines — {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </div>
      )}

      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px", padding: "8px 0" }}>Loading…</div>
      ) : filteredTasks.length === 0 && readOnly ? (
        <EmptyState icon="🔄" message="No daily routines set up." />
      ) : filteredTasks.length === 0 ? (
        <div style={{ fontSize: "12px", color: C.muted, padding: "8px 4px" }}>No routines for this day.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {filteredTasks.map((t) => (
            <DailyTaskItem
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
              readOnly={readOnly}
              isDone={isDoneThisWeek(t)}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <div style={{ marginTop: "10px" }}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{ fontSize: "12px", color: C.muted, background: "none", border: `1px dashed ${C.border}`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", width: "100%" }}
            >
              + Add routine
            </button>
          ) : (
            <div style={{ background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, padding: "10px" }}>
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Add routine…"
                autoFocus
                style={{ ...textInput({ width: "100%", fontSize: "12px", padding: "6px 8px", marginBottom: "8px" }) }}
              />
              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Days</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {DAY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleNewDay(d.id)}
                      style={{
                        padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "700",
                        border: `1px solid ${newDays.includes(d.id) ? d.color : C.border}`,
                        background: newDays.includes(d.id) ? d.bg : "transparent",
                        color: newDays.includes(d.id) ? d.color : C.muted,
                        cursor: "pointer",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={handleAdd}
                  disabled={!newText.trim()}
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "none", background: newText.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newText.trim() ? "pointer" : "not-allowed" }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewText(""); setNewDays(["mon","tue","wed","thu","fri"]); }}
                  style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

const PROJECT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6"];
const PROJECT_STATUSES = [
  { id: "planning", label: "Planning",         color: "#94A3B8", bg: "rgba(148,163,184,0.10)" },
  { id: "draft",    label: "Draft",            color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  { id: "review",   label: "Ready for Review", color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  { id: "live",     label: "Live",             color: "#10B981", bg: "rgba(16,185,129,0.10)" },
];

function StatusPill({ status }) {
  const cfg = PROJECT_STATUSES.find((s) => s.id === status) || PROJECT_STATUSES[0];
  return (
    <span style={{
      padding: "2px 9px", borderRadius: "20px",
      background: cfg.bg, color: cfg.color,
      fontSize: "11px", fontWeight: "700",
    }}>
      {cfg.label}
    </span>
  );
}

function ProjectProgressBar({ tasks = [] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: C.muted }}>{done}/{total} tasks</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color: C.text }}>{pct}%</span>
      </div>
      <div style={{
        height: "6px", background: C.cardBg, borderRadius: "4px",
        overflow: "hidden", border: `1px solid ${C.border}`,
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: C.accent, borderRadius: "4px",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function NewProjectModal({ onSave, onClose, teamMembers = [] }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [details, setDetails] = useState("");
  const [link, setLink] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [status, setStatus] = useState("planning");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const toggleMember = (m) => {
    setSelectedMembers((prev) =>
      prev.find((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : [...prev, { id: m.id, name: m.name }]
    );
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: desc, details, link: link.trim(), color, status, members: selectedMembers });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "16px", padding: "24px", width: "440px", maxWidth: "90vw",
        zIndex: 2001, boxShadow: C.shadowMd,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: C.text }}>New TCF Community Project</h3>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Name *</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...textInput({ width: "100%" }) }} placeholder="Project name" />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit" }) }} placeholder="What's this project about?" />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>What We're Working On</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit" }) }} placeholder="Current focus, goals, what the team is actively doing…" />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Link (Google Drive / Resource URL)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://drive.google.com/…" />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Color</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {PROJECT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: color === c ? `3px solid ${C.text}` : `3px solid transparent`, cursor: "pointer", padding: 0, transition: "border-color 0.12s" }} />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...textInput({ width: "100%" }), color: C.text }}>
            {PROJECT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {teamMembers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Members</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {teamMembers.map((m) => {
                const selected = !!selectedMembers.find((x) => x.id === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m)}
                    style={{
                      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500",
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      background: selected ? C.accentLight : C.cardBg,
                      color: selected ? C.accent : C.muted,
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: name.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() ? "pointer" : "not-allowed" }}>
            Create Project
          </button>
        </div>
      </div>
    </>
  );
}

function MemberInitials({ name, size = 24 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:"700", flexShrink:0, border:`2px solid ${C.card}` }}>
      {ini}
    </div>
  );
}

function ProjectDetailModal({ project, token, teamMembers, onToggleTask, onAddTask, onDelete, onAddStatusUpdate, onSaveDetails, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [taskInput, setTaskInput] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [details, setDetails] = useState(project.details || "");
  const [editingDetails, setEditingDetails] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  const tasks = project.tasks || [];
  const members = project.members || [];
  const statusUpdates = project.statusUpdates || [];

  const submitTask = () => {
    if (!taskInput.trim()) return;
    onAddTask(project.id, taskInput.trim(), selectedAssignee);
    setTaskInput("");
    setSelectedAssignee(null);
  };

  const saveDetails = () => {
    setEditingDetails(false);
    onSaveDetails?.(project.id, details);
  };

  const handleCommentChange = (val) => {
    setCommentInput(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1).toLowerCase();
      setMentionSuggestions(teamMembers.filter((m) => m.name.toLowerCase().startsWith(query)));
    } else {
      setMentionSuggestions([]);
    }
  };

  const insertMention = (member) => {
    const atIdx = commentInput.lastIndexOf("@");
    setCommentInput(commentInput.slice(0, atIdx) + `@${member.name} `);
    setMentionSuggestions([]);
  };

  const submitComment = () => {
    if (!commentInput.trim()) return;
    onAddStatusUpdate(project.id, commentInput.trim());
    setCommentInput("");
    setMentionSuggestions([]);
  };

  const doneTasks = tasks.filter((t) => t.done).length;
  const pct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const cfg = PROJECT_STATUSES.find((s) => s.id === project.status) || PROJECT_STATUSES[0];

  const TABS = [
    { id: "overview", label: "📋 Overview" },
    { id: "tasks", label: `✅ Tasks (${tasks.length})` },
    { id: "comments", label: `💬 Comments (${statusUpdates.length})` },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderTop: `4px solid ${project.color || C.accent}`,
        borderRadius: "18px", width: "760px", maxWidth: "95vw",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        zIndex: 3001, boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: project.color || C.accent, flexShrink: 0 }} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>{project.name}</h2>
                <span style={{ padding: "2px 10px", borderRadius: "20px", background: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: "700" }}>{cfg.label}</span>
              </div>
              {project.description && (
                <p style={{ margin: "0 0 0 24px", fontSize: "13px", color: C.muted, lineHeight: "1.5" }}>{project.description}</p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              {project.link && (
                <a href={project.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: C.accent, textDecoration: "none", padding: "5px 12px", borderRadius: "20px", border: `1px solid ${C.accent}`, background: C.accentLight, fontWeight: "600" }}>
                  🔗 Open Resource
                </a>
              )}
              <button onClick={() => { onDelete(project.id); onClose(); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "13px", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>Delete</button>
              <button onClick={onClose} style={{ background: C.cardBg, border: `1px solid ${C.border}`, cursor: "pointer", color: C.muted, fontSize: "16px", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Members + progress */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {members.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ display: "flex" }}>
                  {members.slice(0, 6).map((m, i) => (
                    <div key={m.id} style={{ marginLeft: i > 0 ? "-8px" : 0 }} title={m.name}>
                      <MemberInitials name={m.name} size={26} />
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: C.muted }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {tasks.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
                <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: C.border, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: project.color || C.accent, borderRadius: "3px", transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: "11px", color: C.muted, flexShrink: 0 }}>{doneTasks}/{tasks.length} tasks ({pct}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "0 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: "600",
                color: activeTab === tab.id ? C.accent : C.muted,
                borderBottom: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`,
                marginBottom: "-1px", transition: "color 0.12s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>📌 What We're Working On</div>
                {editingDetails ? (
                  <div>
                    <textarea
                      autoFocus
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={5}
                      onBlur={saveDetails}
                      style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6", fontSize: "13px" }) }}
                      placeholder="Current focus, who is working on what, goals, blockers…"
                    />
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <button onClick={saveDetails} style={{ padding: "5px 14px", borderRadius: "6px", border: "none", background: project.color || C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Save</button>
                      <button onClick={() => { setEditingDetails(false); setDetails(project.details || ""); }} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDetails(true)}
                    title="Click to edit"
                    style={{ fontSize: "13px", color: details ? C.text : C.muted, lineHeight: "1.7", padding: "12px 14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer", minHeight: "60px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {details || <em>Click to describe what the team is currently working on…</em>}
                  </div>
                )}
              </div>

              {members.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>👥 Team Members</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {members.map((m) => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: C.cardBg, border: `1px solid ${C.border}` }}>
                        <MemberInitials name={m.name} size={20} />
                        <span style={{ fontSize: "12px", color: C.text, fontWeight: "500" }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {project.createdBy && (
                <div style={{ fontSize: "12px", color: C.muted }}>Created by <strong>{project.createdBy}</strong></div>
              )}
            </div>
          )}

          {/* Tasks tab */}
          {activeTab === "tasks" && (
            <div>
              {tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: C.muted, fontSize: "13px", background: C.cardBg, borderRadius: "10px", border: `1px dashed ${C.border}`, marginBottom: "14px" }}>
                  No tasks yet. Add the first one below.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                  {tasks.map((task) => (
                    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: task.done ? `${project.color || C.accent}08` : C.cardBg, borderRadius: "10px", border: `1px solid ${task.done ? `${project.color || C.accent}25` : C.border}`, transition: "all 0.15s" }}>
                      <button
                        onClick={() => onToggleTask(project.id, task)}
                        style={{
                          width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                          border: `2px solid ${task.done ? project.color || C.accent : C.border}`,
                          background: task.done ? (project.color || C.accent) : "transparent",
                          cursor: "pointer", padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {task.done && <span style={{ color: "#fff", fontSize: "11px" }}>✓</span>}
                      </button>
                      <span style={{ flex: 1, fontSize: "13px", color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                      {task.assignedTo && (
                        <div title={task.assignedTo.name || task.assignedTo}>
                          <MemberInitials name={task.assignedTo.name || task.assignedTo} size={22} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTask()}
                  placeholder="+ Add task…"
                  style={{ ...textInput({ flex: 1, fontSize: "13px" }) }}
                />
                {teamMembers.length > 0 && (
                  <select
                    value={selectedAssignee?.id || ""}
                    onChange={(e) => setSelectedAssignee(teamMembers.find((m) => m.id === e.target.value) || null)}
                    style={{ ...textInput({ maxWidth: "130px", fontSize: "12px", color: selectedAssignee ? C.text : C.muted }) }}
                  >
                    <option value="">Assign…</option>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                )}
                <button onClick={submitTask} disabled={!taskInput.trim()} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: taskInput.trim() ? (project.color || C.accent) : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: taskInput.trim() ? "pointer" : "not-allowed" }}>
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Comments tab */}
          {activeTab === "comments" && (
            <div>
              {statusUpdates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: C.muted, fontSize: "13px", background: C.cardBg, borderRadius: "10px", border: `1px dashed ${C.border}`, marginBottom: "14px" }}>
                  No comments yet. Add a status update below.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                  {statusUpdates.map((u, i) => (
                    <div key={u.id || i} style={{ padding: "10px 14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                        <MemberInitials name={u.authorName} size={22} />
                        <span style={{ fontSize: "12px", fontWeight: "700", color: C.accent }}>{u.authorName}</span>
                        <span style={{ fontSize: "10px", color: C.muted }}>{u.createdAt ? new Date(u.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}</span>
                      </div>
                      <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.5", paddingLeft: "30px" }}>
                        {u.text.split(/(@\w[\w\s]*)/g).map((part, j) =>
                          part.startsWith("@") ? <strong key={j} style={{ color: C.accent }}>{part}</strong> : part
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ position: "relative" }}>
                <textarea
                  value={commentInput}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  rows={3}
                  placeholder="Add a status update… (use @ to mention someone)"
                  style={{ ...textInput({ width: "100%", resize: "vertical", lineHeight: "1.5", fontSize: "13px" }) }}
                />
                {mentionSuggestions.length > 0 && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "180px", overflow: "hidden" }}>
                    {mentionSuggestions.map((m) => (
                      <button key={m.id} onMouseDown={(e) => { e.preventDefault(); insertMention(m); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: "13px", color: C.text, display: "flex", alignItems: "center", gap: "8px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <MemberInitials name={m.name} size={20} />
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button onClick={submitComment} disabled={!commentInput.trim()} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: commentInput.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: commentInput.trim() ? "pointer" : "not-allowed" }}>
                  Post Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProjectCard({ project, onToggleTask, onAddTask, onDelete, onAddStatusUpdate, onSaveDetails, teamMembers = [], onOpen }) {
  const [hov, setHov] = useState(false);
  const tasks = project.tasks || [];
  const members = project.members || [];
  const statusUpdates = project.statusUpdates || [];

  const doneTasks = tasks.filter((t) => t.done).length;
  const pct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${hov ? project.color || C.accent : C.border}`,
        borderLeft: `4px solid ${project.color || C.accent}`,
        borderRadius: "12px",
        padding: "16px",
        boxShadow: hov ? C.shadowMd : C.shadow,
        cursor: "pointer",
        transition: "all 0.15s",
        transform: hov ? "translateY(-1px)" : "none",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "5px" }}>{project.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <StatusPill status={project.status} />
            {tasks.length > 0 && (
              <span style={{ fontSize: "10px", color: C.muted, padding: "1px 6px", borderRadius: "10px", background: C.cardBg, border: `1px solid ${C.border}` }}>
                {doneTasks}/{tasks.length} tasks
              </span>
            )}
            {statusUpdates.length > 0 && (
              <span style={{ fontSize: "10px", color: C.muted }}>💬 {statusUpdates.length}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i > 0 ? "-8px" : 0 }} title={m.name}>
              <MemberInitials name={m.name} size={24} />
            </div>
          ))}
          {members.length > 4 && (
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.cardBg, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: C.muted, fontWeight: "700", marginLeft: "-8px" }}>
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "10px", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </div>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div>
          <div style={{ height: "4px", background: C.cardBg, borderRadius: "2px", overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ height: "100%", width: `${pct}%`, background: project.color || C.accent, borderRadius: "2px", transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Open hint */}
      <div style={{ marginTop: "10px", fontSize: "11px", color: hov ? C.accent : C.muted, fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", transition: "color 0.12s" }}>
        {hov ? "Click to open →" : "View details"}
      </div>
    </div>
  );
}

function ProjectsSection({ token, sectionTitle, onSaveTitle, teamMembers = [] }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/projects", {}, token)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (data) => {
    const tempId = genId();
    const optimistic = { id: tempId, ...data, tasks: [], statusUpdates: [] };
    setProjects((prev) => [...prev, optimistic]);
    setShowModal(false);
    try {
      const res = await apiFetch("/api/projects", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => p.id === tempId ? saved : p));
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
    }
  };

  const handleDelete = async (id) => {
    const old = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" }, token);
    } catch {
      if (old) setProjects((prev) => [...prev, old]);
    }
  };

  const handleAddTask = async (projectId, text, assignedTo = null) => {
    const tempId = genId();
    const newTask = { id: tempId, text, done: false, assignedTo };
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p));
    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ taskAction: "add", taskText: text, assignedTo }),
      }, token);
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => p.id === projectId ? saved : p));
    } catch {}
  };

  const handleSaveDetails = async (projectId, details) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, details } : p));
    try {
      await apiFetch(`/api/projects/${projectId}`, { method: "PUT", body: JSON.stringify({ details }) }, token);
    } catch {}
  };

  const handleToggleTask = async (projectId, task) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).map((t) => t.id === task.id ? { ...t, done: !t.done } : t) }
          : p
      )
    );
    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ taskAction: "toggle", taskId: task.id }),
      }, token);
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => p.id === projectId ? saved : p));
    } catch {}
  };

  const handleAddStatusUpdate = async (projectId, text) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`, { method: "PUT", body: JSON.stringify({ addStatusUpdate: text }) }, token);
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => p.id === projectId ? saved : p));
    } catch {}
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={false} />
        <AddBtn onClick={() => setShowModal(true)} label="+ New Project" />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px", color: C.muted, fontSize: "13px" }}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <EmptyState icon="📁" message="No projects yet. Create one to get started." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDelete={handleDelete}
              onAddStatusUpdate={handleAddStatusUpdate}
              onSaveDetails={handleSaveDetails}
              teamMembers={teamMembers}
              onOpen={() => setSelectedProjectId(p.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal onSave={handleCreate} onClose={() => setShowModal(false)} teamMembers={teamMembers} />
      )}

      {selectedProjectId && (() => {
        const proj = projects.find((p) => p.id === selectedProjectId);
        return proj ? (
          <ProjectDetailModal
            project={proj}
            token={token}
            teamMembers={teamMembers}
            onToggleTask={(pid, task) => { handleToggleTask(pid, task); setProjects((prev) => prev.map((p) => p.id === pid ? { ...p, tasks: (p.tasks || []).map((t) => t.id === task.id ? { ...t, done: !t.done } : t) } : p)); }}
            onAddTask={handleAddTask}
            onDelete={handleDelete}
            onAddStatusUpdate={(pid, text) => { handleAddStatusUpdate(pid, text); }}
            onSaveDetails={handleSaveDetails}
            onClose={() => setSelectedProjectId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────

function NoteCard({ note, onSave, onDelete, readOnly }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [saving, setSaving] = useState(false);
  const [hov, setHov] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(note.id, { title, content });
    setSaving(false);
    setEditing(false);
  };

  const handleBlur = () => {
    if (title !== note.title || content !== note.content) handleSave();
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov && !editing ? C.accent : C.border}`,
        borderRadius: "12px", padding: "14px",
        boxShadow: hov ? C.shadowMd : C.shadow,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {editing && !readOnly ? (
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleBlur} style={{ ...textInput({ width: "100%", marginBottom: "8px", fontWeight: "600" }) }} placeholder="Note title…" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} onBlur={handleBlur} rows={5} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }} placeholder="Write your note…" />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => { setTitle(note.title || ""); setContent(note.content || ""); setEditing(false); }} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div onClick={() => !readOnly && setEditing(true)} style={{ flex: 1, cursor: readOnly ? "default" : "pointer" }}>
              {note.title && <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{note.title}</div>}
              <div style={{ fontSize: "13px", color: C.muted, lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2, WebkitBoxOrient: "vertical" }}>
                {note.content || <em style={{ opacity: 0.5 }}>Empty note</em>}
              </div>
            </div>
            {!readOnly && (
              <button onClick={() => onDelete(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "14px", opacity: hov ? 0.7 : 0, transition: "opacity 0.12s", flexShrink: 0 }}>✕</button>
            )}
          </div>
          {note.content && note.content.length > 100 && (
            <button onClick={() => setExpanded((e) => !e)} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: "12px", fontWeight: "600", padding: "4px 0 0" }}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          {!readOnly && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "12px", opacity: hov ? 1 : 0, transition: "opacity 0.12s" }}>✏️ Edit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotesSection({ token, viewingUserId, currentUserId, sectionTitle, onSaveTitle }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const readOnly = viewingUserId !== currentUserId;

  const url = readOnly ? `/api/personalnotes?userId=${viewingUserId}` : "/api/personalnotes";

  useEffect(() => {
    setLoading(true);
    apiFetch(url, {}, token)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [token, url]);

  const handleNew = async () => {
    const tempId = genId();
    const optimistic = { id: tempId, title: "", content: "" };
    setNotes((prev) => [optimistic, ...prev]);
    try {
      const res = await apiFetch("/api/personalnotes", { method: "POST", body: JSON.stringify({ title: "", content: "" }) }, token);
      const saved = await res.json();
      setNotes((prev) => prev.map((n) => n.id === tempId ? saved : n));
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
  };

  const handleSave = async (id, data) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...data } : n));
    try {
      await apiFetch(`/api/personalnotes/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
    } catch {}
  };

  const handleDelete = async (id) => {
    const old = notes.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiFetch(`/api/personalnotes/${id}`, { method: "DELETE" }, token);
    } catch {
      if (old) setNotes((prev) => [...prev, old]);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={readOnly} />
        {!readOnly && <AddBtn onClick={handleNew} label="+ New Note" />}
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: "13px" }}>Loading notes…</div>
      ) : notes.length === 0 ? (
        <EmptyState icon="📝" message={readOnly ? "No notes yet." : "No notes yet. Create one to get started."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onSave={handleSave} onDelete={handleDelete} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LINKS ────────────────────────────────────────────────────────────────────

function AddLinkModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [emoji, setEmoji] = useState("🔗");
  const QUICK_EMOJIS = ["🔗", "📄", "🎨", "📊", "🗂", "📬", "🌐", "💬", "⚡", "🏷"];

  const submit = () => {
    if (!name.trim() || !url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;
    onSave({ name: name.trim(), url: finalUrl, emoji });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px", width: "360px", maxWidth: "90vw", zIndex: 2001, boxShadow: C.shadowMd }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: C.text }}>Add Link</h3>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Emoji</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {QUICK_EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} style={{ width: "32px", height: "32px", borderRadius: "8px", border: `2px solid ${emoji === e ? C.accent : C.border}`, background: emoji === e ? C.accentLight : C.cardBg, cursor: "pointer", fontSize: "16px", padding: 0 }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Name *</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="e.g. Brand Guide" />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>URL *</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...textInput({ width: "100%" }) }} placeholder="https://…" />
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim() || !url.trim()} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: name.trim() && url.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() && url.trim() ? "pointer" : "not-allowed" }}>Add Link</button>
        </div>
      </div>
    </>
  );
}

function LinkPill({ link, onDelete, readOnly }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "20px", border: `1px solid ${hov ? C.accent : C.border}`, background: hov ? C.accentLight : C.cardBg, color: hov ? C.accent : C.text, fontSize: "13px", fontWeight: "500", textDecoration: "none", transition: "all 0.15s", cursor: "pointer" }}>
        <span>{link.emoji || "🔗"}</span>
        {link.name}
      </a>
      {hov && !readOnly && (
        <button onClick={(e) => { e.preventDefault(); onDelete(link.id); }} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}>✕</button>
      )}
    </div>
  );
}

function LinksSection({ token, viewingUserId, currentUserId, sectionTitle, onSaveTitle }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const readOnly = viewingUserId !== currentUserId;

  const url = readOnly ? `/api/personallinks?userId=${viewingUserId}` : "/api/personallinks";

  useEffect(() => {
    setLoading(true);
    apiFetch(url, {}, token)
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, [token, url]);

  const handleAdd = async (data) => {
    const tempId = genId();
    const optimistic = { id: tempId, ...data };
    setLinks((prev) => [...prev, optimistic]);
    setShowModal(false);
    try {
      const res = await apiFetch("/api/personallinks", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setLinks((prev) => prev.map((l) => l.id === tempId ? saved : l));
    } catch {
      setLinks((prev) => prev.filter((l) => l.id !== tempId));
    }
  };

  const handleDelete = async (id) => {
    const old = links.find((l) => l.id === id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await apiFetch(`/api/personallinks/${id}`, { method: "DELETE" }, token);
    } catch {
      if (old) setLinks((prev) => [...prev, old]);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={readOnly} />
        {!readOnly && <AddBtn onClick={() => setShowModal(true)} label="+ Add Link" />}
      </div>
      {loading ? (
        <div style={{ fontSize: "13px", color: C.muted }}>Loading links…</div>
      ) : links.length === 0 ? (
        <EmptyState icon="🔗" message={readOnly ? "No links saved yet." : "No links saved yet. Add frequently used links."} />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {links.map((link) => <LinkPill key={link.id} link={link} onDelete={handleDelete} readOnly={readOnly} />)}
        </div>
      )}
      {showModal && !readOnly && <AddLinkModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ─── PROCESS/ROLE SECTION ─────────────────────────────────────────────────────

function ProcessRoleSection({ token, viewingUserId, currentUserId, sectionTitle, onSaveTitle, processRole, onProcessRoleSaved }) {
  const [text, setText] = useState(processRole || "");
  const [saving, setSaving] = useState(false);
  const readOnly = viewingUserId !== currentUserId;

  useEffect(() => { setText(processRole || ""); }, [processRole]);

  const save = async () => {
    if (text === (processRole || "")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ processRole: text }),
      });
      if (res.ok) {
        const data = await res.json();
        onProcessRoleSaved(data.processRole || "");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <EditableSectionTitle title={sectionTitle} onSave={onSaveTitle} readOnly={readOnly} />
        {saving && <span style={{ fontSize: "11px", color: C.muted }}>Saving…</span>}
      </div>
      {readOnly ? (
        text ? (
          <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", padding: "12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
            {text}
          </div>
        ) : (
          <EmptyState icon="📋" message="No process/role info yet." />
        )
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          rows={5}
          placeholder="Describe your process, role, and responsibilities…"
          style={{
            width: "100%", padding: "10px 12px",
            border: `1px solid ${C.border}`, borderRadius: "8px",
            background: C.inputBg, color: C.text,
            fontSize: "13px", outline: "none", resize: "vertical",
            fontFamily: "inherit", lineHeight: "1.6", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

// ─── ASSIGNED CONTENT SECTION ─────────────────────────────────────────────────

const PLATFORM_ICONS = {
  instagram: "📸", tiktok: "🎵", linkedin: "💼", x: "✖", facebook: "👥",
  youtube: "▶", pinterest: "📌", email: "📧", blog: "✍", podcast: "🎙",
};

const STATUS_COLORS = {
  draft: { color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  review: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  approved: { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  scheduled: { color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  published: { color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  paused: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

function AssignedContentSection({ assignedPosts = [], assignedAssets = [], assignedSlackChannels = [], sectionTitle, onOpenPost, onOpenAsset, onOpenSlack }) {
  const [activeSubTab, setActiveSubTab] = useState("posts");

  const hasAny = assignedPosts.length > 0 || assignedAssets.length > 0 || assignedSlackChannels.length > 0;

  const subTabs = [
    { id: "posts", label: "Posts", count: assignedPosts.length },
    { id: "assets", label: "Assets", count: assignedAssets.length },
    { id: "slack", label: "Slack", count: assignedSlackChannels.length },
  ];

  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", color: C.text }}>{sectionTitle}</h2>

      {/* Sub-tab pills */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            style={{
              padding: "4px 10px", borderRadius: "20px", border: "none",
              background: activeSubTab === t.id ? C.accentLight : C.cardBg,
              color: activeSubTab === t.id ? C.accentBright : C.muted,
              fontSize: "11px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}{t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {activeSubTab === "posts" && (
        assignedPosts.length === 0 ? (
          <EmptyState icon="📋" message="No posts assigned yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assignedPosts.map((post) => {
              const statusCfg = STATUS_COLORS[post.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={post.id}
                  onClick={() => onOpenPost?.(post)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: C.shadow, cursor: onOpenPost ? "pointer" : "default", transition: "border-color 0.12s" }}
                  onMouseEnter={(e) => { if (onOpenPost) e.currentTarget.style.borderColor = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.title || "Untitled"}
                    </div>
                    {post.scheduledDate && (
                      <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{formatDate(post.scheduledDate)}</div>
                    )}
                  </div>
                  {post.platforms && post.platforms.length > 0 && (
                    <div style={{ display: "flex", gap: "3px" }}>
                      {post.platforms.slice(0, 3).map((p) => (
                        <span key={p} title={p} style={{ fontSize: "14px" }}>{PLATFORM_ICONS[p] || "📄"}</span>
                      ))}
                    </div>
                  )}
                  <span style={{ padding: "2px 8px", borderRadius: "20px", background: statusCfg.bg, color: statusCfg.color, fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                    {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : "Draft"}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeSubTab === "assets" && (
        assignedAssets.length === 0 ? (
          <EmptyState icon="📦" message="No assets assigned yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assignedAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => onOpenAsset?.(asset)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: C.shadow, cursor: onOpenAsset ? "pointer" : "default", transition: "border-color 0.12s" }}
                onMouseEnter={(e) => { if (onOpenAsset) e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.name || "Untitled"}
                  </div>
                </div>
                {asset.type && (
                  <span style={{ padding: "2px 8px", borderRadius: "6px", background: C.cardBg, border: `1px solid ${C.border}`, fontSize: "11px", color: C.muted, flexShrink: 0 }}>
                    {asset.type}
                  </span>
                )}
                {asset.status && (
                  <span style={{ padding: "2px 8px", borderRadius: "20px", background: "rgba(99,102,241,0.12)", color: C.accent, fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                    {asset.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeSubTab === "slack" && (
        assignedSlackChannels.length === 0 ? (
          <EmptyState icon="💬" message="No Slack channels assigned yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assignedSlackChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => onOpenSlack?.(ch)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: C.shadow, cursor: onOpenSlack ? "pointer" : "default", transition: "border-color 0.12s" }}
                onMouseEnter={(e) => { if (onOpenSlack) e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{ch.emoji || "💬"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    #{ch.name}
                  </div>
                  {ch.description && (
                    <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.description}</div>
                  )}
                </div>
                {onOpenSlack && <span style={{ fontSize: "10px", color: C.accent, fontWeight: "600", flexShrink: 0 }}>Open →</span>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const DEFAULT_SECTION_TITLES = {
  dailyRoutines: "Daily Routines",
  tasks: "My Tasks",
  projects: "TCF Community Projects",
  notes: "My Notes",
  links: "My Links",
  processRole: "My Process & Role",
  assignedContent: "Assigned to Me",
};

// ─── Location + Event Tasks bar ───────────────────────────────────────────────

function LocationAndEventTasksBar({ token, userId, onNavigate }) {
  const [myLocation, setMyLocation] = useState(null);
  const [eventTasks, setEventTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [assignedTeamTasks, setAssignedTeamTasks] = useState([]);
  const [journeyStages, setJourneyStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      apiFetch("/api/locations", {}, token).then((r) => r.json()).catch(() => []),
      apiFetch("/api/events", {}, token).then((r) => r.json()).catch(() => []),
      apiFetch("/api/teamtasks", {}, token).then((r) => r.json()).catch(() => []),
      apiFetch("/api/memberjourney", {}, token).then((r) => r.json()).catch(() => null),
    ]).then(([locations, events, teamTasksData, journeyData]) => {
      // Find location user is responsible for
      const loc = Array.isArray(locations) ? locations.find((l) => l.responsibleMemberId === userId) : null;
      setMyLocation(loc || null);

      // Event checklist items assigned to this user
      const tasks = [];
      if (Array.isArray(events)) {
        events.forEach((ev) => {
          (ev.items || []).forEach((item) => {
            if (item.assignedTo?.id === userId || item.assignedTo === userId) {
              tasks.push({ ...item, eventTitle: ev.title, eventId: ev.id, eventColor: ev.color });
            }
          });
        });
      }
      setEventTasks(tasks);

      // Team tasks for user's location
      if (loc && Array.isArray(teamTasksData)) {
        const locTasks = teamTasksData.filter((t) =>
          (t.locations || []).includes(loc.name) && t.status !== "done"
        );
        setTeamTasks(locTasks);
      }

      // Team tasks directly assigned to this user (not done)
      if (Array.isArray(teamTasksData)) {
        const myAssigned = teamTasksData.filter((t) =>
          t.status !== "done" && (t.assignees || []).some((a) => a.id === userId)
        );
        setAssignedTeamTasks(myAssigned);
      }

      // Journey stages assigned to this user
      if (journeyData?.stages) {
        const myStages = journeyData.stages.filter((s) => (s.assignedMembers || []).some((m) => m.id === userId));
        setJourneyStages(myStages);
      }
    }).finally(() => setLoading(false));
  }, [token, userId]);

  const hasContent = myLocation || eventTasks.length > 0 || journeyStages.length > 0 || assignedTeamTasks.length > 0;
  if (loading || !hasContent) return null;

  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
      {/* My Location */}
      {myLocation && (
        <div style={{ flex: "1 1 280px", minWidth: "260px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "18px 20px", boxShadow: C.shadow }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>📍 My Location</div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            {myLocation.image && (
              <img src={myLocation.image} alt={myLocation.name} style={{ width: "64px", height: "52px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}`, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{myLocation.name}</div>
              {myLocation.address && <div style={{ fontSize: "11px", color: C.muted, marginBottom: "6px" }}>📍 {myLocation.address}</div>}
              {myLocation.details && <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{myLocation.details}</div>}
            </div>
          </div>
          {teamTasks.length > 0 && (
            <div style={{ marginTop: "12px", borderTop: `1px solid ${C.border}`, paddingTop: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: C.muted, marginBottom: "6px" }}>Open Tasks for this Location</div>
              {teamTasks.slice(0, 3).map((t) => (
                <div key={t.id} style={{ fontSize: "12px", color: C.text, padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
                  {t.text}
                </div>
              ))}
              {teamTasks.length > 3 && <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>+{teamTasks.length - 3} more</div>}
            </div>
          )}
        </div>
      )}

      {/* Event Tasks assigned to me */}
      {eventTasks.length > 0 && (
        <div style={{ flex: "1 1 280px", minWidth: "260px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "18px 20px", boxShadow: C.shadow }}>
          <div
            onClick={() => onNavigate && onNavigate("events")}
            style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px", cursor: onNavigate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>📅 My Event Tasks</span>
            {onNavigate && <span style={{ fontSize: "10px", color: C.accent, fontWeight: "600" }}>View all →</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {eventTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onNavigate && onNavigate("events")}
                style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 10px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, borderLeft: `3px solid ${task.eventColor || C.accent}`, cursor: onNavigate ? "pointer" : "default", transition: "background 0.12s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.hover}
                onMouseLeave={(e) => e.currentTarget.style.background = C.cardBg}
              >
                <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `2px solid ${task.done ? (task.eventColor || C.accent) : C.border}`, background: task.done ? (task.eventColor || C.accent) : "transparent", flexShrink: 0, marginTop: "1px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {task.done && <span style={{ color: "#fff", fontSize: "9px" }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>{task.text}</div>
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>📅 {task.eventTitle} {task.category && task.category !== "General" ? `· ${task.category}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Team Tasks */}
      {assignedTeamTasks.length > 0 && (
        <div style={{ flex: "1 1 280px", minWidth: "260px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "18px 20px", boxShadow: C.shadow }}>
          <div
            onClick={() => onNavigate && onNavigate("teamtasks")}
            style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px", cursor: onNavigate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>✅ My Assigned Tasks</span>
            {onNavigate && <span style={{ fontSize: "10px", color: C.accent, fontWeight: "600" }}>View all →</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {assignedTeamTasks.slice(0, 5).map((task) => {
              const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
              const priColors = { high: "#EF4444", medium: "#F59E0B", low: "#10B981", critical: "#7C3AED" };
              const borderColor = priColors[task.priority] || C.accent;
              return (
                <div
                  key={task.id}
                  onClick={() => onNavigate && onNavigate("teamtasks")}
                  style={{ padding: "8px 10px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColor}`, cursor: onNavigate ? "pointer" : "default" }}
                >
                  <div style={{ fontSize: "12px", color: C.text, fontWeight: "500", wordBreak: "break-word", marginBottom: "3px" }}>{task.text}</div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {task.dueDate && <span style={{ fontSize: "10px", color: isOverdue ? "#EF4444" : C.muted, fontWeight: isOverdue ? "700" : "400" }}>{isOverdue ? "⚠ " : ""}Due {task.dueDate}</span>}
                    {(task.locations || []).length > 0 && <span style={{ fontSize: "10px", color: C.muted }}>📍 {task.locations[0]}</span>}
                  </div>
                </div>
              );
            })}
            {assignedTeamTasks.length > 5 && <div style={{ fontSize: "11px", color: C.muted, textAlign: "center", marginTop: "2px" }}>+{assignedTeamTasks.length - 5} more</div>}
          </div>
        </div>
      )}

      {/* Member Journey stages I own */}
      {journeyStages.length > 0 && (
        <div style={{ flex: "1 1 280px", minWidth: "260px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "18px 20px", boxShadow: C.shadow }}>
          <div
            onClick={() => onNavigate && onNavigate("memberjourney")}
            style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px", cursor: onNavigate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>🗺️ My Journey Stages</span>
            {onNavigate && <span style={{ fontSize: "10px", color: C.accent, fontWeight: "600" }}>View all →</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {journeyStages.map((stage) => {
              const done = (stage.steps || []).filter((s) => s.done).length;
              const total = (stage.steps || []).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={stage.id}
                  onClick={() => onNavigate && onNavigate("memberjourney")}
                  style={{ padding: "10px 12px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${stage.color || C.accent}`, cursor: onNavigate ? "pointer" : "default", transition: "background 0.12s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = C.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = C.cardBg}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "16px" }}>{stage.icon}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>{stage.name}</div>
                      <div style={{ fontSize: "10px", color: C.muted }}>{stage.tagline}</div>
                    </div>
                  </div>
                  {total > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "10px", color: C.muted }}>Process</span>
                        <span style={{ fontSize: "10px", color: stage.color || C.accent, fontWeight: "700" }}>{done}/{total}</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "2px", background: C.border, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: stage.color || C.accent, borderRadius: "2px" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyDashboard({ currentUser, token, viewingUserId, teamMembers = [], assignedPosts = [], assignedAssets = [], assignedSlackChannels = [], onOpenPost, onOpenAsset, onOpenSlack, onNavigate }) {
  const currentUserId = currentUser?.id;
  const effectiveViewingUserId = viewingUserId || currentUserId;
  const readOnly = effectiveViewingUserId !== currentUserId;

  // Profile data (header image, processRole, sectionTitles)
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Bulletin board data (workspace announcements + shoutouts for this user)
  const [bulletinData, setBulletinData] = useState(null);
  useEffect(() => {
    apiFetch("/api/bulletin", {}, token)
      .then((r) => r.json())
      .then((d) => setBulletinData(d || {}))
      .catch(() => {});
  }, [token]);

  const ownerName = readOnly
    ? (teamMembers.find((m) => m.id === effectiveViewingUserId)?.name || "Member")
    : currentUser?.name || "My";

  const workspaceName = ownerName.endsWith("s") ? `${ownerName}' Workspace` : `${ownerName}'s Workspace`;

  useEffect(() => {
    setProfileLoading(true);
    const profileUrl = readOnly ? `/api/profile?userId=${effectiveViewingUserId}` : "/api/profile";
    fetch(profileUrl, { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((data) => setProfile(data || {}))
      .catch(() => setProfile({}))
      .finally(() => setProfileLoading(false));
  }, [token, effectiveViewingUserId, readOnly]);

  const sectionTitles = { ...DEFAULT_SECTION_TITLES, ...(profile?.sectionTitles || {}) };

  const saveSectionTitle = async (key, value) => {
    const updated = { ...sectionTitles, [key]: value };
    setProfile((p) => ({ ...p, sectionTitles: updated }));
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ sectionTitles: updated }),
      });
    } catch {}
  };

  const handleHeaderImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setProfile((p) => ({ ...p, headerImage: dataUrl }));
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-session": token },
          body: JSON.stringify({ headerImage: dataUrl }),
        });
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const processRole = profile?.processRole || "";
  const headerImage = profile?.headerImage || null;

  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const posXRef = useRef(50);
  const posYRef = useRef(50);

  useEffect(() => {
    if (profile) {
      const x = profile.headerImagePositionX ?? 50;
      const y = profile.headerImagePositionY ?? 50;
      setPosX(x);
      setPosY(y);
      posXRef.current = x;
      posYRef.current = y;
    }
  }, [profile]);

  const saveHeaderPosition = async (x, y) => {
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ headerImagePositionX: x, headerImagePositionY: y }),
      });
    } catch {}
  };

  return (
    <div style={{ padding: "0", minHeight: "100vh", background: C.bg }}>
      {/* Header banner */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <div style={{
          width: "100%", height: "200px",
          background: headerImage
            ? "transparent"
            : `linear-gradient(135deg, ${C.accent}22, #8B5CF622)`,
          borderRadius: "12px",
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "16px 20px",
        }}>
          {headerImage && (
            <img
              src={headerImage}
              alt="Header"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                objectPosition: `${posX}% ${posY}%`,
              }}
            />
          )}
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "8px", alignItems: "center" }}>
            {!headerImage && !readOnly && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.85)", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                + Upload Header Image
              </button>
            )}
            {headerImage && !readOnly && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid rgba(255,255,255,0.4)`, background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
              >
                ✏ Change
              </button>
            )}
          </div>
          {headerImage && !readOnly && (
            <div style={{
              position: "absolute", bottom: "8px", right: "12px", zIndex: 2,
              background: "rgba(0,0,0,0.5)", borderRadius: "10px",
              padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px",
              backdropFilter: "blur(4px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", fontWeight: "600", width: "16px" }}>↔</span>
                <input
                  type="range" min={0} max={100} value={posX}
                  onChange={(e) => { const v = Number(e.target.value); setPosX(v); posXRef.current = v; }}
                  onMouseUp={() => saveHeaderPosition(posXRef.current, posYRef.current)}
                  onTouchEnd={() => saveHeaderPosition(posXRef.current, posYRef.current)}
                  style={{ width: "80px", cursor: "pointer", accentColor: C.accent }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", fontWeight: "600", width: "16px" }}>↕</span>
                <input
                  type="range" min={0} max={100} value={posY}
                  onChange={(e) => { const v = Number(e.target.value); setPosY(v); posYRef.current = v; }}
                  onMouseUp={() => saveHeaderPosition(posXRef.current, posYRef.current)}
                  onTouchEnd={() => saveHeaderPosition(posXRef.current, posYRef.current)}
                  style={{ width: "80px", cursor: "pointer", accentColor: C.accent }}
                />
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleHeaderImageUpload} style={{ display: "none" }} />

        <div style={{ padding: "16px 4px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            {profile?.image ? (
              <img
                src={profile.image}
                alt={ownerName}
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.border}`, flexShrink: 0 }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: (() => { let h = 0; const n = ownerName; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"]; return cols[Math.abs(h) % cols.length]; })(),
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", fontWeight: "700", flexShrink: 0,
                border: `3px solid ${C.border}`,
              }}>
                {ownerName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
              </div>
            )}
            <div>
              <h1 style={{ margin: "0 0 2px", fontSize: "26px", fontWeight: "800", color: C.text }}>{workspaceName}</h1>
              {readOnly && (
                <p style={{ margin: 0, fontSize: "13px", color: C.muted }}>Read-only view</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Announcements */}
      {bulletinData && (() => {
        const now = Date.now();
        const workspaceAnnouncements = (bulletinData.posts || []).filter((p) => p.showOnWorkspace);
        // Shoutouts received by current page owner, all-time count + recent messages (< 7 days)
        const ownerShoutouts = (bulletinData.shoutouts || []).filter((s) => s.toId === effectiveViewingUserId);
        const starCount = ownerShoutouts.length;
        const recentShoutouts = ownerShoutouts.filter((s) => now - new Date(s.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000);
        const showShoutouts = starCount > 0;
        const showAnnouncements = workspaceAnnouncements.length > 0;
        if (!showAnnouncements && !showShoutouts) return null;
        return (
          <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {showAnnouncements && [...workspaceAnnouncements].sort((a, b) => (b.mustRead ? 1 : 0) - (a.mustRead ? 1 : 0)).map((post) => {
              const isMustRead = !!post.mustRead;
              return (
                <div
                  key={post.id}
                  onClick={() => onNavigate && onNavigate("bulletin")}
                  style={{
                    background: isMustRead ? "linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(251,146,60,0.05) 100%)" : C.card,
                    border: isMustRead ? "1.5px solid rgba(220,38,38,0.35)" : `1px solid ${C.border}`,
                    borderLeft: isMustRead ? "5px solid #DC2626" : `4px solid ${C.accent}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isMustRead ? "0 2px 10px rgba(220,38,38,0.1)" : C.shadow,
                    cursor: onNavigate ? "pointer" : "default",
                  }}
                >
                  {isMustRead && (
                    <div style={{ background: "linear-gradient(90deg, #DC2626, #EA580C)", padding: "6px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px" }}>🔥</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>Must Read</span>
                      <span style={{ fontSize: "13px" }}>🔥</span>
                    </div>
                  )}
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: isMustRead ? "#DC2626" : C.accent }}>📢 Announcement</span>
                      {post.pinned && <span style={{ fontSize: "11px", color: C.muted }}>📌 Pinned</span>}
                    </div>
                    {post.title && <div style={{ fontSize: isMustRead ? "15px" : "14px", fontWeight: "800", color: isMustRead ? "#DC2626" : C.text, marginBottom: "2px" }}>{post.title}</div>}
                    <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.content}</div>
                    <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>From {post.authorName}</div>
                  </div>
                </div>
              );
            })}
            {showShoutouts && (
              <div
                onClick={() => onNavigate && onNavigate("bulletin")}
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px", padding: "14px 18px", boxShadow: C.shadow, cursor: onNavigate ? "pointer" : "default" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: recentShoutouts.length > 0 ? "10px" : 0 }}>
                  <span style={{ fontSize: "18px" }}>⭐</span>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#F59E0B" }}>{starCount} shoutout{starCount !== 1 ? "s" : ""} received</span>
                </div>
                {recentShoutouts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {recentShoutouts.slice(0, 3).map((s) => (
                      <div key={s.id} style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", fontStyle: "italic", borderLeft: "2px solid rgba(245,158,11,0.4)", paddingLeft: "10px" }}>
                        "{s.message}" <span style={{ fontSize: "11px", color: C.muted, fontStyle: "normal" }}>— {s.fromName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── AI Daily Briefing ── */}
      <WorkspaceAISummary
        key={effectiveViewingUserId}
        token={token}
        currentUser={currentUser}
        viewingUserId={effectiveViewingUserId}
        ownerName={ownerName}
      />

      {/* Daily Routines — full width below header */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px 24px", boxShadow: C.shadow, marginBottom: "20px" }}>
        <DailyRoutinesSection
          token={token}
          viewingUserId={effectiveViewingUserId}
          currentUserId={currentUserId}
          sectionTitle={sectionTitles.dailyRoutines}
          onSaveTitle={(v) => saveSectionTitle("dailyRoutines", v)}
        />
      </div>

      {/* My Tasks — full width below Daily Routines */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px 24px", boxShadow: C.shadow, marginBottom: "20px" }}>
        <TasksColumn
          token={token}
          viewingUserId={effectiveViewingUserId}
          currentUserId={currentUserId}
          sectionTitle={sectionTitles.tasks}
          onSaveTitle={(v) => saveSectionTitle("tasks", v)}
        />
      </div>

      {/* My Location + Event Tasks */}
      <LocationAndEventTasksBar token={token} userId={effectiveViewingUserId} onNavigate={onNavigate} />

      {/* 2-column layout */}
      <div className="workspace-2col" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* LEFT column — Assigned to Me */}
        <div style={{
          width: "340px", flexShrink: 0,
          display: "flex", flexDirection: "column", gap: "16px",
        }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: C.shadow }}>
            <AssignedContentSection
              assignedPosts={assignedPosts}
              assignedAssets={assignedAssets}
              assignedSlackChannels={assignedSlackChannels}
              sectionTitle={sectionTitles.assignedContent}
              onOpenPost={onOpenPost}
              onOpenAsset={onOpenAsset}
              onOpenSlack={onOpenSlack}
            />
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Projects */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: C.shadow }}>
            <ProjectsSection
              token={token}
              sectionTitle={sectionTitles.projects}
              onSaveTitle={(v) => saveSectionTitle("projects", v)}
              teamMembers={teamMembers}
            />
          </div>

          {/* Notes */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: C.shadow }}>
            <NotesSection
              token={token}
              viewingUserId={effectiveViewingUserId}
              currentUserId={currentUserId}
              sectionTitle={sectionTitles.notes}
              onSaveTitle={(v) => saveSectionTitle("notes", v)}
            />
          </div>

          {/* Links */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: C.shadow }}>
            <LinksSection
              token={token}
              viewingUserId={effectiveViewingUserId}
              currentUserId={currentUserId}
              sectionTitle={sectionTitles.links}
              onSaveTitle={(v) => saveSectionTitle("links", v)}
            />
          </div>

          {/* Process/Role */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: C.shadow }}>
            <ProcessRoleSection
              token={token}
              viewingUserId={effectiveViewingUserId}
              currentUserId={currentUserId}
              sectionTitle={sectionTitles.processRole}
              onSaveTitle={(v) => saveSectionTitle("processRole", v)}
              processRole={processRole}
              onProcessRoleSaved={(v) => setProfile((p) => ({ ...p, processRole: v }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
