"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

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

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
      <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em" }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

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

// ─── TASKS ────────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete }) {
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
        onClick={() => onToggle(task)}
        style={{
          width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
          border: `2px solid ${task.done ? C.accent : C.border}`,
          background: task.done ? C.accent : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, transition: "all 0.12s", marginTop: "1px",
        }}
      >
        {task.done && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
      </button>

      {/* Text + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: "500",
          color: task.done ? C.muted : C.text,
          textDecoration: task.done ? "line-through" : "none",
          lineHeight: "1.4",
        }}>
          {task.text}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
          {task.priority && <PriorityPill priority={task.priority} />}
          {task.dueDate && (
            <span style={{
              fontSize: "11px",
              color: isOverdue(task.dueDate) && !task.done ? "#EF4444" : C.muted,
              fontWeight: isOverdue(task.dueDate) && !task.done ? "700" : "400",
            }}>
              {isOverdue(task.dueDate) && !task.done ? "⚠ " : ""}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      {hov && (
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
  const [focused, setFocused] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), priority, dueDate: dueDate || null });
    setText(""); setDueDate("");
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
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ ...textInput({ flex: "0 0 auto" }), color: C.text }}
        >
          {Object.entries(PRIORITY_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ ...textInput({ flex: 1, colorScheme: "light" }) }}
        />
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
    </div>
  );
}

function TasksColumn({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    apiFetch("/api/tasks", {}, token)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAdd = async (taskData) => {
    const tempId = genId();
    const optimistic = { id: tempId, ...taskData, done: false };
    setTasks((prev) => [...prev, optimistic]);
    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      }, token);
      const saved = await res.json();
      setTasks((prev) => prev.map((t) => t.id === tempId ? saved : t));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const handleToggle = async (task) => {
    const updated = { ...task, done: !task.done };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ done: updated.done }),
      }, token);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    }
  };

  const handleDelete = async (id) => {
    const prev = tasks.find((t) => t.id === id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" }, token);
    } catch {
      if (prev) setTasks((ts) => [...ts, prev]);
    }
  };

  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const todayOverdue = active.filter((t) => t.dueDate && (isToday(t.dueDate) || isOverdue(t.dueDate)));
  const upcoming = active.filter((t) => !t.dueDate || isUpcoming(t.dueDate));
  // tasks with no due date that are not overdue
  const noDue = active.filter((t) => !t.dueDate);

  return (
    <div style={{
      width: "340px", flexShrink: 0,
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: "16px", padding: "20px",
      boxShadow: C.shadow,
      display: "flex", flexDirection: "column",
      maxHeight: "calc(100vh - 100px)", overflowY: "auto",
    }}>
      <SectionHeader
        title="My Tasks"
        action={<AddBtn onClick={() => setShowForm((v) => !v)} label={showForm ? "✕ Cancel" : "+ Add Task"} />}
      />

      {showForm && <AddTaskForm onAdd={handleAdd} />}

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px", color: C.muted, fontSize: "13px" }}>
          Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" message="No tasks yet. Add your first task above." />
      ) : (
        <div style={{ flex: 1 }}>
          {todayOverdue.length > 0 && (
            <CollapsibleSection title="Today & Overdue" count={todayOverdue.length}>
              {todayOverdue.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </CollapsibleSection>
          )}
          {upcoming.length > 0 && (
            <CollapsibleSection title="Upcoming" count={upcoming.length + noDue.length}>
              {[...upcoming, ...noDue].map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </CollapsibleSection>
          )}
          {noDue.length > 0 && upcoming.length === 0 && todayOverdue.length === 0 && (
            <CollapsibleSection title="Tasks" count={noDue.length}>
              {noDue.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </CollapsibleSection>
          )}
          {done.length > 0 && (
            <CollapsibleSection title="Done" count={done.length} defaultOpen={false}>
              {done.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

const PROJECT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6"];
const PROJECT_STATUSES = [
  { id: "active",    label: "Active",    color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  { id: "paused",    label: "Paused",    color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  { id: "done",      label: "Done",      color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  { id: "planning",  label: "Planning",  color: "#94A3B8", bg: "rgba(148,163,184,0.10)" },
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

function NewProjectModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [status, setStatus] = useState("active");

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: desc, color, status });
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "16px", padding: "24px", width: "400px", maxWidth: "90vw",
        zIndex: 2001, boxShadow: C.shadowMd,
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: C.text }}>New Project</h3>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Name *
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ ...textInput({ width: "100%" }) }}
            placeholder="Project name"
          />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit" }) }}
            placeholder="What's this project about?"
          />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
            Color
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: c, border: color === c ? `3px solid ${C.text}` : `3px solid transparent`,
                  cursor: "pointer", padding: 0,
                  transition: "border-color 0.12s",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ ...textInput({ width: "100%" }), color: C.text }}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              padding: "9px 20px", borderRadius: "8px", border: "none",
              background: name.trim() ? C.accent : C.border, color: "#fff",
              fontSize: "13px", fontWeight: "600",
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </>
  );
}

function ProjectCard({ project, onToggleTask, onAddTask, onDelete }) {
  const [taskInput, setTaskInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  const tasks = project.tasks || [];

  const submitTask = () => {
    if (!taskInput.trim()) return;
    onAddTask(project.id, taskInput.trim());
    setTaskInput("");
  };

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${project.color || C.accent}`,
      borderRadius: "12px",
      padding: "16px",
      boxShadow: C.shadow,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>
            {project.name}
          </div>
          <StatusPill status={project.status} />
        </div>
        <button
          onClick={() => onDelete(project.id)}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "14px", padding: "2px 4px", opacity: 0.5, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      {project.description && (
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "10px", lineHeight: "1.4" }}>
          {project.description}
        </div>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <ProjectProgressBar tasks={tasks} />
        </div>
      )}

      {/* Task list toggle */}
      {tasks.length > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "12px", color: C.muted, fontWeight: "600",
            padding: "0 0 8px", display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          <span style={{ fontSize: "9px", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.12s" }}>▶</span>
          {expanded ? "Hide" : "Show"} tasks ({tasks.length})
        </button>
      )}

      {expanded && tasks.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0" }}
            >
              <button
                onClick={() => onToggleTask(project.id, task)}
                style={{
                  width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                  border: `2px solid ${task.done ? project.color || C.accent : C.border}`,
                  background: task.done ? (project.color || C.accent) : "transparent",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {task.done && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
              </button>
              <span style={{
                fontSize: "13px",
                color: task.done ? C.muted : C.text,
                textDecoration: task.done ? "line-through" : "none",
                flex: 1,
              }}>
                {task.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add task inline */}
      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
        <input
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitTask()}
          placeholder="+ Add task…"
          style={{ ...textInput({ flex: 1, fontSize: "12px", padding: "6px 8px" }) }}
        />
        {taskInput.trim() && (
          <button
            onClick={submitTask}
            style={{
              padding: "6px 10px", borderRadius: "6px", border: "none",
              background: project.color || C.accent, color: "#fff",
              fontSize: "12px", fontWeight: "600", cursor: "pointer", flexShrink: 0,
            }}
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectsSection({ token }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    apiFetch("/api/projects", {}, token)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (data) => {
    const tempId = genId();
    const optimistic = { id: tempId, ...data, tasks: [] };
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

  const handleAddTask = async (projectId, text) => {
    const newTask = { id: genId(), text, done: false };
    setProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p)
    );
    try {
      const project = projects.find((p) => p.id === projectId);
      const tasks = [...(project?.tasks || []), { text, done: false }];
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ tasks }),
      }, token);
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => p.id === projectId ? saved : p));
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
      const project = projects.find((p) => p.id === projectId);
      const tasks = (project?.tasks || []).map((t) =>
        t.id === task.id ? { ...t, done: !t.done } : t
      );
      await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ tasks }),
      }, token);
    } catch {}
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <SectionHeader
        title="My Projects"
        action={<AddBtn onClick={() => setShowModal(true)} label="+ New Project" />}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px", color: C.muted, fontSize: "13px" }}>
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon="📁" message="No projects yet. Create one to get started." />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
        }}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal onSave={handleCreate} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────

