"use client";

import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: C.muted,
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "6px",
};

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
    fontFamily: "inherit",
    ...extra,
  };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function avatarColor(name = "") {
  const palette = ["#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function Avatar({ name, size = 28 }) {
  const bg = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, width = 520 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Checklist Modal ───────────────────────────────────────────────────────────
function ChecklistModal({ checklist, teamMembers, token, onSave, onDelete, onClose }) {
  const isNew = !checklist?.id;
  const [title, setTitle] = useState(checklist?.title || "");
  const [location, setLocation] = useState(checklist?.location || "");
  const [type, setType] = useState(checklist?.type || "open");
  const [assignedMemberId, setAssignedMemberId] = useState(checklist?.assignedMemberId || "");
  const [assignedMemberName, setAssignedMemberName] = useState(checklist?.assignedMemberName || "");
  const [items, setItems] = useState(checklist?.items || []);
  const [notes, setNotes] = useState(checklist?.notes || "");
  const [newItemText, setNewItemText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleMemberChange(e) {
    const val = e.target.value;
    if (!val) {
      setAssignedMemberId("");
      setAssignedMemberName("");
    } else {
      const member = teamMembers.find((m) => m.id === val);
      setAssignedMemberId(val);
      setAssignedMemberName(member ? member.name : "");
    }
  }

  function addItem() {
    if (!newItemText.trim()) return;
    setItems((prev) => [...prev, { id: genId(), text: newItemText.trim() }]);
    setNewItemText("");
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = { title, location, type, assignedMemberId, assignedMemberName, items, notes };
    try {
      if (isNew) {
        const res = await apiFetch("/api/dailyops", { method: "POST", body: JSON.stringify(payload) }, token);
        const data = await res.json();
        onSave(data, true);
      } else {
        const res = await apiFetch(`/api/dailyops/${checklist.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        const data = await res.json();
        onSave(data, false);
      }
      onClose();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this checklist?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/dailyops/${checklist.id}`, { method: "DELETE" }, token);
      onDelete(checklist.id);
      onClose();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isNew ? "New Checklist" : "Edit Checklist"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Morning Open Checklist" />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Main Floor" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
              {["open", "close"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${type === t ? (t === "open" ? "#10B981" : "#8B5CF6") : C.border}`, background: type === t ? (t === "open" ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)") : "none", color: type === t ? (t === "open" ? "#10B981" : "#8B5CF6") : C.muted, fontWeight: "700", fontSize: "12px", cursor: "pointer", textTransform: "capitalize" }}
                >
                  {t === "open" ? "🌅 Open" : "🌙 Close"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Assigned Team Member</label>
          <select value={assignedMemberId} onChange={handleMemberChange} style={textInput({ width: "100%" })}>
            <option value="">— Unassigned —</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Checklist Items</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                <span style={{ flex: 1, fontSize: "13px", color: C.text }}>{item.text}</span>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
              style={textInput({ flex: 1 })}
              placeholder="Add item and press Enter or +"
            />
            <button onClick={addItem} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontWeight: "700", fontSize: "18px", cursor: "pointer" }}>+</button>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Additional notes or instructions…" />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={deleting} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: saving || !title.trim() ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Checklist Card ────────────────────────────────────────────────────────────
function ChecklistCard({ checklist, onClick }) {
  const [hov, setHov] = useState(false);
  const isOpen = checklist.type === "open";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.cardHov : C.card, border: `1px solid ${hov ? C.accent : C.border}`, borderRadius: "14px", padding: "18px", cursor: "pointer", boxShadow: hov ? C.shadowMd : C.shadow, transition: "all 0.15s" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, lineHeight: 1.3 }}>{checklist.title}</h4>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {checklist.location && (
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: C.accentLight, color: C.accent, fontWeight: "600" }}>{checklist.location}</span>
          )}
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: isOpen ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)", color: isOpen ? "#10B981" : "#8B5CF6", fontWeight: "700" }}>
            {isOpen ? "🌅 Open" : "🌙 Close"}
          </span>
        </div>
      </div>

      {checklist.assignedMemberName && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Avatar name={checklist.assignedMemberName} size={22} />
          <span style={{ fontSize: "12px", color: C.muted }}>{checklist.assignedMemberName}</span>
        </div>
      )}

      {checklist.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {checklist.items.slice(0, 4).map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `1px solid ${C.border}`, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: C.muted }}>{item.text}</span>
            </div>
          ))}
          {checklist.items.length > 4 && (
            <span style={{ fontSize: "11px", color: C.muted, marginLeft: "21px" }}>+{checklist.items.length - 4} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reference Card ────────────────────────────────────────────────────────────
// ── Block-style step editor ───────────────────────────────────────────────────
function StepListEditor({ steps, onChange }) {
  const addStep = () => onChange([...steps, ""]);
  const update = (i, val) => { const n = [...steps]; n[i] = val; onChange(n); };
  const remove = (i) => onChange(steps.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const n = [...steps];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "10px" }}>
            <button onClick={() => move(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? C.border : C.muted, fontSize: "10px", lineHeight: 1, padding: "1px 3px" }}>▲</button>
            <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} style={{ background: "none", border: "none", cursor: i === steps.length - 1 ? "default" : "pointer", color: i === steps.length - 1 ? C.border : C.muted, fontSize: "10px", lineHeight: 1, padding: "1px 3px" }}>▼</button>
          </div>
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: C.accent, color: "#fff", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "8px" }}>
            {i + 1}
          </div>
          <textarea
            value={step}
            onChange={(e) => update(i, e.target.value)}
            rows={2}
            style={{ ...textInput({ flex: 1, resize: "vertical", lineHeight: "1.6", fontFamily: "inherit" }) }}
            placeholder={`Step ${i + 1} — describe this step clearly…`}
          />
          <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "15px", paddingTop: "10px", lineHeight: 1, flexShrink: 0 }} title="Remove step">✕</button>
        </div>
      ))}
      <button
        onClick={addStep}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: `1px dashed ${C.accent}`, background: `${C.accent}10`, color: C.accent, fontSize: "13px", fontWeight: "600", cursor: "pointer", marginTop: "4px" }}
      >
        + Add Step
      </button>
    </div>
  );
}

function ReferenceCard({ sectionKey, icon, title, data, isAdmin, token, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");
  const [draftSteps, setDraftSteps] = useState([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftDesc(data?.description || "");
    setDraftSteps(Array.isArray(data?.steps) ? [...data.steps] : []);
    setDraftNotes(data?.notes || "");
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const steps = draftSteps.map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch("/api/dailyops/reference", {
        method: "PUT",
        body: JSON.stringify({ [sectionKey]: { description: draftDesc, steps, notes: draftNotes } }),
      }, token);
      const updated = await res.json();
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const hasContent = data?.description || steps.length > 0 || data?.notes;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: C.shadow }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: C.cardBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>{title}</h3>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>✏️ Edit</button>
        )}
      </div>

      {editing ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Overview */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "3px", height: "16px", background: C.accent, borderRadius: "2px" }} />
              <label style={{ ...labelStyle, margin: 0 }}>Overview / Description</label>
            </div>
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={4}
              style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }) }}
              placeholder="Provide context or an overview for the team. Supports paragraphs and line breaks."
            />
          </div>

          {/* Steps */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ width: "3px", height: "16px", background: "#10B981", borderRadius: "2px" }} />
              <label style={{ ...labelStyle, margin: 0 }}>Step-by-Step Process</label>
            </div>
            <StepListEditor steps={draftSteps} onChange={setDraftSteps} />
          </div>

          {/* Notes */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "3px", height: "16px", background: "#F59E0B", borderRadius: "2px" }} />
              <label style={{ ...labelStyle, margin: 0 }}>💡 Notes & Tips</label>
            </div>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={3}
              style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }), background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.3)" }}
              placeholder="Add any tips, reminders, or exceptions the team should know about…"
            />
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <button onClick={() => setEditing(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : hasContent ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Overview block */}
          {data?.description && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "3px", height: "14px", background: C.accent, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Overview</span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.75", whiteSpace: "pre-wrap" }}>{data.description}</p>
            </div>
          )}

          {/* Steps block */}
          {steps.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "3px", height: "14px", background: "#10B981", borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Process</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10B981", color: "#fff", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.65", whiteSpace: "pre-wrap", paddingTop: "3px" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes callout */}
          {data?.notes && (
            <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px" }}>💡</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.07em" }}>Notes & Tips</span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#92400E", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{data.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: C.muted, fontStyle: "italic" }}>{isAdmin ? "Click Edit to add content." : "No content yet."}</p>
        </div>
      )}
    </div>
  );
}

// ── Email Template Modal ──────────────────────────────────────────────────────
function EmailTemplateModal({ template, token, onSave, onDelete, onClose, allTemplates }) {
  const isNew = !template?.id;
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !subject.trim()) return;
    setSaving(true);
    try {
      let updated;
      if (isNew) {
        const newTpl = { id: genId(), name: name.trim(), subject: subject.trim(), body: body.trim() };
        updated = [...allTemplates, newTpl];
      } else {
        updated = allTemplates.map((t) => t.id === template.id ? { ...t, name: name.trim(), subject: subject.trim(), body: body.trim() } : t);
      }
      const res = await apiFetch("/api/dailyops/reference", { method: "PUT", body: JSON.stringify({ communication: updated }) }, token);
      const data = await res.json();
      onSave(data);
      onClose();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this email template?")) return;
    const updated = allTemplates.filter((t) => t.id !== template.id);
    const res = await apiFetch("/api/dailyops/reference", { method: "PUT", body: JSON.stringify({ communication: updated }) }, token);
    const data = await res.json();
    onSave(data);
    onClose();
  }

  return (
    <Modal onClose={onClose} title={isNew ? "New Email Template" : "Edit Template"} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Template Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Welcome Email" />
        </div>
        <div>
          <label style={labelStyle}>Subject *</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={textInput({ width: "100%" })} placeholder="Email subject line" />
        </div>
        <div>
          <label style={labelStyle}>Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} style={textInput({ width: "100%", resize: "vertical", lineHeight: "1.6" })} placeholder="Email body text…" />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {!isNew && <button onClick={handleDelete} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #EF4444", background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Delete</button>}
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim() || !subject.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Email Template Card ───────────────────────────────────────────────────────
function EmailTemplateCard({ template, isAdmin, onEdit }) {
  const [copied, setCopied] = useState(false);
  const [hov, setHov] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(template.body || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? C.cardBg : C.card, border: `1px solid ${hov ? C.accent : C.border}`, borderRadius: "12px", padding: "16px", boxShadow: C.shadow, transition: "all 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "14px", color: C.text }}>{template.name}</div>
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>{template.subject}</div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button onClick={handleCopy} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: copied ? "rgba(16,185,129,0.1)" : "none", color: copied ? "#10B981" : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button onClick={onEdit} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>✏️ Edit</button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "12px", color: C.muted, lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {template.body}
      </p>
    </div>
  );
}

// ── Mail & Packages Tab ───────────────────────────────────────────────────────
const MAIL_LOCATIONS_DEFAULT = [
  { id: "321", name: "321", assignedMemberId: "", assignedMemberName: "", mailboxes: [] },
  { id: "342", name: "342", assignedMemberId: "", assignedMemberName: "", mailboxes: [] },
  { id: "812", name: "812", assignedMemberId: "", assignedMemberName: "", mailboxes: [] },
];

const LOCATION_ACCENT = { "321": "#3B82F6", "342": "#10B981", "812": "#8B5CF6" };

function MailPackagesTab({ token, currentUser, teamMembers, reference, setReference }) {
  const isAdmin = currentUser?.role === "admin";

  const [locations, setLocations] = useState(() => {
    const existing = reference?.mailLocations;
    if (existing && existing.length === 3) return existing;
    // Merge existing data into defaults (preserve any partial saves)
    return MAIL_LOCATIONS_DEFAULT.map((def) => {
      const found = (existing || []).find((l) => l.id === def.id);
      return found ? { ...def, ...found } : def;
    });
  });
  const [saving, setSaving] = useState(false);
  const [editingHowTo, setEditingHowTo] = useState(false);
  const [howToSaving, setHowToSaving] = useState(false);
  const [howToDesc, setHowToDesc] = useState(reference?.mail?.description || "");
  const [howToSteps, setHowToSteps] = useState(Array.isArray(reference?.mail?.steps) ? reference.mail.steps : []);
  const [howToNotes, setHowToNotes] = useState(reference?.mail?.notes || "");
  const [howToCollapsed, setHowToCollapsed] = useState(false);
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);
  const [stepsCollapsed, setStepsCollapsed] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);

  // Keep local state in sync when reference changes from outside
  useEffect(() => {
    const existing = reference?.mailLocations;
    if (!existing || existing.length === 0) return;
    setLocations(
      MAIL_LOCATIONS_DEFAULT.map((def) => {
        const found = existing.find((l) => l.id === def.id);
        return found ? { ...def, ...found } : def;
      })
    );
  }, [reference]);

  async function save(updatedLocations) {
    setSaving(true);
    try {
      const res = await apiFetch(
        "/api/dailyops/reference",
        { method: "PUT", body: JSON.stringify({ mailLocations: updatedLocations }) },
        token
      );
      const data = await res.json();
      setReference(data);
      setLocations(
        MAIL_LOCATIONS_DEFAULT.map((def) => {
          const found = (data.mailLocations || []).find((l) => l.id === def.id);
          return found ? { ...def, ...found } : def;
        })
      );
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveHowTo() {
    setHowToSaving(true);
    try {
      const steps = howToSteps.map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch(
        "/api/dailyops/reference",
        { method: "PUT", body: JSON.stringify({ mail: { description: howToDesc, steps, notes: howToNotes } }) },
        token
      );
      const data = await res.json();
      setReference(data);
      setEditingHowTo(false);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setHowToSaving(false);
    }
  }

  function updateLocation(locId, patch) {
    const updated = locations.map((l) => (l.id === locId ? { ...l, ...patch } : l));
    setLocations(updated);
    save(updated);
  }

  function handleMemberChange(locId, memberId) {
    const member = teamMembers.find((m) => m.id === memberId);
    updateLocation(locId, {
      assignedMemberId: memberId,
      assignedMemberName: member ? member.name : "",
    });
  }

  function addMailbox(locId) {
    const updated = locations.map((l) => {
      if (l.id !== locId) return l;
      return {
        ...l,
        mailboxes: [
          ...l.mailboxes,
          { id: genId(), number: "", contact: "", googleBizProfile: false, signCreated: false, crizDetails: "", memberAlerted: false },
        ],
      };
    });
    setLocations(updated);
    save(updated);
  }

  function deleteMailbox(locId, boxId) {
    const updated = locations.map((l) => {
      if (l.id !== locId) return l;
      return { ...l, mailboxes: l.mailboxes.filter((b) => b.id !== boxId) };
    });
    setLocations(updated);
    save(updated);
  }

  function updateMailbox(locId, boxId, patch) {
    const updated = locations.map((l) => {
      if (l.id !== locId) return l;
      return { ...l, mailboxes: l.mailboxes.map((b) => (b.id === boxId ? { ...b, ...patch } : b)) };
    });
    setLocations(updated);
    save(updated);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: C.text }}>📬 Mail & Packages</h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Manage mailbox assignments per location.</p>
        </div>
        {saving && <span style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>Saving…</span>}
      </div>

      {/* How To Process Mail — collapsible with sub-cards */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
        {/* Outer header — always visible */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: C.cardBg, borderBottom: howToCollapsed ? "none" : `1px solid ${C.border}`, cursor: "pointer", userSelect: "none" }}
          onClick={() => { if (!editingHowTo) setHowToCollapsed((v) => !v); }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <span style={{ fontSize: "15px", fontWeight: "800", color: C.text }}>How To Process Mail</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            {!editingHowTo && !howToCollapsed && (
              <button
                onClick={() => { setHowToDesc(reference?.mail?.description || ""); setHowToSteps(Array.isArray(reference?.mail?.steps) ? [...reference.mail.steps] : []); setHowToNotes(reference?.mail?.notes || ""); setEditingHowTo(true); }}
                style={{ padding: "5px 11px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >✏️ Edit</button>
            )}
            <span
              onClick={() => { if (!editingHowTo) setHowToCollapsed((v) => !v); }}
              style={{ fontSize: "13px", fontWeight: "800", color: C.muted, cursor: "pointer", width: "20px", textAlign: "center" }}
            >{howToCollapsed ? "+" : "−"}</span>
          </div>
        </div>

        {!howToCollapsed && (
          editingHowTo ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "3px", height: "16px", background: C.accent, borderRadius: "2px" }} />
                  <label style={{ ...labelStyle, margin: 0 }}>Overview / Description</label>
                </div>
                <textarea autoFocus value={howToDesc} onChange={(e) => setHowToDesc(e.target.value)} rows={4}
                  style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }) }}
                  placeholder="Describe the mail process — context, key points, any general rules…" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ width: "3px", height: "16px", background: "#10B981", borderRadius: "2px" }} />
                  <label style={{ ...labelStyle, margin: 0 }}>Step-by-Step Process</label>
                </div>
                <StepListEditor steps={howToSteps} onChange={setHowToSteps} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "3px", height: "16px", background: "#F59E0B", borderRadius: "2px" }} />
                  <label style={{ ...labelStyle, margin: 0 }}>💡 Notes & Tips</label>
                </div>
                <textarea value={howToNotes} onChange={(e) => setHowToNotes(e.target.value)} rows={3}
                  style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }), background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.3)" }}
                  placeholder="Edge cases, reminders, or tips for the team…" />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setEditingHowTo(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveHowTo} disabled={howToSaving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: howToSaving ? 0.6 : 1 }}>{howToSaving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          ) : (reference?.mail?.description || (Array.isArray(reference?.mail?.steps) && reference.mail.steps.length > 0) || reference?.mail?.notes) ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Overview sub-card */}
              {reference?.mail?.description && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    onClick={() => setOverviewCollapsed((v) => !v)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.cardBg, cursor: "pointer", userSelect: "none", borderBottom: overviewCollapsed ? "none" : `1px solid ${C.border}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "3px", height: "13px", background: C.accent, borderRadius: "2px" }} />
                      <span style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>📖 Overview</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: C.muted }}>{overviewCollapsed ? "+" : "−"}</span>
                  </div>
                  {!overviewCollapsed && (
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.75", whiteSpace: "pre-wrap" }}>{reference.mail.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Steps sub-card */}
              {Array.isArray(reference?.mail?.steps) && reference.mail.steps.length > 0 && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    onClick={() => setStepsCollapsed((v) => !v)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.cardBg, cursor: "pointer", userSelect: "none", borderBottom: stepsCollapsed ? "none" : `1px solid ${C.border}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "3px", height: "13px", background: "#10B981", borderRadius: "2px" }} />
                      <span style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>✅ Step-by-Step Process</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: C.muted }}>{stepsCollapsed ? "+" : "−"}</span>
                  </div>
                  {!stepsCollapsed && (
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {reference.mail.steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#10B981", color: "#fff", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                          <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.65", whiteSpace: "pre-wrap", paddingTop: "2px" }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes sub-card */}
              {reference?.mail?.notes && (
                <div style={{ border: "1px solid rgba(245,158,11,0.35)", borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    onClick={() => setNotesCollapsed((v) => !v)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(245,158,11,0.06)", cursor: "pointer", userSelect: "none", borderBottom: notesCollapsed ? "none" : "1px solid rgba(245,158,11,0.25)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px" }}>💡</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.07em" }}>Notes & Tips</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#B45309" }}>{notesCollapsed ? "+" : "−"}</span>
                  </div>
                  {!notesCollapsed && (
                    <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.04)" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "#92400E", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{reference.mail.notes}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div style={{ padding: "24px 20px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: C.muted, fontStyle: "italic" }}>{"Click Edit to add mail processing instructions."}</p>
            </div>
          )
        )}
      </div>

      {locations.map((loc) => {
        const accent = LOCATION_ACCENT[loc.id] || C.accent;
        return (
          <div
            key={loc.id}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "16px",
              borderLeft: `4px solid ${accent}`,
            }}
          >
            {/* Location Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text, minWidth: "60px" }}>📍 {loc.name}</h4>

              {isAdmin ? (
                <select
                  value={loc.assignedMemberId}
                  onChange={(e) => handleMemberChange(loc.id, e.target.value)}
                  style={textInput({ fontSize: "13px", padding: "6px 10px", minWidth: "160px" })}
                >
                  <option value="">— Assign team member —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : loc.assignedMemberName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "4px 10px 4px 6px" }}>
                  <Avatar name={loc.assignedMemberName} size={22} />
                  <span style={{ fontSize: "12px", color: C.text, fontWeight: "600" }}>{loc.assignedMemberName}</span>
                </div>
              ) : null}

              {loc.assignedMemberName && isAdmin && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "4px 10px 4px 6px" }}>
                  <Avatar name={loc.assignedMemberName} size={20} />
                  <span style={{ fontSize: "12px", color: C.text, fontWeight: "600" }}>{loc.assignedMemberName}</span>
                </div>
              )}

              <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", background: `${accent}20`, color: accent }}>
                {loc.mailboxes.length} mailbox{loc.mailboxes.length !== 1 ? "es" : ""}
              </span>
            </div>

            {/* Mailbox Rows */}
            {loc.mailboxes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: "13px", fontStyle: "italic", background: C.cardBg, borderRadius: "10px", marginBottom: "12px" }}>
                No mailboxes yet. Click &ldquo;+ Add Mailbox&rdquo; below.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0px", marginBottom: "12px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${C.border}` }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: loc.id === "812" ? "1fr 1.5fr auto auto 1.5fr auto auto" : "1fr 1.5fr auto auto auto", gap: "8px", padding: "8px 12px", background: C.cardBg, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ ...labelStyle, margin: 0 }}>Mailbox #</span>
                  <span style={{ ...labelStyle, margin: 0 }}>Contact</span>
                  <span style={{ ...labelStyle, margin: 0 }}>GBP</span>
                  <span style={{ ...labelStyle, margin: 0 }}>Sign</span>
                  {loc.id === "812" && <span style={{ ...labelStyle, margin: 0, color: "#8B5CF6" }}>CRIZ Details</span>}
                  {loc.id === "812" && <span style={{ ...labelStyle, margin: 0, color: "#8B5CF6" }}>Alerted</span>}
                  <span style={{ ...labelStyle, margin: 0 }}></span>
                </div>

                {loc.mailboxes.map((box, idx) => (
                  <div
                    key={box.id}
                    style={{
                      background: idx % 2 === 0 ? C.card : C.cardBg,
                      borderBottom: idx < loc.mailboxes.length - 1 ? `1px solid ${C.border}` : "none",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: loc.id === "812" ? "1fr 1.5fr auto auto 1.5fr auto auto" : "1fr 1.5fr auto auto auto", gap: "8px", padding: "10px 12px", alignItems: "center" }}>
                      {/* Mailbox number */}
                      <input
                        value={box.number}
                        onChange={(e) => updateMailbox(loc.id, box.id, { number: e.target.value })}
                        onBlur={() => save(locations)}
                        style={textInput({ fontSize: "13px", padding: "6px 8px", width: "100%" })}
                        placeholder="# / Suite"
                      />

                      {/* Contact */}
                      <input
                        value={box.contact}
                        onChange={(e) => updateMailbox(loc.id, box.id, { contact: e.target.value })}
                        onBlur={() => save(locations)}
                        style={textInput({ fontSize: "13px", padding: "6px 8px", width: "100%" })}
                        placeholder="Contact name(s)"
                      />

                      {/* GBP checkbox */}
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={!!box.googleBizProfile}
                          onChange={(e) => updateMailbox(loc.id, box.id, { googleBizProfile: e.target.checked })}
                          style={{ accentColor: C.accent, width: "15px", height: "15px", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>GBP</span>
                      </label>

                      {/* Sign Created checkbox */}
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={!!box.signCreated}
                          onChange={(e) => updateMailbox(loc.id, box.id, { signCreated: e.target.checked })}
                          style={{ accentColor: C.accent, width: "15px", height: "15px", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>Sign</span>
                      </label>

                      {/* 812 CRIZ Details */}
                      {loc.id === "812" && (
                        <input
                          value={box.crizDetails || ""}
                          onChange={(e) => updateMailbox(loc.id, box.id, { crizDetails: e.target.value })}
                          onBlur={() => save(locations)}
                          style={textInput({ fontSize: "13px", padding: "6px 8px", width: "100%", background: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.3)" })}
                          placeholder="CRIZ details…"
                        />
                      )}

                      {/* 812 Member Alerted checkbox */}
                      {loc.id === "812" && (
                        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={!!box.memberAlerted}
                            onChange={(e) => updateMailbox(loc.id, box.id, { memberAlerted: e.target.checked })}
                            style={{ accentColor: "#8B5CF6", width: "15px", height: "15px", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "11px", color: "#8B5CF6", fontWeight: "600" }}>Alerted</span>
                        </label>
                      )}

                      {/* Delete button — admin only */}
                      {isAdmin && (
                        <button
                          onClick={() => deleteMailbox(loc.id, box.id)}
                          style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Remove mailbox"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Mailbox button */}
            <button
              onClick={() => addMailbox(loc.id)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `1px dashed ${accent}`, background: `${accent}10`, color: accent, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              + Add Mailbox
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "checklists", label: "📋 Checklists" },
  { id: "mail", label: "📬 Mail & Packages" },
  { id: "tours", label: "🚶 Tours" },
  { id: "communication", label: "✉️ Communication" },
  { id: "papercut", label: "🖨️ Papercut" },
  { id: "parking", label: "🅿️ Parking" },
  { id: "daypasser", label: "🎫 Day Passer" },
  { id: "guests", label: "👥 Guests" },
];

const REFERENCE_TABS = {
  tours: { icon: "🚶", title: "Tours" },
  papercut: { icon: "🖨️", title: "Papercut" },
  parking: { icon: "🅿️", title: "Parking" },
  daypasser: { icon: "🎫", title: "Day Passer" },
  guests: { icon: "👥", title: "Guests" },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function DailyOpsView({ token, currentUser, teamMembers = [] }) {
  const [activeTab, setActiveTab] = useState("checklists");
  const [checklists, setChecklists] = useState([]);
  const [reference, setReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [modalChecklist, setModalChecklist] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [emailTemplateModal, setEmailTemplateModal] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clRes, refRes] = await Promise.all([
        apiFetch("/api/dailyops", {}, token),
        apiFetch("/api/dailyops/reference", {}, token),
      ]);
      setChecklists(clRes.ok ? await clRes.json() : []);
      setReference(refRes.ok ? await refRes.json() : {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const locations = [...new Set(checklists.map((c) => c.location).filter(Boolean))];

  const filteredChecklists = checklists.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (locationFilter && c.location !== locationFilter) return false;
    return true;
  });

  function handleChecklistSave(updated, isNew) {
    if (isNew) setChecklists((prev) => [updated, ...prev]);
    else setChecklists((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

  function handleChecklistDelete(id) {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "24px", background: C.card, borderRadius: "12px", padding: "6px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: activeTab === tab.id ? C.accent : "none", color: activeTab === tab.id ? "#fff" : C.muted, fontSize: "13px", fontWeight: activeTab === tab.id ? "700" : "500", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>Loading…</div>}

      {!loading && activeTab === "checklists" && (
        <div>
          {/* Filters + Add */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["all", "open", "close"].map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: "7px 14px", borderRadius: "20px", border: `1px solid ${typeFilter === f ? C.accent : C.border}`, background: typeFilter === f ? C.accentLight : "none", color: typeFilter === f ? C.accent : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize" }}>
                  {f === "all" ? "All" : f === "open" ? "🌅 Open" : "🌙 Close"}
                </button>
              ))}
            </div>
            {locations.length > 0 && (
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ ...textInput({ padding: "7px 10px", fontSize: "12px" }) }}>
                <option value="">All Locations</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            )}
            <div style={{ flex: 1 }} />
            {isAdmin && (
              <button onClick={() => { setModalChecklist(null); setShowChecklistModal(true); }} style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>+ Add Checklist</button>
            )}
          </div>

          {filteredChecklists.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontSize: "15px", fontWeight: "600" }}>No checklists found</div>
              {isAdmin && <div style={{ fontSize: "13px", marginTop: "6px" }}>Click "+ Add Checklist" to create one.</div>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredChecklists.map((cl) => (
                <ChecklistCard key={cl.id} checklist={cl} onClick={() => { setModalChecklist(cl); setShowChecklistModal(true); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === "mail" && (
        <MailPackagesTab
          token={token}
          currentUser={currentUser}
          teamMembers={teamMembers}
          reference={reference}
          setReference={setReference}
        />
      )}

      {!loading && REFERENCE_TABS[activeTab] && (
        <ReferenceCard
          key={activeTab}
          sectionKey={activeTab}
          icon={REFERENCE_TABS[activeTab].icon}
          title={REFERENCE_TABS[activeTab].title}
          data={reference?.[activeTab]}
          isAdmin={isAdmin}
          token={token}
          onSaved={setReference}
        />
      )}

      {!loading && activeTab === "communication" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: C.text }}>Email Templates</h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Copy and use these templates for member communication.</p>
            </div>
            {isAdmin && (
              <button onClick={() => { setEmailTemplateModal(null); setShowEmailModal(true); }} style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>+ Add Template</button>
            )}
          </div>
          {(reference?.communication || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✉️</div>
              <div style={{ fontSize: "15px", fontWeight: "600" }}>No email templates yet</div>
              {isAdmin && <div style={{ fontSize: "13px", marginTop: "6px" }}>Click "+ Add Template" to create one.</div>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(reference?.communication || []).map((tpl) => (
                <EmailTemplateCard key={tpl.id} template={tpl} isAdmin={isAdmin} onEdit={() => { setEmailTemplateModal(tpl); setShowEmailModal(true); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checklist Modal */}
      {showChecklistModal && (
        <ChecklistModal
          checklist={modalChecklist}
          teamMembers={teamMembers}
          token={token}
          onSave={handleChecklistSave}
          onDelete={handleChecklistDelete}
          onClose={() => setShowChecklistModal(false)}
        />
      )}

      {/* Email Template Modal */}
      {showEmailModal && (
        <EmailTemplateModal
          template={emailTemplateModal}
          token={token}
          allTemplates={reference?.communication || []}
          onSave={setReference}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
