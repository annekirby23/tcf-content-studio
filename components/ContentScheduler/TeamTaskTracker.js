"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

// ─── helpers ────────────────────────────────────────────────────────────────
function genHex() {
  return Math.random().toString(16).slice(2, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === "done") return false;
  return new Date(dateStr) < new Date();
}

function avatarColor(name) {
  if (!name) return "#6366F1";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#6366F1","#10B981","#F59E0B","#EF4444","#3B82F6","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316"];
  return colors[Math.abs(hash) % colors.length];
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── constants ───────────────────────────────────────────────────────────────
const LOC_COLORS = { "321": "#10B981", "342": "#6366F1", "812": "#3B82F6" };
const LOC_BG    = { "321": "rgba(16,185,129,0.1)", "342": "rgba(99,102,241,0.1)", "812": "rgba(59,130,246,0.1)" };
const LOCATIONS  = ["321", "342", "812"];

const TASK_TYPES = ["Space Need", "Member Need", "General", "Maintenance", "Event"];
const TASK_TYPE_COLOR = {
  "Space Need":   { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "Member Need":  { color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
  "General":      { color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  "Maintenance":  { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "Event":        { color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
};

const PRIORITY_COLOR = {
  high:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  low:    { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

const STATUS_COLOR = {
  in_progress: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "In progress" },
  done:        { color: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Done" },
};

const EFFORT_LEVELS = ["Small", "Medium", "Large"];

const EMPTY_FORM = {
  text: "", locations: [], status: "in_progress", assignees: [],
  dueDate: "", priority: "medium", taskType: "General", description: "",
  effortLevel: "Medium", summary: "", attachFile: null,
};

// ─── sub-components ──────────────────────────────────────────────────────────
function LocationChip({ loc, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: LOC_BG[loc] || "rgba(0,0,0,0.06)",
      color: LOC_COLORS[loc] || C.muted,
      border: `1px solid ${LOC_COLORS[loc] || C.border}33`,
      borderRadius: 4, padding: small ? "1px 6px" : "2px 8px",
      fontSize: small ? 11 : 12, fontWeight: 600,
    }}>
      {loc}
    </span>
  );
}

function Pill({ label, color, bg, small }) {
  return (
    <span style={{
      display: "inline-block",
      background: bg || "rgba(0,0,0,0.07)",
      color: color || C.muted,
      borderRadius: 20, padding: small ? "1px 8px" : "2px 10px",
      fontSize: small ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Avatar({ name, size = 28 }) {
  const bg = avatarColor(name);
  return (
    <span title={name} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff", fontSize: size * 0.38, fontWeight: 700,
      flexShrink: 0,
    }}>
      {initials(name)}
    </span>
  );
}

function AssigneeCell({ assignees }) {
  if (!assignees || assignees.length === 0) return <span style={{ color: C.muted, fontSize: 13 }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {assignees.map((a) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Avatar name={a.name} size={24} />
          <span style={{ fontSize: 12, color: C.text }}>{a.name}</span>
        </div>
      ))}
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{
        appearance: "none", background: STATUS_COLOR[value]?.bg || C.accentLight,
        color: STATUS_COLOR[value]?.color || C.accent,
        border: "none", borderRadius: 20, padding: "2px 10px",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        outline: "none",
      }}
    >
      {Object.entries(STATUS_COLOR).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  );
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({ form, setForm, onSave, onCancel, saving, teamMembers, title }) {
  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.inputBg,
    color: C.text, fontSize: 14, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: 20, marginBottom: 16, boxShadow: C.shadowMd,
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Task Name */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Task Name *</label>
          <input style={inputStyle} value={form.text} placeholder="What needs to be done?"
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
        </div>

        {/* Locations */}
        <div>
          <label style={labelStyle}>Locations</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LOCATIONS.map((loc) => {
              const active = form.locations.includes(loc);
              return (
                <button key={loc} type="button" onClick={() => setForm((f) => ({
                  ...f,
                  locations: active ? f.locations.filter((l) => l !== loc) : [...f.locations, loc],
                }))} style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? LOC_BG[loc] : "transparent",
                  color: active ? LOC_COLORS[loc] : C.muted,
                  border: `1.5px solid ${active ? LOC_COLORS[loc] : C.border}`,
                }}>
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            style={{ ...inputStyle }}>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Assignees */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Assignees</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {teamMembers.map((m) => {
              const active = form.assignees.some((a) => a.id === m.id);
              return (
                <button key={m.id} type="button" onClick={() => setForm((f) => ({
                  ...f,
                  assignees: active
                    ? f.assignees.filter((a) => a.id !== m.id)
                    : [...f.assignees, { id: m.id, name: m.name }],
                }))} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? C.accentLight : "transparent",
                  color: active ? C.accent : C.muted,
                  border: `1.5px solid ${active ? C.accent : C.border}`,
                }}>
                  <Avatar name={m.name} size={18} />
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label style={labelStyle}>Due Date</label>
          <input type="date" style={inputStyle} value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>

        {/* Priority */}
        <div>
          <label style={labelStyle}>Priority</label>
          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            style={{ ...inputStyle }}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Task Type */}
        <div>
          <label style={labelStyle}>Task Type</label>
          <select value={form.taskType} onChange={(e) => setForm((f) => ({ ...f, taskType: e.target.value }))}
            style={{ ...inputStyle }}>
            {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Effort */}
        <div>
          <label style={labelStyle}>Effort Level</label>
          <select value={form.effortLevel} onChange={(e) => setForm((f) => ({ ...f, effortLevel: e.target.value }))}
            style={{ ...inputStyle }}>
            {EFFORT_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Summary</label>
          <input style={inputStyle} value={form.summary} placeholder="Short summary..."
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
        </div>

        {/* Description */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description}
            placeholder="Additional details..."
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: "transparent", color: C.muted, fontSize: 14, cursor: "pointer",
        }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={saving} style={{
          padding: "8px 20px", borderRadius: 8, border: "none",
          background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Saving…" : "Save Task"}
        </button>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ task, teamMembers, token, onSaved, onClose }) {
  const [form, setForm] = useState({
    text: task.text || "",
    locations: task.locations || [],
    status: task.status || "in_progress",
    assignees: task.assignees || [],
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    priority: task.priority || "medium",
    taskType: task.taskType || "General",
    description: task.description || "",
    effortLevel: task.effortLevel || "Medium",
    summary: task.summary || "",
    attachFile: task.attachFile || null,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/teamtasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.card, borderRadius: 16, padding: 24,
        width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={(e) => e.stopPropagation()}>
        <TaskForm
          form={form} setForm={setForm}
          onSave={handleSave} onCancel={onClose}
          saving={saving} teamMembers={teamMembers}
          title="Edit Task"
        />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function TeamTaskTracker({ token, currentUser, teamMembers = [] }) {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState("all");         // all | bystatus | mine
  const [locFilter, setLocFilter] = useState([]);            // [] = show all
  const [statusFilter, setStatusFilter] = useState("all");   // all | in_progress | done
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [hoverId, setHoverId]     = useState(null);
  const [isMobile, setIsMobile]   = useState(false);

  // ── responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetch("/api/teamtasks", {
          headers: { "x-session": token },
        });
        if (!res.ok) throw new Error("Failed to load tasks");
        setTasks(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [token]);

  // ── filter/group ──────────────────────────────────────────────────────────
  function matchesFilters(task) {
    if (locFilter.length > 0 && !locFilter.some((l) => task.locations?.includes(l))) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (tab === "mine" && !task.assignees?.some((a) => a.id === currentUser?.id)) return false;
    return true;
  }

  const filtered = tasks.filter(matchesFilters);

  // ── actions ───────────────────────────────────────────────────────────────
  async function handleAddTask() {
    if (!addForm.text.trim()) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/teamtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setAddSaving(false);
    }
  }

  async function handleStatusChange(task, newStatus) {
    const updated = { ...task, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    try {
      await fetch(`/api/teamtasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/teamtasks/${id}`, {
        method: "DELETE",
        headers: { "x-session": token },
      });
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  }

  function handleSaved(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  // ── styles ────────────────────────────────────────────────────────────────
  const thStyle = {
    textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700,
    color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
    background: C.cardBg,
  };
  const tdStyle = {
    padding: "10px 12px", fontSize: 13, color: C.text,
    borderBottom: `1px solid ${C.border}`, verticalAlign: "top",
  };

  // ── render helpers ────────────────────────────────────────────────────────
  function renderRow(task) {
    const overdue = isOverdue(task.dueDate, task.status);
    const ttc = TASK_TYPE_COLOR[task.taskType] || TASK_TYPE_COLOR["General"];
    const pc  = PRIORITY_COLOR[task.priority]  || PRIORITY_COLOR["medium"];
    const isHov = hoverId === task.id;

    return (
      <tr key={task.id}
        onMouseEnter={() => setHoverId(task.id)}
        onMouseLeave={() => setHoverId(null)}
        onClick={() => setEditTask(task)}
        style={{
          cursor: "pointer",
          background: isHov ? C.hover : "transparent",
          transition: "background 0.1s",
        }}
      >
        {/* Task name */}
        <td style={{ ...tdStyle, minWidth: 160, maxWidth: 220 }}>
          <div style={{ fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{task.text}</div>
          {task.summary && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{task.summary}</div>}
        </td>

        {/* Location */}
        <td style={tdStyle}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(task.locations || []).map((loc) => <LocationChip key={loc} loc={loc} small />)}
          </div>
        </td>

        {/* Status */}
        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
          <StatusSelect value={task.status} onChange={(v) => handleStatusChange(task, v)} />
        </td>

        {/* Assignee */}
        <td style={{ ...tdStyle, minWidth: 120 }}>
          <AssigneeCell assignees={task.assignees} />
        </td>

        {/* Due date */}
        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
          <span style={{ color: overdue ? "#EF4444" : C.text }}>{formatDate(task.dueDate)}</span>
        </td>

        {/* Priority */}
        <td style={tdStyle}>
          <Pill label={task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} color={pc.color} bg={pc.bg} small />
        </td>

        {/* Task type */}
        <td style={tdStyle}>
          <Pill label={task.taskType || "—"} color={ttc.color} bg={ttc.bg} small />
        </td>

        {/* Description */}
        <td style={{ ...tdStyle, maxWidth: 200 }}>
          <div style={{ fontSize: 12, color: C.muted, maxHeight: 60, overflow: "hidden", lineHeight: 1.4 }}>
            {task.description || "—"}
          </div>
        </td>

        {/* Past due */}
        <td style={tdStyle}>
          {overdue && (
            <span style={{
              background: "rgba(239,68,68,0.12)", color: "#EF4444",
              borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>Past Due</span>
          )}
        </td>

        {/* Effort */}
        <td style={tdStyle}>
          <Pill label={task.effortLevel || "—"} color={C.muted} bg={C.hover} small />
        </td>

        {/* Actions */}
        <td style={{ ...tdStyle, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", gap: 6, opacity: isHov ? 1 : 0, transition: "opacity 0.15s" }}>
            <button onClick={() => setEditTask(task)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              background: C.accentLight, color: C.accent, border: "none", fontWeight: 600,
            }}>Edit</button>
            <button onClick={() => handleDelete(task.id)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "none", fontWeight: 600,
            }}>Del</button>
          </div>
        </td>
      </tr>
    );
  }

  function renderMobileCard(task) {
    const overdue = isOverdue(task.dueDate, task.status);
    const pc = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR["medium"];
    const sc = STATUS_COLOR[task.status] || STATUS_COLOR["in_progress"];

    return (
      <div key={task.id} onClick={() => setEditTask(task)} style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 14, marginBottom: 10, cursor: "pointer",
        boxShadow: C.shadow, transition: "box-shadow 0.15s",
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>{task.text}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {(task.locations || []).map((loc) => <LocationChip key={loc} loc={loc} small />)}
          <Pill label={sc.label} color={sc.color} bg={sc.bg} small />
          <Pill label={task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} color={pc.color} bg={pc.bg} small />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <AssigneeCell assignees={task.assignees} />
          {task.dueDate && (
            <span style={{ fontSize: 12, color: overdue ? "#EF4444" : C.muted, marginLeft: "auto" }}>
              Due {formatDate(task.dueDate)}{overdue && " ⚠"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} style={{
            padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
            background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "none", fontWeight: 600,
          }}>Delete</button>
        </div>
      </div>
    );
  }

  function renderGrouped() {
    const groups = {
      in_progress: filtered.filter((t) => t.status === "in_progress"),
      done:        filtered.filter((t) => t.status === "done"),
    };
    return Object.entries(groups).map(([status, rows]) => {
      if (rows.length === 0) return null;
      const sc = STATUS_COLOR[status];
      return (
        <tbody key={status}>
          <tr>
            <td colSpan={11} style={{
              background: sc.bg, padding: "8px 12px",
              fontWeight: 700, fontSize: 12, color: sc.color,
              textTransform: "uppercase", letterSpacing: "0.05em",
              borderBottom: `1px solid ${C.border}`,
            }}>
              {sc.label} ({rows.length})
            </td>
          </tr>
          {rows.map(renderRow)}
        </tbody>
      );
    });
  }

  // ── tab/filter UI ─────────────────────────────────────────────────────────
  const tabPills = [
    { key: "all",      label: "☰ All Tasks" },
    { key: "bystatus", label: "≡ By Status" },
    { key: "mine",     label: "★ My Tasks" },
  ];

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>TCF Team Task Tracker</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
          General Tasks, any team member can tackle. Need help? Ask the team.
        </div>
      </div>

      {/* Filter row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16,
      }}>
        {/* Tab pills */}
        <div style={{ display: "flex", gap: 4, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
          {tabPills.map((p) => (
            <button key={p.key} onClick={() => setTab(p.key)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: tab === p.key ? C.accent : "transparent",
              color: tab === p.key ? "#fff" : C.muted,
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Location chips */}
        <div style={{ display: "flex", gap: 6 }}>
          {LOCATIONS.map((loc) => {
            const active = locFilter.includes(loc);
            return (
              <button key={loc} onClick={() => setLocFilter((prev) =>
                active ? prev.filter((l) => l !== loc) : [...prev, loc]
              )} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s",
                background: active ? LOC_BG[loc] : "transparent",
                color: active ? LOC_COLORS[loc] : C.muted,
                border: `1.5px solid ${active ? LOC_COLORS[loc] : C.border}`,
              }}>
                {loc}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{
          padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.inputBg, color: C.text, fontSize: 13, cursor: "pointer",
        }}>
          <option value="all">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setShowAddForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}>
            + New Task
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <TaskForm
          form={addForm} setForm={setAddForm}
          onSave={handleAddTask} onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
          saving={addSaving} teamMembers={teamMembers}
          title="Add New Task"
        />
      )}

      {/* Loading / error */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading tasks…</div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: 20, color: "#EF4444" }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Desktop table */}
          {!isMobile ? (
            <div style={{
              background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
              overflow: "hidden", boxShadow: C.shadow,
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Task name","Location","Status","Assignee","Due date","Priority","Task type","Description","Past due","Effort","Actions"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  {tab === "bystatus"
                    ? renderGrouped()
                    : <tbody>{filtered.map(renderRow)}</tbody>
                  }
                </table>
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No tasks found</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Add your first task with the button above.</div>
                </div>
              )}
            </div>
          ) : (
            /* Mobile cards */
            <div>
              {tab === "bystatus"
                ? Object.entries({
                    in_progress: filtered.filter((t) => t.status === "in_progress"),
                    done:        filtered.filter((t) => t.status === "done"),
                  }).map(([status, rows]) => {
                    if (!rows.length) return null;
                    const sc = STATUS_COLOR[status];
                    return (
                      <div key={status}>
                        <div style={{
                          fontWeight: 700, fontSize: 12, color: sc.color,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          marginBottom: 8, marginTop: 8,
                        }}>
                          {sc.label} ({rows.length})
                        </div>
                        {rows.map(renderMobileCard)}
                      </div>
                    );
                  })
                : filtered.map(renderMobileCard)
              }

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No tasks found</div>
                </div>
              )}
            </div>
          )}

          {/* New task row hint */}
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={{
              width: "100%", marginTop: 8, padding: "10px 12px",
              background: "transparent", border: `1px dashed ${C.border}`,
              borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer",
              textAlign: "left", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              + Add a task…
            </button>
          )}
        </>
      )}

      {/* Edit modal */}
      {editTask && (
        <EditModal
          task={editTask}
          teamMembers={teamMembers}
          token={token}
          onSaved={handleSaved}
          onClose={() => setEditTask(null)}
        />
      )}
    </div>
  );
}
