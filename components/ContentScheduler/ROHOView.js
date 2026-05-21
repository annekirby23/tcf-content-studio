"use client";

import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";

const ROHO_ACCENT = "#EC4899";
const ROHO_LIGHT  = "rgba(236,72,153,0.10)";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function localDateStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function fmtDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return new Date(Number(y), Number(m)-1, Number(day)).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function textInput(extra = {}) {
  return {
    padding:"9px 11px", border:`1px solid ${C.border}`, borderRadius:"8px",
    background:C.inputBg, color:C.text, fontSize:"13px", outline:"none",
    boxSizing:"border-box", fontFamily:"inherit", ...extra,
  };
}

const labelStyle = {
  display:"block", fontSize:"10px", fontWeight:"700", color:C.muted,
  textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"5px",
};

const PRIORITY_COLORS = { high:"#EF4444", medium:"#F59E0B", low:"#10B981" };
const STATUS_COLORS   = { open:"#6366F1", "in-progress":"#F59E0B", done:"#10B981" };
const STATUS_LABELS   = { open:"Open", "in-progress":"In Progress", done:"Done" };

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 30 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i=0;i<(name||"").length;i++) h=(name||"").charCodeAt(i)+((h<<5)-h);
  const bg = cols[Math.abs(h)%cols.length];
  const ini = (name||"?").split(" ").map((w)=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:"#fff",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:"700", flexShrink:0 }}>
      {ini}
    </div>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, color = C.accent, bg }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 10px",
      borderRadius:"20px", fontSize:"11px", fontWeight:"700",
      background: bg || `${color}18`, color }}>
      {label}
    </span>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ icon, title, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"20px" }}>{icon}</span>
        <h3 style={{ margin:0, fontSize:"16px", fontWeight:"800", color:C.text }}>{title}</h3>
      </div>
      {right}
    </div>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"14px",
      padding:"22px", boxShadow:C.shadow, ...style }}>
      {children}
    </div>
  );
}

