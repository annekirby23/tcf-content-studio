"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiFetch(path, opts = {}, token) {
  return fetch(path, {
    ...opts,
    headers: { "x-session": token, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff} days`;
}

function StarRating({ value, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ fontSize: 22, cursor: readOnly ? "default" : "pointer", color: n <= (hover || value || 0) ? "#F59E0B" : "#CBD5E1", lineHeight: 1 }}
        >★</span>
      ))}
      {readOnly && value && (
        <span style={{ fontSize: 12, color: C.muted, alignSelf: "center", marginLeft: 4 }}>
          {["","Poor","Fair","Good","Great","Excellent"][value]}
        </span>
      )}
    </div>
  );
}

function Avatar({ name, size = 26 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const initials = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div title={name} style={{ width: size, height: size, borderRadius: "50%", background: cols[Math.abs(h) % cols.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.36), fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const inputS = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.inputBg, color: C.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const labelS = { display: "block", fontSize: "11px", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 };

// ─── Event Form Modal (add / edit upcoming) ───────────────────────────────────

function EventFormModal({ initial, onSave, onCancel, teamMembers }) {
  const isNew = !initial?.id;
  const [name, setName] = useState(initial?.name || "");
  const [date, setDate] = useState(initial?.date || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [attendees, setAttendees] = useState(initial?.attendees || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  const toggleAttendee = (id) =>
    setAttendees((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Event name is required."); return; }
    setSaving(true); setError("");
    try {
      await onSave({ name, date, location, description, notes, attendees });
    } catch (e) {
      setError(e.message || "Save failed.");
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(620px,95vw)", maxHeight: "90vh", overflowY: "auto", background: C.card, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", zIndex: 3001, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>{isNew ? "Add Networking Event" : "Edit Event"}</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelS}>Event Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Downtown Business Mixer" style={inputS} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelS}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue or address" style={inputS} />
            </div>
          </div>

          <div>
            <label style={labelS}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is this event about?" style={{ ...inputS, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          <div>
            <label style={labelS}>Who&apos;s Going</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {teamMembers.map((m) => {
                const on = attendees.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleAttendee(m.id)}
                    style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accentLight : "none", color: on ? C.accentBright : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {on ? "✓ " : ""}{m.name}
                  </button>
                );
              })}
              {teamMembers.length === 0 && <span style={{ fontSize: 12, color: C.muted }}>No team members configured.</span>}
            </div>
          </div>

          <div>
            <label style={labelS}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Prep notes, what to bring, goals for this event…" style={{ ...inputS, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 10 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 18, marginTop: 18, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "Saving…" : isNew ? "Add Event" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Post-Event Modal (move to past + rate) ───────────────────────────────────

function PostEventModal({ event, onSave, onCancel }) {
  const [rating, setRating] = useState(event.rating || 0);
  const [update, setUpdate] = useState(event.postEventUpdate || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ rating, postEventUpdate: update, status: "past" }); }
    catch { setSaving(false); }
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(500px,95vw)", background: C.card, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", zIndex: 3001, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Move to Past Events</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>✕</button>
        </div>

        <div style={{ marginBottom: 18, padding: "12px 16px", background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{event.name}</div>
          {event.date && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{fmt(event.date)}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelS}>How was this event?</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelS}>Post-Event Update</label>
          <textarea
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            rows={4}
            autoFocus
            placeholder="What happened? Was it worth attending? Key connections made, takeaways, would you go again?"
            style={{ ...inputS, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "#10B981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Mark as Past"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Upcoming Event Card ──────────────────────────────────────────────────────

function UpcomingCard({ event, teamMembers, onEdit, onMarkPast, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const attendingMembers = teamMembers.filter((m) => (event.attendees || []).includes(m.id));
  const countdown = daysUntil(event.date);
  const isToday = countdown === "Today";
  const isSoon = typeof countdown === "string" && countdown.startsWith("In") && parseInt(countdown) <= 7;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow }}>
      {/* Top accent */}
      <div style={{ height: 4, background: isToday ? "#EF4444" : isSoon ? "#F59E0B" : C.accent }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{event.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {event.date && (
                <span style={{ fontSize: 12, color: C.muted }}>📅 {fmt(event.date)}</span>
              )}
              {countdown && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: isToday ? "rgba(239,68,68,0.12)" : isSoon ? "rgba(245,158,11,0.12)" : C.accentLight, color: isToday ? "#EF4444" : isSoon ? "#D97706" : C.accent }}>
                  {countdown}
                </span>
              )}
              {event.location && <span style={{ fontSize: 12, color: C.muted }}>📍 {event.location}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onEdit(event)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
            <button onClick={() => onMarkPast(event)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Done</button>
          </div>
        </div>

        {/* Attendees */}
        {attendingMembers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Going:</span>
            {attendingMembers.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 4px", borderRadius: 20, background: C.cardBg, border: `1px solid ${C.border}` }}>
                <Avatar name={m.name} size={18} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description preview */}
        {event.description && (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: expanded ? 0 : 4, display: expanded ? "block" : "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden" }}>
            {event.description}
          </div>
        )}

        {/* Expand / Notes */}
        {(event.description?.length > 120 || event.notes) && (
          <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}>
            {expanded ? "Show less ▲" : "Show more ▼"}
          </button>
        )}

        {expanded && event.notes && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 8, fontSize: 13, color: "#92400e", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            <span style={{ fontWeight: 700 }}>📝 Notes: </span>{event.notes}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 20px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.muted }}>Added by {event.createdBy}</span>
        <button onClick={() => onDelete(event.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}>🗑 Remove</button>
      </div>
    </div>
  );
}

// ─── Past Event Card ──────────────────────────────────────────────────────────

function PastCard({ event, teamMembers, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const attendingMembers = teamMembers.filter((m) => (event.attendees || []).includes(m.id));
  const ratingColor = event.rating >= 4 ? "#10B981" : event.rating >= 3 ? "#F59E0B" : event.rating ? "#EF4444" : C.muted;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow }}>
      <div style={{ height: 4, background: ratingColor }} />

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{event.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {event.date && <span style={{ fontSize: 12, color: C.muted }}>📅 {fmt(event.date)}</span>}
              {event.location && <span style={{ fontSize: 12, color: C.muted }}>📍 {event.location}</span>}
            </div>
          </div>
          <button onClick={() => onEdit(event)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>✏️ Edit</button>
        </div>

        {/* Rating */}
        {event.rating ? (
          <div style={{ marginBottom: 8 }}>
            <StarRating value={event.rating} readOnly />
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginBottom: 8 }}>No rating yet</div>
        )}

        {/* Post-event update */}
        {event.postEventUpdate && (
          <div style={{ marginBottom: 8, padding: "10px 12px", background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap", display: expanded ? "block" : "-webkit-box", WebkitLineClamp: expanded ? "unset" : 3, WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden" }}>
            {event.postEventUpdate}
          </div>
        )}

        {((event.postEventUpdate?.length > 180) || event.notes || attendingMembers.length > 0) && (
          <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: "2px 0", fontFamily: "inherit" }}>
            {expanded ? "Show less ▲" : "Show more ▼"}
          </button>
        )}

        {expanded && (
          <>
            {attendingMembers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Attended:</span>
                {attendingMembers.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 4px", borderRadius: 20, background: C.cardBg, border: `1px solid ${C.border}` }}>
                    <Avatar name={m.name} size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</span>
                  </div>
                ))}
              </div>
            )}
            {event.notes && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 8, fontSize: 13, color: "#92400e", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                <span style={{ fontWeight: 700 }}>📝 Notes: </span>{event.notes}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: "8px 20px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.muted }}>Added by {event.createdBy}</span>
        <button onClick={() => onDelete(event.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}>🗑 Remove</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NetworkingView({ token, currentUser, teamMembers = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [postEventTarget, setPostEventTarget] = useState(null);
  const [tab, setTab] = useState("upcoming"); // "upcoming" | "past"

  useEffect(() => {
    apiFetch("/api/networking", {}, token)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const upcoming = events.filter((e) => e.status === "upcoming").sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const past = events.filter((e) => e.status === "past").sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  async function handleSave(data) {
    if (editingEvent?.id) {
      const res = await apiFetch("/api/networking", { method: "PUT", body: JSON.stringify({ id: editingEvent.id, ...data }) }, token);
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
    } else {
      const res = await apiFetch("/api/networking", { method: "POST", body: JSON.stringify(data) }, token);
      if (!res.ok) throw new Error("Save failed");
      const created = await res.json();
      setEvents((prev) => [created, ...prev]);
    }
    setShowForm(false);
    setEditingEvent(null);
  }

  async function handlePostEvent(data) {
    const res = await apiFetch("/api/networking", { method: "PUT", body: JSON.stringify({ id: postEventTarget.id, ...data }) }, token);
    if (!res.ok) throw new Error("Save failed");
    const updated = await res.json();
    setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
    setPostEventTarget(null);
    setTab("past");
  }

  async function handleDelete(id) {
    if (!confirm("Remove this event?")) return;
    await apiFetch(`/api/networking?id=${id}`, { method: "DELETE" }, token);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function openEdit(event) {
    setEditingEvent(event);
    setShowForm(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px" }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>🤝 Networking Events</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Track who&apos;s going, log how it went, and spot the events worth returning to.</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          + Add Event
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {[
          { id: "upcoming", label: `Upcoming (${upcoming.length})` },
          { id: "past",     label: `Past Events (${past.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? C.accentBright : C.muted, borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`, marginBottom: -1, transition: "all 0.12s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: 14 }}>Loading events…</div>
      ) : tab === "upcoming" ? (
        upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: C.card, borderRadius: 16, border: `1px dashed ${C.border}`, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No upcoming events</div>
            <div style={{ fontSize: 13 }}>Click &ldquo;+ Add Event&rdquo; to log the next networking opportunity.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
            {upcoming.map((event) => (
              <UpcomingCard
                key={event.id}
                event={event}
                teamMembers={teamMembers}
                onEdit={openEdit}
                onMarkPast={setPostEventTarget}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        past.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: C.card, borderRadius: 16, border: `1px dashed ${C.border}`, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No past events yet</div>
            <div style={{ fontSize: 13 }}>Once you mark an upcoming event as done, it will appear here with your notes and rating.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
            {past.map((event) => (
              <PastCard
                key={event.id}
                event={event}
                teamMembers={teamMembers}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      )}

      {showForm && (
        <EventFormModal
          initial={editingEvent}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          teamMembers={teamMembers}
        />
      )}

      {postEventTarget && (
        <PostEventModal
          event={postEventTarget}
          onSave={handlePostEvent}
          onCancel={() => setPostEventTarget(null)}
        />
      )}
    </div>
  );
}
