"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function textInput(extra = {}) {
  return {
    padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "8px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    boxSizing: "border-box", ...extra,
  };
}

const labelStyle = {
  display: "block", fontSize: "11px", color: C.muted, fontWeight: "700",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px",
};

const STATUSES = [
  { id: "active", label: "Active", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { id: "paused", label: "Paused", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { id: "inactive", label: "Inactive", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
];

function StatusBadge({ status }) {
  const cfg = STATUSES.find((s) => s.id === status) || STATUSES[0];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: "10px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", letterSpacing: "0.04em" }}>
      {cfg.label}
    </span>
  );
}

function StarRating({ value, onChange, readOnly }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n === value ? 0 : n)}
          onMouseEnter={() => !readOnly && setHov(n)}
          onMouseLeave={() => !readOnly && setHov(0)}
          style={{ fontSize: "18px", cursor: readOnly ? "default" : "pointer", lineHeight: 1, color: n <= (hov || value) ? "#F59E0B" : C.border, transition: "color 0.1s" }}
        >★</span>
      ))}
      {value > 0 && <span style={{ fontSize: "11px", color: C.muted, marginLeft: "4px" }}>{value}/5</span>}
    </div>
  );
}

function MemberInitials({ name, size = 28 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0 }}>
      {ini}
    </div>
  );
}

// ─── Engagement Prompt Banner ──────────────────────────────────────────────────