// ── About ROHO ────────────────────────────────────────────────────────────────
function AboutSection({ about, isAdmin, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(about || "");
  useEffect(() => { setDraft(about || ""); }, [about]);

  return (
    <Card>
      <SectionHead
        icon="🎉"
        title="About ROHO"
        right={!editing && (
          <button onClick={() => setEditing(true)}
            style={{ padding:"6px 12px", borderRadius:"8px", border:`1px solid ${C.border}`,
              background:"none", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>
            ✏️ Edit
          </button>
        )}
      />
      {editing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10}
            autoFocus
            style={{ ...textInput({ width:"100%", resize:"vertical", lineHeight:"1.75" }) }}
            placeholder={"What is ROHO? Why does it exist? What are its goals?\n\nAdd as much context as you like — paragraphs, bullet lists (start lines with • or -), headers, etc."}
          />
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", marginTop:"12px" }}>
            <button onClick={() => { setDraft(about||""); setEditing(false); }}
              style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${C.border}`,
                background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={() => { onSave(draft); setEditing(false); }}
              style={{ padding:"8px 20px", borderRadius:"8px", border:"none",
                background:ROHO_ACCENT, color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
              Save
            </button>
          </div>
        </div>
      ) : about ? (
        <p style={{ margin:0, fontSize:"13px", color:C.text, lineHeight:"1.85", whiteSpace:"pre-wrap" }}>{about}</p>
      ) : (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>
          Click Edit to describe ROHO — its mission, goals, and why it matters.
        </p>
      )}
    </Card>
  );
}

// ── ROHO Team ─────────────────────────────────────────────────────────────────
function TeamSection({ teamMembers, allTeamMembers, isAdmin, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selUserId, setSelUserId] = useState("");
  const [selRole, setSelRole] = useState("");

  const existingIds = teamMembers.map((m) => m.userId);
  const available = allTeamMembers.filter((m) => !existingIds.includes(m.id));

  function addMember() {
    const member = allTeamMembers.find((m) => m.id === selUserId);
    if (!member) return;
    const next = [...teamMembers, { id: genId(), userId: member.id, name: member.name, role: selRole.trim() }];
    onUpdate(next);
    setShowAdd(false); setSelUserId(""); setSelRole("");
  }

  function removeMember(id) {
    onUpdate(teamMembers.filter((m) => m.id !== id));
  }

  function updateRole(id, role) {
    onUpdate(teamMembers.map((m) => m.id === id ? { ...m, role } : m));
  }

  return (
    <Card>
      <SectionHead
        icon="👥"
        title="ROHO Team"
        right={isAdmin && (
          <button onClick={() => setShowAdd((v) => !v)}
            style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${ROHO_ACCENT}`,
              background:showAdd ? ROHO_ACCENT : "none", color:showAdd ? "#fff" : ROHO_ACCENT,
              fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            {showAdd ? "✕ Cancel" : "+ Add Member"}
          </button>
        )}
      />

      {showAdd && (
        <div style={{ background:C.cardBg, borderRadius:"10px", padding:"14px", border:`1px solid ${C.border}`,
          marginBottom:"16px", display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div style={{ flex:1, minWidth:"160px" }}>
            <label style={labelStyle}>Team Member</label>
            <select value={selUserId} onChange={(e) => setSelUserId(e.target.value)} style={textInput({ width:"100%" })}>
              <option value="">— Select —</option>
              {available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:"140px" }}>
            <label style={labelStyle}>Role / Title (optional)</label>
            <input value={selRole} onChange={(e) => setSelRole(e.target.value)}
              style={textInput({ width:"100%" })} placeholder="e.g. Club Lead" />
          </div>
          <button onClick={addMember} disabled={!selUserId}
            style={{ padding:"9px 18px", borderRadius:"8px", border:"none",
              background:selUserId ? ROHO_ACCENT : C.border, color:"#fff",
              fontSize:"13px", fontWeight:"700", cursor:selUserId ? "pointer" : "not-allowed" }}>
            Add
          </button>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>
          {isAdmin ? "No team members yet. Click \"+ Add Member\" to build the ROHO team." : "No team members assigned."}
        </p>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"10px" }}>
          {teamMembers.map((m) => (
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:"10px",
              padding:"12px 14px", background:C.cardBg, borderRadius:"12px",
              border:`1px solid ${C.border}`, position:"relative" }}>
              <Avatar name={m.name} size={36} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"13px", fontWeight:"700", color:C.text, marginBottom:"2px" }}>{m.name}</div>
                {isAdmin ? (
                  <input value={m.role || ""} onChange={(e) => updateRole(m.id, e.target.value)}
                    onBlur={() => onUpdate([...teamMembers])}
                    style={{ ...textInput({ fontSize:"11px", padding:"2px 6px", width:"100%" }), color:C.muted }}
                    placeholder="Role…" />
                ) : (
                  m.role && <div style={{ fontSize:"11px", color:C.muted }}>{m.role}</div>
                )}
              </div>
              {isAdmin && (
                <button onClick={() => removeMember(m.id)}
                  style={{ position:"absolute", top:"6px", right:"6px", background:"none", border:"none",
                    color:C.muted, cursor:"pointer", fontSize:"12px", lineHeight:1, padding:"2px 4px",
                    borderRadius:"4px" }} title="Remove">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function TasksSection({ tasks, teamMembers, rohoTeam, isAdmin, currentUser, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const assigneeOptions = rohoTeam.length > 0 ? rohoTeam : teamMembers;

  function addTask() {
    if (!text.trim()) return;
    const member = assigneeOptions.find((m) => (m.userId || m.id) === assigneeId);
    const next = [...tasks, {
      id: genId(), text: text.trim(),
      assigneeId, assigneeName: member ? member.name : "",
      dueDate, priority, done: false, createdAt: new Date().toISOString(),
    }];
    onUpdate(next);
    setText(""); setAssigneeId(""); setDueDate(""); setPriority("medium"); setShowForm(false);
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({ text: t.text, assigneeId: t.assigneeId || "", dueDate: t.dueDate || "", priority: t.priority || "medium" });
    setShowForm(false);
  }

  function saveEdit(id) {
    const member = assigneeOptions.find((m) => (m.userId || m.id) === editForm.assigneeId);
    onUpdate(tasks.map((t) => t.id === id ? {
      ...t, text: editForm.text, assigneeId: editForm.assigneeId,
      assigneeName: member ? member.name : t.assigneeName,
      dueDate: editForm.dueDate, priority: editForm.priority,
    } : t));
    setEditingId(null);
  }

  function toggleDone(id) {
    onUpdate(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    onUpdate(tasks.filter((t) => t.id !== id));
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <Card>
      <SectionHead
        icon="✅"
        title="ROHO Tasks"
        right={!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${ROHO_ACCENT}`,
              background:"none", color:ROHO_ACCENT, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            + Add Task
          </button>
        )}
      />

      {showForm && (
        <div style={{ background:C.cardBg, borderRadius:"10px", padding:"14px", border:`1px solid ${C.border}`,
          marginBottom:"16px", display:"flex", flexDirection:"column", gap:"10px" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} autoFocus
            style={textInput({ width:"100%" })} placeholder="Task description…" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            <div>
              <label style={labelStyle}>Assign To</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={textInput({ width:"100%" })}>
                <option value="">Unassigned</option>
                {assigneeOptions.map((m) => <option key={m.userId||m.id} value={m.userId||m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={textInput({ width:"100%" })} />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={textInput({ width:"100%" })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"7px 14px", borderRadius:"8px", border:`1px solid ${C.border}`,
                background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={addTask} disabled={!text.trim()}
              style={{ padding:"7px 18px", borderRadius:"8px", border:"none",
                background:text.trim() ? ROHO_ACCENT : C.border, color:"#fff",
                fontSize:"13px", fontWeight:"700", cursor:text.trim() ? "pointer" : "not-allowed" }}>
              Add Task
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>No tasks yet.</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {open.map((t) => (
            <div key={t.id} style={{ background:C.cardBg, borderRadius:"10px", border:`1px solid ${editingId === t.id ? ROHO_ACCENT : C.border}`, borderLeft:`3px solid ${PRIORITY_COLORS[t.priority] || C.border}`, overflow:"hidden" }}>
              {editingId === t.id ? (
                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:"10px" }}>
                  <input value={editForm.text} onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))} autoFocus
                    style={textInput({ width:"100%" })} placeholder="Task description…" />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
                    <div>
                      <label style={labelStyle}>Assign To</label>
                      <select value={editForm.assigneeId} onChange={(e) => setEditForm((f) => ({ ...f, assigneeId: e.target.value }))} style={textInput({ width:"100%" })}>
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((m) => <option key={m.userId||m.id} value={m.userId||m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Due Date</label>
                      <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} style={textInput({ width:"100%" })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))} style={textInput({ width:"100%" })}>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                    <button onClick={() => setEditingId(null)} style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
                    <button onClick={() => saveEdit(t.id)} disabled={!editForm.text?.trim()} style={{ padding:"6px 16px", borderRadius:"8px", border:"none", background:ROHO_ACCENT, color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", opacity:editForm.text?.trim() ? 1 : 0.5 }}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"11px 14px" }}>
                  <input type="checkbox" checked={false} onChange={() => toggleDone(t.id)}
                    style={{ accentColor:ROHO_ACCENT, width:"15px", height:"15px", marginTop:"2px", flexShrink:0, cursor:"pointer" }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"13px", color:C.text, lineHeight:"1.5" }}>{t.text}</div>
                    <div style={{ display:"flex", gap:"8px", marginTop:"5px", flexWrap:"wrap", alignItems:"center" }}>
                      {t.assigneeName && (
                        <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                          <Avatar name={t.assigneeName} size={16} />
                          <span style={{ fontSize:"11px", color:C.muted, fontWeight:"600" }}>{t.assigneeName}</span>
                        </div>
                      )}
                      {t.dueDate && (
                        <span style={{ fontSize:"11px", color:t.dueDate < localDateStr() ? "#EF4444" : C.muted }}>
                          📅 {fmtDate(t.dueDate)}
                        </span>
                      )}
                      <Chip label={t.priority} color={PRIORITY_COLORS[t.priority]} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"4px", flexShrink:0 }}>
                    <button onClick={() => startEdit(t)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"13px", padding:"2px 6px" }}>✏️</button>
                    <button onClick={() => deleteTask(t.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"13px", padding:"2px 4px" }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {done.length > 0 && (
            <details style={{ marginTop:"8px" }}>
              <summary style={{ fontSize:"12px", color:C.muted, fontWeight:"600", cursor:"pointer", padding:"4px 0" }}>
                {done.length} completed task{done.length !== 1 ? "s" : ""}
              </summary>
              <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginTop:"8px" }}>
                {done.map((t) => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"10px",
                    padding:"9px 14px", background:C.cardBg, borderRadius:"10px",
                    border:`1px solid ${C.border}`, opacity:0.6 }}>
                    <input type="checkbox" checked onChange={() => toggleDone(t.id)}
                      style={{ accentColor:ROHO_ACCENT, width:"15px", height:"15px", cursor:"pointer", flexShrink:0 }} />
                    <span style={{ fontSize:"13px", color:C.muted, textDecoration:"line-through", flex:1 }}>{t.text}</span>
                    {isAdmin && (
                      <button onClick={() => deleteTask(t.id)}
                        style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"13px", padding:"2px 4px", flexShrink:0 }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ── ROHO Events (pulled from calendar tagged ROHO) ────────────────────────────
function ROHOEventsSection({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/events", {}, token)
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        const today = localDateStr();
        const rohoEvents = all
          .filter((e) => {
            const tag = (e.tag || e.category || e.group || "").toLowerCase();
            const title = (e.title || "").toLowerCase();
            return tag.includes("roho") || title.includes("roho");
          })
          .filter((e) => e.date >= today)
          .sort((a,b) => a.date.localeCompare(b.date));
        setEvents(rohoEvents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Card>
      <SectionHead icon="📅" title="Upcoming ROHO Events" />
      {loading ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted }}>Loading…</p>
      ) : events.length === 0 ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>
          No upcoming events tagged "ROHO". Tag events on the calendar with ROHO to see them here.
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {events.map((e) => (
            <div key={e.id || e.date + e.title} style={{ display:"flex", gap:"14px", alignItems:"flex-start",
              padding:"12px 16px", background:C.cardBg, borderRadius:"10px",
              border:`1px solid ${C.border}`, borderLeft:`3px solid ${ROHO_ACCENT}` }}>
              <div style={{ minWidth:"52px", textAlign:"center", background:ROHO_LIGHT, borderRadius:"8px",
                padding:"6px 8px", flexShrink:0 }}>
                <div style={{ fontSize:"11px", fontWeight:"700", color:ROHO_ACCENT, textTransform:"uppercase" }}>
                  {fmtDate(e.date).split(" ")[0]}
                </div>
                <div style={{ fontSize:"18px", fontWeight:"800", color:ROHO_ACCENT, lineHeight:1 }}>
                  {e.date ? new Date(e.date + "T12:00:00").getDate() : "—"}
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:"700", color:C.text }}>{e.title}</div>
                {e.description && <p style={{ margin:"4px 0 0", fontSize:"12px", color:C.muted, lineHeight:"1.5" }}>{e.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Meeting Notes ─────────────────────────────────────────────────────────────
function MeetingNotesSection({ notes, isAdmin, currentUser, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(localDateStr());
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  function addNote() {
    if (!title.trim()) return;
    const next = [{
      id: genId(), title: title.trim(), date, content,
      authorId: currentUser?.id || "", authorName: currentUser?.name || "",
      createdAt: new Date().toISOString(),
    }, ...notes];
    onUpdate(next);
    setTitle(""); setDate(localDateStr()); setContent(""); setShowForm(false);
  }

  function startEdit(n) {
    setEditingId(n.id);
    setExpandedId(n.id);
    setEditForm({ title: n.title, date: n.date, content: n.content || "" });
    setShowForm(false);
  }

  function saveEdit(id) {
    if (!editForm.title?.trim()) return;
    onUpdate(notes.map((n) => n.id === id ? { ...n, ...editForm, title: editForm.title.trim() } : n));
    setEditingId(null);
  }

  function deleteNote(id) {
    onUpdate(notes.filter((n) => n.id !== id));
  }

  return (
    <Card>
      <SectionHead
        icon="📝"
        title="Meeting Notes"
        right={!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${ROHO_ACCENT}`,
              background:"none", color:ROHO_ACCENT, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            + Add Notes
          </button>
        )}
      />

      {showForm && (
        <div style={{ background:C.cardBg, borderRadius:"10px", padding:"16px", border:`1px solid ${C.border}`,
          marginBottom:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <div style={{ display:"flex", gap:"10px" }}>
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Meeting Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                style={textInput({ width:"100%" })} placeholder="e.g. ROHO Monthly Check-in" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={textInput({})} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
              style={{ ...textInput({ width:"100%", resize:"vertical", lineHeight:"1.75" }) }}
              placeholder={"Agenda items, decisions made, action items, key discussion points…\n\nSupports paragraphs and line breaks."} />
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${C.border}`,
                background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={addNote} disabled={!title.trim()}
              style={{ padding:"8px 20px", borderRadius:"8px", border:"none",
                background:title.trim() ? ROHO_ACCENT : C.border, color:"#fff",
                fontSize:"13px", fontWeight:"700", cursor:title.trim() ? "pointer" : "not-allowed" }}>
              Save Notes
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>No meeting notes logged yet.</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {notes.map((n) => (
            <div key={n.id} style={{ background:C.cardBg, borderRadius:"12px", border:`1px solid ${editingId === n.id ? ROHO_ACCENT : C.border}`, overflow:"hidden" }}>
              {editingId === n.id ? (
                <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
                  <div style={{ display:"flex", gap:"10px" }}>
                    <div style={{ flex:1 }}>
                      <label style={labelStyle}>Meeting Title *</label>
                      <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} autoFocus
                        style={textInput({ width:"100%" })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Date</label>
                      <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} style={textInput({})} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} rows={8}
                      style={{ ...textInput({ width:"100%", resize:"vertical", lineHeight:"1.75" }) }} />
                  </div>
                  <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                    <button onClick={() => setEditingId(null)} style={{ padding:"7px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
                    <button onClick={() => saveEdit(n.id)} disabled={!editForm.title?.trim()} style={{ padding:"7px 18px", borderRadius:"8px", border:"none", background:ROHO_ACCENT, color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", opacity:editForm.title?.trim() ? 1 : 0.5 }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"13px 16px", cursor:"pointer", userSelect:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:ROHO_ACCENT, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:C.text }}>{n.title}</div>
                        <div style={{ fontSize:"11px", color:C.muted, marginTop:"1px" }}>
                          {fmtDate(n.date)} {n.authorName && `· ${n.authorName}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <button onClick={(e) => { e.stopPropagation(); startEdit(n); }}
                        style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"13px", padding:"2px 6px" }}>
                        ✏️
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                        style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:"13px", padding:"2px 4px" }}>
                        ✕
                      </button>
                      <span style={{ fontSize:"11px", color:C.muted }}>{expandedId === n.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expandedId === n.id && n.content && (
                    <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${C.border}` }}>
                      <p style={{ margin:"12px 0 0", fontSize:"13px", color:C.text, lineHeight:"1.8", whiteSpace:"pre-wrap" }}>{n.content}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Space Needs ───────────────────────────────────────────────────────────────
function SpaceNeedsSection({ needs, isAdmin, currentUser, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  function addNeed() {
    if (!text.trim()) return;
    const next = [{
      id: genId(), text: text.trim(), status:"open", priority, notes,
      reportedBy: currentUser?.name || "", reportedById: currentUser?.id || "",
      createdAt: new Date().toISOString(),
    }, ...(needs || [])];
    onUpdate(next);
    setText(""); setPriority("medium"); setNotes(""); setShowForm(false);
  }

  function startEdit(n) {
    setEditingId(n.id);
    setEditForm({ text: n.text, priority: n.priority, notes: n.notes || "" });
    setShowForm(false);
  }

  function saveEdit(id) {
    if (!editForm.text?.trim()) return;
    onUpdate((needs||[]).map((n) => n.id === id ? { ...n, text: editForm.text.trim(), priority: editForm.priority, notes: editForm.notes } : n));
    setEditingId(null);
  }

  function updateStatus(id, status) {
    onUpdate((needs||[]).map((n) => n.id === id ? { ...n, status } : n));
  }

  function deleteNeed(id) {
    onUpdate((needs||[]).filter((n) => n.id !== id));
  }

  const open = (needs||[]).filter((n) => n.status !== "done");
  const done = (needs||[]).filter((n) => n.status === "done");

  return (
    <Card>
      <SectionHead
        icon="🔧"
        title="Space Needs & Updates"
        right={!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${ROHO_ACCENT}`,
              background:"none", color:ROHO_ACCENT, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            + Log Item
          </button>
        )}
      />

      {showForm && (
        <div style={{ background:C.cardBg, borderRadius:"10px", padding:"16px", border:`1px solid ${C.border}`,
          marginBottom:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <div>
            <label style={labelStyle}>What's needed? *</label>
            <input value={text} onChange={(e) => setText(e.target.value)} autoFocus
              style={textInput({ width:"100%" })} placeholder="e.g. Replace two folding chairs, Update signage on door…" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px" }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={textInput({ width:"100%" })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Additional Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                style={textInput({ width:"100%" })} placeholder="Context, vendor info, deadline…" />
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${C.border}`,
                background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={addNeed} disabled={!text.trim()}
              style={{ padding:"8px 20px", borderRadius:"8px", border:"none",
                background:text.trim() ? ROHO_ACCENT : C.border, color:"#fff",
                fontSize:"13px", fontWeight:"700", cursor:text.trim() ? "pointer" : "not-allowed" }}>
              Log Item
            </button>
          </div>
        </div>
      )}

      {(!needs || needs.length === 0) ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>No space needs logged yet.</p>
      ) : (
        <div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {open.map((n) => (
              <div key={n.id} style={{ background:C.cardBg, borderRadius:"10px", border:`1px solid ${editingId === n.id ? ROHO_ACCENT : C.border}`, borderLeft:`3px solid ${PRIORITY_COLORS[n.priority] || C.border}`, overflow:"hidden" }}>
                {editingId === n.id ? (
                  <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:"10px" }}>
                    <div>
                      <label style={labelStyle}>What's needed? *</label>
                      <input value={editForm.text} onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))} autoFocus
                        style={textInput({ width:"100%" })} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px" }}>
                      <div>
                        <label style={labelStyle}>Priority</label>
                        <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))} style={textInput({ width:"100%" })}>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Additional Notes</label>
                        <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} style={textInput({ width:"100%" })} />
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                      <button onClick={() => setEditingId(null)} style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
                      <button onClick={() => saveEdit(n.id)} disabled={!editForm.text?.trim()} style={{ padding:"6px 16px", borderRadius:"8px", border:"none", background:ROHO_ACCENT, color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", opacity:editForm.text?.trim() ? 1 : 0.5 }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:"12px", alignItems:"flex-start", padding:"12px 16px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:"600", color:C.text, marginBottom:"4px" }}>{n.text}</div>
                      {n.notes && <p style={{ margin:"0 0 6px", fontSize:"12px", color:C.muted, lineHeight:"1.5" }}>{n.notes}</p>}
                      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
                        <Chip label={STATUS_LABELS[n.status] || n.status} color={STATUS_COLORS[n.status] || C.accent} />
                        <Chip label={n.priority} color={PRIORITY_COLORS[n.priority]} />
                        {n.reportedBy && <span style={{ fontSize:"11px", color:C.muted }}>by {n.reportedBy}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", alignItems:"center", flexShrink:0 }}>
                      <select value={n.status} onChange={(e) => updateStatus(n.id, e.target.value)}
                        style={{ ...textInput({ fontSize:"11px", padding:"4px 8px" }), cursor:"pointer" }}>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button onClick={() => startEdit(n)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"13px", padding:"2px 6px" }}>✏️</button>
                      <button onClick={() => deleteNeed(n.id)} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:"14px", padding:"2px 4px" }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {done.length > 0 && (
            <details style={{ marginTop:"12px" }}>
              <summary style={{ fontSize:"12px", color:C.muted, fontWeight:"600", cursor:"pointer", padding:"4px 0" }}>
                {done.length} resolved item{done.length !== 1 ? "s" : ""}
              </summary>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginTop:"8px" }}>
                {done.map((n) => (
                  <div key={n.id} style={{ display:"flex", alignItems:"center", gap:"12px",
                    padding:"10px 16px", background:C.cardBg, borderRadius:"10px",
                    border:`1px solid ${C.border}`, opacity:0.6 }}>
                    <span style={{ fontSize:"13px", color:C.muted, textDecoration:"line-through", flex:1 }}>{n.text}</span>
                    <Chip label="Done" color="#10B981" />
                    {isAdmin && (
                      <button onClick={() => deleteNeed(n.id)}
                        style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:"14px", padding:"2px 4px" }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Event Coverage ─────────────────────────────────────────────────────────────
function EventCoverageSection({ coverage, teamMembers, rohoTeam, isAdmin, currentUser, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const assigneeOptions = rohoTeam.length > 0 ? rohoTeam : teamMembers;

  function addEvent() {
    if (!title.trim()) return;
    const next = [...(coverage||[]), {
      id: genId(), title: title.trim(), date, location: location.trim(), notes: eventNotes,
      slots: [],
    }];
    onUpdate(next);
    setTitle(""); setDate(""); setLocation(""); setEventNotes(""); setShowForm(false);
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setEditForm({ title: ev.title, date: ev.date || "", location: ev.location || "", notes: ev.notes || "" });
    setShowForm(false);
  }

  function saveEdit(id) {
    if (!editForm.title?.trim()) return;
    onUpdate((coverage||[]).map((e) => e.id === id ? {
      ...e, title: editForm.title.trim(), date: editForm.date,
      location: editForm.location.trim(), notes: editForm.notes,
    } : e));
    setEditingId(null);
  }

  function deleteEvent(id) {
    onUpdate((coverage||[]).filter((e) => e.id !== id));
  }

  function claimSlot(eventId, slotIndex) {
    const me = currentUser;
    if (!me) return;
    const next = (coverage||[]).map((e) => {
      if (e.id !== eventId) return e;
      const slots = e.slots || [];
      const existing = slots.find((s) => s.slotIndex === slotIndex);
      if (existing) {
        // unclaim if it's mine
        if (existing.userId === me.id) return { ...e, slots: slots.filter((s) => s.slotIndex !== slotIndex) };
        return e; // slot taken by someone else
      }
      return { ...e, slots: [...slots, { slotIndex, userId: me.id, name: me.name, coverDate: date }] };
    });
    onUpdate(next);
  }

  function assignSlot(eventId, slotIndex, memberId) {
    const member = assigneeOptions.find((m) => (m.userId||m.id) === memberId);
    const next = (coverage||[]).map((e) => {
      if (e.id !== eventId) return e;
      const slots = (e.slots||[]).filter((s) => s.slotIndex !== slotIndex);
      if (!memberId) return { ...e, slots };
      return { ...e, slots: [...slots, { slotIndex, userId: memberId, name: member?.name||"", coverDate:"" }] };
    });
    onUpdate(next);
  }

  return (
    <Card>
      <SectionHead
        icon="🗓️"
        title="Event Coverage"
        right={!showForm && !editingId && (
          <button onClick={() => setShowForm(true)}
            style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${ROHO_ACCENT}`,
              background:"none", color:ROHO_ACCENT, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            + Add Event
          </button>
        )}
      />

      {showForm && (
        <div style={{ background:C.cardBg, borderRadius:"10px", padding:"16px", border:`1px solid ${C.border}`,
          marginBottom:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"10px" }}>
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                style={textInput({ width:"100%" })} placeholder="e.g. ROHO Game Night" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={textInput({ width:"100%" })} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px" }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                style={textInput({ width:"100%" })} placeholder="Room / address…" />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input value={eventNotes} onChange={(e) => setEventNotes(e.target.value)}
                style={textInput({ width:"100%" })} placeholder="Setup needs, reminders…" />
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"8px 16px", borderRadius:"8px", border:`1px solid ${C.border}`,
                background:"none", color:C.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={addEvent} disabled={!title.trim()}
              style={{ padding:"8px 20px", borderRadius:"8px", border:"none",
                background:title.trim() ? ROHO_ACCENT : C.border, color:"#fff",
                fontSize:"13px", fontWeight:"700", cursor:title.trim() ? "pointer" : "not-allowed" }}>
              Add Event
            </button>
          </div>
        </div>
      )}

      {(!coverage || coverage.length === 0) ? (
        <p style={{ margin:0, fontSize:"13px", color:C.muted, fontStyle:"italic" }}>
          No events yet. Click "+ Add Event" to set up coverage.
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {(coverage||[]).map((ev) => {
            const slots = ev.slots || [];
            return (
              <div key={ev.id} style={{ background:C.cardBg, borderRadius:"12px", border:`1px solid ${editingId === ev.id ? ROHO_ACCENT : C.border}`,
                borderLeft:`3px solid ${ROHO_ACCENT}`, overflow:"hidden" }}>
                {/* Event header — edit mode */}
                {editingId === ev.id ? (
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"10px", marginBottom:"10px" }}>
                      <div>
                        <label style={labelStyle}>Event Title *</label>
                        <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} autoFocus
                          style={textInput({ width:"100%" })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} style={textInput({ width:"100%" })} />
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px", marginBottom:"10px" }}>
                      <div>
                        <label style={labelStyle}>Location</label>
                        <input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} style={textInput({ width:"100%" })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Notes</label>
                        <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} style={textInput({ width:"100%" })} />
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                      <button onClick={() => setEditingId(null)} style={{ padding:"6px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
                      <button onClick={() => saveEdit(ev.id)} disabled={!editForm.title?.trim()} style={{ padding:"6px 16px", borderRadius:"8px", border:"none", background:ROHO_ACCENT, color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", opacity:editForm.title?.trim() ? 1 : 0.5 }}>Save</button>
                    </div>
                  </div>
                ) : (
                  /* Event header — view mode */
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`,
                    display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                    <div>
                      <div style={{ fontSize:"14px", fontWeight:"800", color:C.text }}>{ev.title}</div>
                      <div style={{ display:"flex", gap:"12px", marginTop:"4px", flexWrap:"wrap" }}>
                        {ev.date && <span style={{ fontSize:"12px", color:C.muted }}>📅 {fmtDate(ev.date)}</span>}
                        {ev.location && <span style={{ fontSize:"12px", color:C.muted }}>📍 {ev.location}</span>}
                        {ev.notes && <span style={{ fontSize:"12px", color:C.muted, fontStyle:"italic" }}>{ev.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"4px", flexShrink:0 }}>
                      <button onClick={() => startEdit(ev)}
                        style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"14px", padding:"2px 6px" }}>
                        ✏️
                      </button>
                      <button onClick={() => deleteEvent(ev.id)}
                        style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:"14px", padding:"2px 6px" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* 4 coverage slots */}
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase",
                    letterSpacing:"0.07em", marginBottom:"10px" }}>Coverage Slots</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"8px" }}>
                    {[0,1,2,3].map((slotIdx) => {
                      const filled = slots.find((s) => s.slotIndex === slotIdx);
                      const isMine = filled?.userId === currentUser?.id;
                      return (
                        <div key={slotIdx} style={{ padding:"10px 12px", borderRadius:"10px",
                          background: filled ? ROHO_LIGHT : C.card,
                          border:`1px solid ${filled ? ROHO_ACCENT : C.border}` }}>
                          <div style={{ fontSize:"10px", fontWeight:"700", color:C.muted,
                            textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"6px" }}>
                            Slot {slotIdx + 1}
                          </div>
                          {filled ? (
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                                <Avatar name={filled.name} size={20} />
                                <span style={{ fontSize:"12px", fontWeight:"700", color:C.text }}>{filled.name}</span>
                              </div>
                              {isMine && (
                                <button onClick={() => claimSlot(ev.id, slotIdx)}
                                  style={{ fontSize:"11px", color:"#EF4444", background:"none", border:"none",
                                    cursor:"pointer", padding:0, marginTop:"2px", fontWeight:"600" }}>
                                  Remove myself
                                </button>
                              )}
                              {isAdmin && !isMine && (
                                <select
                                  value={filled.userId}
                                  onChange={(e) => assignSlot(ev.id, slotIdx, e.target.value)}
                                  style={{ ...textInput({ fontSize:"11px", padding:"3px 6px", width:"100%", marginTop:"4px" }) }}>
                                  <option value="">— Unassign —</option>
                                  {assigneeOptions.map((m) => <option key={m.userId||m.id} value={m.userId||m.id}>{m.name}</option>)}
                                </select>
                              )}
                            </div>
                          ) : (
                            <div>
                              <button onClick={() => claimSlot(ev.id, slotIdx)}
                                style={{ fontSize:"12px", fontWeight:"600", color:ROHO_ACCENT, background:"none",
                                  border:`1px dashed ${ROHO_ACCENT}`, borderRadius:"6px", padding:"4px 10px",
                                  cursor:"pointer", width:"100%", marginBottom: isAdmin ? "6px" : "0" }}>
                                + Cover this slot
                              </button>
                              {isAdmin && (
                                <select value="" onChange={(e) => assignSlot(ev.id, slotIdx, e.target.value)}
                                  style={{ ...textInput({ fontSize:"11px", padding:"3px 6px", width:"100%", marginTop:"4px" }) }}>
                                  <option value="">Assign someone…</option>
                                  {assigneeOptions.map((m) => <option key={m.userId||m.id} value={m.userId||m.id}>{m.name}</option>)}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Tab navigation ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",   label:"Overview",       icon:"🎉" },
  { id:"events",     label:"Events",         icon:"📅" },
  { id:"tasks",      label:"Tasks",          icon:"✅" },
  { id:"notes",      label:"Meeting Notes",  icon:"📝" },
  { id:"needs",      label:"Space Needs",    icon:"🔧" },
  { id:"coverage",   label:"Event Coverage", icon:"🗓️" },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function ROHOView({ token, currentUser, teamMembers = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/api/roho", {}, token);
      const d = await r.json();
      setData(d);
    } catch { setData({ about:"", teamMembers:[], tasks:[], meetingNotes:[], spaceNeeds:[], eventCoverage:[] }); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function patch(updates) {
    setSaving(true);
    try {
      const r = await apiFetch("/api/roho", { method:"PUT", body: JSON.stringify(updates) }, token);
      const d = await r.json();
      setData(d);
    } catch (e) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ padding:"60px 20px", textAlign:"center", color:C.muted, fontSize:"14px" }}>Loading ROHO…</div>
  );

  const rohoTeam = data?.teamMembers || [];

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom:"24px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:ROHO_ACCENT,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px" }}>
              🎉
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:"22px", fontWeight:"900", color:C.text }}>ROHO Social Club</h1>
              <p style={{ margin:"2px 0 0", fontSize:"13px", color:C.muted }}>Member social club — team hub</p>
            </div>
          </div>
          {rohoTeam.length > 0 && (
            <div style={{ display:"flex", gap:"6px", marginTop:"12px", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"11px", color:C.muted, fontWeight:"600" }}>Team:</span>
              {rohoTeam.map((m) => (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:"5px",
                  padding:"3px 10px 3px 6px", borderRadius:"20px",
                  background:ROHO_LIGHT, border:`1px solid ${ROHO_ACCENT}40` }}>
                  <Avatar name={m.name} size={18} />
                  <span style={{ fontSize:"11px", fontWeight:"700", color:ROHO_ACCENT }}>{m.name}</span>
                  {m.role && <span style={{ fontSize:"10px", color:C.muted }}>· {m.role}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {saving && <span style={{ fontSize:"12px", color:C.muted, fontStyle:"italic", paddingTop:"14px" }}>Saving…</span>}
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"20px", flexWrap:"wrap",
        background:C.cardBg, padding:"5px", borderRadius:"12px", border:`1px solid ${C.border}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ display:"flex", alignItems:"center", gap:"6px",
              padding:"8px 14px", borderRadius:"8px", border:"none", cursor:"pointer",
              background: activeTab === t.id ? ROHO_ACCENT : "none",
              color: activeTab === t.id ? "#fff" : C.muted,
              fontSize:"13px", fontWeight:"600", transition:"all 0.15s", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:"14px" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <TeamSection
            teamMembers={rohoTeam}
            allTeamMembers={teamMembers}
            isAdmin={isAdmin}
            onUpdate={(tm) => patch({ teamMembers: tm })}
          />
          <AboutSection
            about={data?.about || ""}
            isAdmin={isAdmin}
            onSave={(text) => patch({ about: text })}
          />
        </div>
      )}

      {activeTab === "events" && (
        <ROHOEventsSection token={token} />
      )}

      {activeTab === "tasks" && (
        <TasksSection
          tasks={data?.tasks || []}
          teamMembers={teamMembers}
          rohoTeam={rohoTeam}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onUpdate={(tasks) => patch({ tasks })}
        />
      )}

      {activeTab === "notes" && (
        <MeetingNotesSection
          notes={data?.meetingNotes || []}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onUpdate={(meetingNotes) => patch({ meetingNotes })}
        />
      )}

      {activeTab === "needs" && (
        <SpaceNeedsSection
          needs={data?.spaceNeeds || []}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onUpdate={(spaceNeeds) => patch({ spaceNeeds })}
        />
      )}

      {activeTab === "coverage" && (
        <EventCoverageSection
          coverage={data?.eventCoverage || []}
          teamMembers={teamMembers}
          rohoTeam={rohoTeam}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onUpdate={(eventCoverage) => patch({ eventCoverage })}
        />
      )}
    </div>
  );
}