function NoteCard({ note, onSave, onDelete }) {
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
    if (title !== note.title || content !== note.content) {
      handleSave();
    }
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
      {editing ? (
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            style={{ ...textInput({ width: "100%", marginBottom: "8px", fontWeight: "600" }) }}
            placeholder="Note title…"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            rows={5}
            style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
            placeholder="Write your note…"
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setTitle(note.title || ""); setContent(note.content || ""); setEditing(false); }}
              style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div
              onClick={() => setEditing(true)}
              style={{ flex: 1, cursor: "pointer" }}
            >
              {note.title && (
                <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>
                  {note.title}
                </div>
              )}
              <div style={{
                fontSize: "13px", color: C.muted, lineHeight: "1.5",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: expanded ? "unset" : 2,
                WebkitBoxOrient: "vertical",
              }}>
                {note.content || <em style={{ opacity: 0.5 }}>Empty note</em>}
              </div>
            </div>
            <button
              onClick={() => onDelete(note.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "14px", opacity: hov ? 0.7 : 0, transition: "opacity 0.12s", flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          {note.content && note.content.length > 100 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: "12px", fontWeight: "600", padding: "4px 0 0" }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditing(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "12px", opacity: hov ? 1 : 0, transition: "opacity 0.12s" }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesSection({ token }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/personalnotes", {}, token)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleNew = async () => {
    const tempId = genId();
    const optimistic = { id: tempId, title: "", content: "" };
    setNotes((prev) => [optimistic, ...prev]);
    try {
      const res = await apiFetch("/api/personalnotes", {
        method: "POST",
        body: JSON.stringify({ title: "", content: "" }),
      }, token);
      const saved = await res.json();
      setNotes((prev) => prev.map((n) => n.id === tempId ? saved : n));
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
  };

  const handleSave = async (id, data) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...data } : n));
    try {
      await apiFetch(`/api/personalnotes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }, token);
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
      <SectionHeader
        title="Notes"
        action={<AddBtn onClick={handleNew} label="+ New Note" />}
      />
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: "13px" }}>
          Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon="📝" message="No notes yet. Create one to get started." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onSave={handleSave} onDelete={handleDelete} />
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
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", zIndex: 2000 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "16px", padding: "24px", width: "360px", maxWidth: "90vw",
        zIndex: 2001, boxShadow: C.shadowMd,
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: C.text }}>Add Link</h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Emoji</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: `2px solid ${emoji === e ? C.accent : C.border}`,
                  background: emoji === e ? C.accentLight : C.cardBg,
                  cursor: "pointer", fontSize: "16px", padding: 0,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Name *</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...textInput({ width: "100%" }) }}
            placeholder="e.g. Brand Guide"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>URL *</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ ...textInput({ width: "100%" }) }}
            placeholder="https://…"
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !url.trim()}
            style={{
              padding: "8px 18px", borderRadius: "8px", border: "none",
              background: name.trim() && url.trim() ? C.accent : C.border,
              color: "#fff", fontSize: "13px", fontWeight: "600",
              cursor: name.trim() && url.trim() ? "pointer" : "not-allowed",
            }}
          >
            Add Link
          </button>
        </div>
      </div>
    </>
  );
}

function LinkPill({ link, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 12px", borderRadius: "20px",
          border: `1px solid ${hov ? C.accent : C.border}`,
          background: hov ? C.accentLight : C.cardBg,
          color: hov ? C.accent : C.text,
          fontSize: "13px", fontWeight: "500",
          textDecoration: "none",
          transition: "all 0.15s",
          cursor: "pointer",
        }}
      >
        <span>{link.emoji || "🔗"}</span>
        {link.name}
      </a>
      {hov && (
        <button
          onClick={(e) => { e.preventDefault(); onDelete(link.id); }}
          style={{
            position: "absolute", top: "-6px", right: "-6px",
            width: "18px", height: "18px", borderRadius: "50%",
            background: "#EF4444", border: "2px solid #fff",
            color: "#fff", fontSize: "10px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function LinksSection({ token }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    apiFetch("/api/personallinks", {}, token)
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, [token]);

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
      <SectionHeader
        title="Quick Links"
        action={<AddBtn onClick={() => setShowModal(true)} label="+ Add Link" />}
      />

      {loading ? (
        <div style={{ fontSize: "13px", color: C.muted }}>Loading links…</div>
      ) : links.length === 0 ? (
        <EmptyState icon="🔗" message="No links saved yet. Add frequently used links." />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {links.map((link) => (
            <LinkPill key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <AddLinkModal onSave={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function MyDashboard({ currentUser, token }) {
  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: C.bg }}>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: C.text }}>
          My Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>
          Your personal workspace — tasks, projects, notes, and links
        </p>
      </div>

      {/* 2-column layout */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* LEFT: Tasks */}
        <TasksColumn token={token} />

        {/* RIGHT: Projects + Notes + Links */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0" }}>

          {/* Projects */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: "16px", padding: "20px",
            boxShadow: C.shadow, marginBottom: "16px",
          }}>
            <ProjectsSection token={token} />
          </div>

          {/* Notes */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: "16px", padding: "20px",
            boxShadow: C.shadow, marginBottom: "16px",
          }}>
            <NotesSection token={token} />
          </div>

          {/* Links */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: "16px", padding: "20px",
            boxShadow: C.shadow,
          }}>
            <LinksSection token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