function EngagementPromptBanner({ token, prompts, onSavePrompt }) {
  const [prompt, setPrompt] = useState(prompts[prompts.length - 1] || "");
  const [theme, setTheme] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch("/api/circles/prompt", { method: "POST", body: JSON.stringify({ theme: theme.trim() || null, previousPrompts: prompts.slice(-5) }) }, token);
      const data = await res.json();
      if (data.prompt) {
        setPrompt(data.prompt);
        onSavePrompt(data.prompt);
      }
    } catch (e) {}
    setGenerating(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)`,
      border: `1px solid ${C.accent}33`,
      borderRadius: "14px", padding: "20px 24px", marginBottom: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "280px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: C.accent, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            ✨ Circle Engagement Prompt
            <span style={{ fontSize: "11px", fontWeight: "400", color: C.muted }}>— share with your circles to spark conversation</span>
          </div>
          {prompt ? (
            <div style={{ fontSize: "16px", fontWeight: "600", color: C.text, lineHeight: "1.5", fontStyle: "italic" }}>
              "{prompt}"
            </div>
          ) : (
            <div style={{ fontSize: "14px", color: C.muted, fontStyle: "italic" }}>Click "Generate Prompt" to create an AI-powered conversation starter for your circles.</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme (optional)" style={{ ...textInput({ width: "160px", fontSize: "12px" }) }} onKeyDown={(e) => e.key === "Enter" && generate()} />
            <button onClick={generate} disabled={generating} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              {generating ? "✨ Generating…" : "✨ Generate Prompt"}
            </button>
          </div>
          {prompt && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={copy} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              {prompts.length > 1 && (
                <button onClick={() => setShowHistory(!showHistory)} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.card, color: C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  🕐 History ({prompts.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showHistory && prompts.length > 1 && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: C.muted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recent Prompts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[...prompts].reverse().slice(0, 8).map((p, i) => (
              <div key={i} onClick={() => { setPrompt(p); setShowHistory(false); }} style={{ fontSize: "13px", color: C.text, cursor: "pointer", padding: "6px 10px", borderRadius: "8px", background: C.card, border: `1px solid ${C.border}` }}>
                "{p}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Meetup Log ────────────────────────────────────────────────────────────────

function MeetupLog({ meetups, onChange }) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState("");

  const addMeetup = () => {
    if (!date) return;
    const entry = { id: Date.now().toString(), date, notes, attendees, loggedAt: new Date().toISOString() };
    onChange([...meetups, entry]);
    setDate(""); setNotes(""); setAttendees(""); setAdding(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>📅 Meetup Log ({meetups.length})</span>
        <button onClick={() => setAdding(!adding)} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.accent, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
          {adding ? "Cancel" : "+ Log Meetup"}
        </button>
      </div>

      {adding && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...textInput({ width: "100%" }) }} />
          <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Who attended?" style={{ ...textInput({ width: "100%" }) }} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes from the meetup…" style={{ ...textInput({ width: "100%", resize: "none", fontFamily: "inherit" }) }} />
          <button onClick={addMeetup} disabled={!date} style={{ padding: "7px", borderRadius: "6px", border: "none", background: date ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: date ? "pointer" : "not-allowed" }}>Add Entry</button>
        </div>
      )}

      {meetups.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[...meetups].reverse().map((m) => (
            <div key={m.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: m.notes ? "4px" : 0 }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>{m.date}</span>
                <button onClick={() => onChange(meetups.filter((x) => x.id !== m.id))} style={{ fontSize: "10px", color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
              {m.attendees && <div style={{ fontSize: "11px", color: C.accent, marginBottom: "2px" }}>👥 {m.attendees}</div>}
              {m.notes && <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5" }}>{m.notes}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>No meetups logged yet.</div>
      )}
    </div>
  );
}

// ─── Photo Gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ photos, onChange }) {
  const fileRef = useRef(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addPhoto = () => {
    if (!preview) return;
    onChange([...photos, { id: Date.now().toString(), url: preview, caption, uploadedAt: new Date().toISOString() }]);
    setPreview(null); setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>📷 Photos ({photos.length})</div>
      {photos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <img src={p.url} alt={p.caption || ""} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}` }} />
              <button onClick={() => onChange(photos.filter((x) => x.id !== p.id))} style={{ position: "absolute", top: "-5px", right: "-5px", width: "16px", height: "16px", borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
        {preview ? (
          <>
            <img src={preview} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", border: `1px solid ${C.border}` }} />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" style={{ ...textInput({ flex: 1, minWidth: "120px" }) }} />
            <button onClick={addPhoto} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: C.accent, color: "#fff", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>Add</button>
            <button onClick={() => { setPreview(null); setCaption(""); }} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
          </>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.text, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
            📷 Add Photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── Circle Detail Modal ───────────────────────────────────────────────────────

function CircleModal({ circle, token, teamMembers, onClose, onSave, onDelete }) {
  const isNew = !circle?.id;
  const [name, setName] = useState(circle?.name || "");
  const [members, setMembers] = useState(circle?.members || []);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState(circle?.assignedMemberId || "");
  const [assignedMemberName, setAssignedMemberName] = useState(circle?.assignedMemberName || "");
  const [connectionReason, setConnectionReason] = useState(circle?.connectionReason || "");
  const [goals, setGoals] = useState(circle?.goals || "");
  const [status, setStatus] = useState(circle?.status || "active");
  const [rating, setRating] = useState(circle?.rating || 0);
  const [dinnerInvited, setDinnerInvited] = useState(circle?.dinnerInvited || false);
  const [dinnerNotes, setDinnerNotes] = useState(circle?.dinnerNotes || "");
  const [communicationPref, setCommunicationPref] = useState(circle?.communicationPref || "");
  const [nextMeetup, setNextMeetup] = useState(circle?.nextMeetup || "");
  const [notes, setNotes] = useState(circle?.notes || "");
  const [meetups, setMeetups] = useState(circle?.meetups || []);
  const [photos, setPhotos] = useState(circle?.photos || []);
  const [tasks, setTasks] = useState(circle?.tasks || []);
  const [newTask, setNewTask] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberEmail, setEditMemberEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("info");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const addMember = (overrideName, overrideEmail) => {
    const n = (overrideName ?? newMemberName).trim();
    if (!n) return;
    const e = (overrideEmail ?? newMemberEmail).trim();
    setMembers((prev) => [...prev, { id: Date.now().toString(), name: n, email: e }]);
    setNewMemberName(""); setNewMemberEmail("");
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingMemberId === id) setEditingMemberId(null);
  };

  const startEditMember = (m) => {
    setEditingMemberId(m.id);
    setEditMemberName(m.name);
    setEditMemberEmail(m.email || "");
  };

  const saveEditMember = (id) => {
    if (!editMemberName.trim()) return;
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, name: editMemberName.trim(), email: editMemberEmail.trim() } : m));
    setEditingMemberId(null);
  };

  const cancelEditMember = () => setEditingMemberId(null);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const toggleTask = (id) => setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const removeTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  const handleAssignedChange = (id) => {
    setAssignedMemberId(id);
    const m = teamMembers.find((m) => m.id === id);
    setAssignedMemberName(m?.name || "");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    // Flush any pending member that was typed but not yet committed with "Add"
    let finalMembers = members;
    if (newMemberName.trim()) {
      finalMembers = [...members, { id: Date.now().toString(), name: newMemberName.trim(), email: newMemberEmail.trim() }];
    }
    // Flush any member currently being edited
    if (editingMemberId && editMemberName.trim()) {
      finalMembers = finalMembers.map((m) => m.id === editingMemberId ? { ...m, name: editMemberName.trim(), email: editMemberEmail.trim() } : m);
    }

    await onSave({ name: name.trim(), members: finalMembers, assignedMemberId: assignedMemberId || null, assignedMemberName: assignedMemberName || "", connectionReason, goals, status, rating, dinnerInvited, dinnerNotes, communicationPref, nextMeetup, notes, meetups, photos, tasks }, circle?.id);
    setSaving(false);
    onClose();
  };

  const sections = [
    { id: "info", label: "Info" },
    { id: "members", label: `Members (${members.length})` },
    { id: "meetups", label: `Meetups (${meetups.length})` },
    { id: "tasks", label: `Tasks (${tasks.length})` },
    { id: "photos", label: `Photos (${photos.length})` },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "640px", maxWidth: "96vw", maxHeight: "94vh",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px",
        zIndex: 3001, boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ flex: 1 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Circle name…" style={{ ...textInput({ fontSize: "17px", fontWeight: "700", background: "transparent", border: "none", padding: "0", width: "100%", color: C.text }) }} />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...textInput({ padding: "5px 10px", fontSize: "12px" }) }}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={onClose} style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${C.border}` }}>
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "7px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "12px", fontWeight: activeSection === s.id ? "700" : "500", color: activeSection === s.id ? C.accentBright : C.muted, borderBottom: `2px solid ${activeSection === s.id ? C.accent : "transparent"}`, marginBottom: "-1px", transition: "all 0.1s" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>

          {/* ── INFO SECTION ── */}
          {activeSection === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Rating */}
              <div>
                <label style={labelStyle}>Circle Health Rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Assigned team member */}
              {teamMembers.length > 0 && (
                <div>
                  <label style={labelStyle}>Assigned Team Member</label>
                  <select value={assignedMemberId || ""} onChange={(e) => handleAssignedChange(e.target.value)} style={{ ...textInput({ width: "100%" }) }}>
                    <option value="">— None assigned —</option>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              {/* Connection reason */}
              <div>
                <label style={labelStyle}>Why They're Connected</label>
                <textarea value={connectionReason} onChange={(e) => setConnectionReason(e.target.value)} rows={2} placeholder="Shared interest in tech startups, both new to the space…" style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }} />
              </div>

              {/* Goals */}
              <div>
                <label style={labelStyle}>Circle Goals</label>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="Build a meaningful connection, meet monthly, start a collab project…" style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }} />
              </div>

              {/* Next meetup + Comm pref */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Next Meetup Date</label>
                  <input type="date" value={nextMeetup} onChange={(e) => setNextMeetup(e.target.value)} style={{ ...textInput({ width: "100%" }) }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Communication Preference</label>
                  <select value={communicationPref} onChange={(e) => setCommunicationPref(e.target.value)} style={{ ...textInput({ width: "100%" }) }}>
                    <option value="">— Select —</option>
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="text">Text</option>
                    <option value="in-person">In-Person</option>
                    <option value="app">In-App</option>
                  </select>
                </div>
              </div>

              {/* Dinner */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: dinnerInvited ? "8px" : 0 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: C.text }}>
                    <input type="checkbox" checked={dinnerInvited} onChange={(e) => setDinnerInvited(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: C.accent, cursor: "pointer" }} />
                    🍽️ Invited to TCF Dinner
                  </label>
                </div>
                {dinnerInvited && (
                  <input value={dinnerNotes} onChange={(e) => setDinnerNotes(e.target.value)} placeholder="Dinner notes (date, details…)" style={{ ...textInput({ width: "100%" }) }} />
                )}
              </div>

              {/* General notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Observations, feedback, anything notable about this circle…" style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }} />
              </div>
            </div>
          )}

          {/* ── MEMBERS SECTION ── */}
          {activeSection === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {members.length === 0 && (
                <div style={{ fontSize: "13px", color: C.muted, textAlign: "center", padding: "16px 0" }}>No members yet. Add one below.</div>
              )}
              {members.map((m) => (
                <div key={m.id} style={{ background: C.cardBg, border: `1px solid ${editingMemberId === m.id ? C.accent : C.border}`, borderRadius: "10px", padding: "10px 12px", transition: "border-color 0.12s" }}>
                  {editingMemberId === m.id ? (
                    /* ── Edit mode ── */
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: C.accent, textTransform: "uppercase", letterSpacing: "0.07em" }}>Editing member</div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <input
                          autoFocus
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          placeholder="Full name *"
                          style={{ ...textInput({ flex: 1, minWidth: "140px" }) }}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEditMember(m.id); if (e.key === "Escape") cancelEditMember(); }}
                        />
                        <input
                          value={editMemberEmail}
                          onChange={(e) => setEditMemberEmail(e.target.value)}
                          placeholder="Email (optional)"
                          style={{ ...textInput({ flex: 1, minWidth: "140px" }) }}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEditMember(m.id); if (e.key === "Escape") cancelEditMember(); }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => saveEditMember(m.id)} disabled={!editMemberName.trim()} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: editMemberName.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: editMemberName.trim() ? "pointer" : "not-allowed" }}>Save</button>
                        <button onClick={cancelEditMember} style={{ padding: "6px 12px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                        <button onClick={() => removeMember(m.id)} style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: "7px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "12px", cursor: "pointer" }}>🗑 Remove</button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <MemberInitials name={m.name} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>{m.name}</div>
                        {m.email && <div style={{ fontSize: "11px", color: C.muted }}>{m.email}</div>}
                      </div>
                      <button
                        onClick={() => startEditMember(m)}
                        title="Edit member"
                        style={{ padding: "4px 8px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}
                      >✏️</button>
                      <button onClick={() => removeMember(m.id)} style={{ padding: "4px 8px", borderRadius: "6px", border: "none", background: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer" }}>✕</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add member */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Add Member</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Full name *"
                    style={{ ...textInput({ flex: 1, minWidth: "140px" }) }}
                    onKeyDown={(e) => e.key === "Enter" && addMember()}
                  />
                  <input
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email (optional)"
                    style={{ ...textInput({ flex: 1, minWidth: "140px" }) }}
                    onKeyDown={(e) => e.key === "Enter" && addMember()}
                  />
                  <button
                    onClick={() => addMember()}
                    disabled={!newMemberName.trim()}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: newMemberName.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newMemberName.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}
                  >
                    + Add
                  </button>
                </div>
                {newMemberName.trim() && (
                  <div style={{ fontSize: "11px", color: C.muted }}>Press Enter or click Add — or just hit Save Changes and it'll be included automatically.</div>
                )}
              </div>
            </div>
          )}

          {/* ── MEETUPS SECTION ── */}
          {activeSection === "meetups" && (
            <MeetupLog meetups={meetups} onChange={setMeetups} />
          )}

          {/* ── TASKS SECTION ── */}
          {activeSection === "tasks" && (
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task or small to-do for this circle…" style={{ ...textInput({ flex: 1 }) }} onKeyDown={(e) => e.key === "Enter" && addTask()} />
                <button onClick={addTask} disabled={!newTask.trim()} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: newTask.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newTask.trim() ? "pointer" : "not-allowed" }}>Add</button>
              </div>
              {tasks.length === 0 ? (
                <div style={{ fontSize: "13px", color: C.muted, textAlign: "center", padding: "24px" }}>No tasks yet. Add small action items for this circle.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {tasks.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 10px", opacity: t.done ? 0.6 : 1 }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} style={{ width: "16px", height: "16px", accentColor: C.accent, cursor: "pointer", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "13px", color: C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                      <button onClick={() => removeTask(t.id)} style={{ fontSize: "11px", color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PHOTOS SECTION ── */}
          {activeSection === "photos" && (
            <PhotoGallery photos={photos} onChange={setPhotos} />
          )}
        </div>

        {/* Modal footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", flexShrink: 0, background: C.card }}>
          <div>
            {!isNew && (
              <button onClick={() => { if (confirm("Delete this circle?")) { onDelete(circle.id); onClose(); } }} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                🗑 Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || saving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: name.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Saving…" : isNew ? "Create Circle" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Circle Card ───────────────────────────────────────────────────────────────

function CircleCard({ circle, onClick }) {
  const [hov, setHov] = useState(false);
  const statusCfg = STATUSES.find((s) => s.id === circle.status) || STATUSES[0];
  const doneTasks = (circle.tasks || []).filter((t) => t.done).length;
  const totalTasks = (circle.tasks || []).length;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov ? C.accent : C.border}`,
        borderLeft: `3px solid ${statusCfg.color}`,
        borderRadius: "14px", padding: "16px", cursor: "pointer",
        transition: "all 0.15s", boxShadow: hov ? C.shadowMd : C.shadow,
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column", gap: "10px",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{circle.name}</div>
          <StatusBadge status={circle.status} />
        </div>
        {circle.rating > 0 && (
          <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
            {[1,2,3,4,5].map((n) => (
              <span key={n} style={{ fontSize: "13px", color: n <= circle.rating ? "#F59E0B" : C.border }}>★</span>
            ))}
          </div>
        )}
      </div>

      {/* Members avatars */}
      {circle.members?.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex" }}>
            {circle.members.slice(0, 5).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: circle.members.length - i, position: "relative", border: `2px solid ${C.card}`, borderRadius: "50%" }}>
                <MemberInitials name={m.name} size={28} />
              </div>
            ))}
          </div>
          {circle.members.length > 5 && <span style={{ fontSize: "11px", color: C.muted }}>+{circle.members.length - 5}</span>}
          <span style={{ fontSize: "12px", color: C.muted }}>{circle.members.length} member{circle.members.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Connection reason */}
      {circle.connectionReason && (
        <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {circle.connectionReason}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "6px", borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
        {circle.assignedMemberName && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <MemberInitials name={circle.assignedMemberName} size={18} />
            <span style={{ fontSize: "11px", color: C.muted }}>{circle.assignedMemberName}</span>
          </div>
        )}
        {circle.meetups?.length > 0 && (
          <span style={{ fontSize: "11px", color: C.muted }}>📅 {circle.meetups.length} meetup{circle.meetups.length !== 1 ? "s" : ""}</span>
        )}
        {totalTasks > 0 && (
          <span style={{ fontSize: "11px", color: doneTasks === totalTasks ? "#10B981" : C.muted }}>
            ✓ {doneTasks}/{totalTasks} tasks
          </span>
        )}
        {circle.dinnerInvited && (
          <span style={{ fontSize: "11px", color: "#8B5CF6", fontWeight: "600" }}>🍽️ Dinner invited</span>
        )}
        {circle.nextMeetup && (
          <span style={{ fontSize: "11px", color: C.accent }}>📆 {circle.nextMeetup}</span>
        )}
        {circle.photos?.length > 0 && (
          <span style={{ fontSize: "11px", color: C.muted }}>📷 {circle.photos.length}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main CirclesView ──────────────────────────────────────────────────────────

export default function CirclesView({ token, currentUser, teamMembers = [] }) {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCircle, setModalCircle] = useState(null); // null=closed, false=new, obj=edit
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [savedPrompts, setSavedPrompts] = useState([]);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/circles", {}, token)
      .then((r) => r.json())
      .then((data) => setCircles(Array.isArray(data) ? data : []))
      .catch(() => setCircles([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (data, id) => {
    if (id) {
      const res = await apiFetch(`/api/circles/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setCircles((prev) => prev.map((c) => c.id === id ? saved : c));
    } else {
      const res = await apiFetch("/api/circles", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setCircles((prev) => [...prev, saved]);
    }
  };

  const handleDelete = async (id) => {
    setCircles((prev) => prev.filter((c) => c.id !== id));
    await apiFetch(`/api/circles/${id}`, { method: "DELETE" }, token);
  };

  const filtered = circles.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.connectionReason || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.members || []).some((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const activeCount = circles.filter((c) => c.status === "active").length;
  const totalMeetups = circles.reduce((acc, c) => acc + (c.meetups?.length || 0), 0);
  const avgRating = circles.filter((c) => c.rating > 0).length > 0
    ? (circles.filter((c) => c.rating > 0).reduce((acc, c) => acc + c.rating, 0) / circles.filter((c) => c.rating > 0).length).toFixed(1)
    : null;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>⭕ TCF Circles</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Member connection groups — track meetups, progress, and engagement.</p>
        </div>
        <button onClick={() => setModalCircle(false)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
          + New Circle
        </button>
      </div>

      {/* Stats row */}
      {circles.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          {[
            { label: "Total Circles", value: circles.length, icon: "⭕" },
            { label: "Active", value: activeCount, icon: "✅" },
            { label: "Total Meetups", value: totalMeetups, icon: "📅" },
            ...(avgRating ? [{ label: "Avg Rating", value: `${avgRating}/5`, icon: "⭐" }] : []),
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center", minWidth: "120px" }}>
              <span style={{ fontSize: "20px" }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: C.text }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Engagement Prompt */}
      <EngagementPromptBanner token={token} prompts={savedPrompts} onSavePrompt={(p) => setSavedPrompts((prev) => [...prev, p])} />

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search circles, members…" style={{ ...textInput({ width: "240px" }) }} />
        <div style={{ display: "flex", gap: "4px" }}>
          {["all", "active", "paused", "inactive"].map((s) => {
            const cfg = STATUSES.find((x) => x.id === s);
            return (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${filterStatus === s ? C.accent : C.border}`, background: filterStatus === s ? C.accentLight : "none", color: filterStatus === s ? C.accentBright : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                {s === "all" ? "All" : (cfg?.label || s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Circles grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.muted }}>Loading circles…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>⭕</div>
          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{circles.length === 0 ? "No circles yet" : "No results"}</div>
          <div style={{ fontSize: "13px" }}>{circles.length === 0 ? "Create your first TCF Circle to start connecting members." : "Try a different search or filter."}</div>
          {circles.length === 0 && (
            <button onClick={() => setModalCircle(false)} style={{ marginTop: "14px", padding: "9px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              + Create First Circle
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map((circle) => (
            <CircleCard key={circle.id} circle={circle} onClick={() => setModalCircle(circle)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalCircle !== null && (
        <CircleModal
          circle={modalCircle || null}
          token={token}
          teamMembers={teamMembers}
          onClose={() => setModalCircle(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
