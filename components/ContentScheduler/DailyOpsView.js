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
function ReferenceCard({ sectionKey, icon, title, data, isAdmin, token, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ description: "", steps: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      description: data?.description || "",
      steps: Array.isArray(data?.steps) ? data.steps.join("\n") : (data?.steps || ""),
      notes: data?.notes || "",
    });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const steps = draft.steps.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch("/api/dailyops/reference", {
        method: "PUT",
        body: JSON.stringify({ [sectionKey]: { description: draft.description, steps, notes: draft.notes } }),
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

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px", boxShadow: C.shadow }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>{title}</h3>
        </div>
        {isAdmin && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>✏️ Edit</button>
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={3} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Overview or description…" />
          </div>
          <div>
            <label style={labelStyle}>Steps (one per line)</label>
            <textarea value={draft.steps} onChange={(e) => setDraft((d) => ({ ...d, steps: e.target.value }))} rows={5} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Step 1&#10;Step 2&#10;Step 3" />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} rows={2} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Additional notes…" />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <div>
          {data?.description && <p style={{ margin: "0 0 12px", fontSize: "14px", color: C.text, lineHeight: "1.7" }}>{data.description}</p>}
          {steps.length > 0 && (
            <ol style={{ margin: "0 0 12px", paddingLeft: "18px" }}>
              {steps.map((step, i) => (
                <li key={i} style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", marginBottom: "4px" }}>{step}</li>
              ))}
            </ol>
          )}
          {data?.notes && (
            <div style={{ background: C.cardBg, borderRadius: "8px", padding: "10px 14px", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Notes</span>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted, lineHeight: "1.6" }}>{data.notes}</p>
            </div>
          )}
          {!data?.description && steps.length === 0 && !data?.notes && (
            <p style={{ margin: 0, fontSize: "13px", color: C.muted, fontStyle: "italic" }}>{isAdmin ? "Click Edit to add content." : "No content yet."}</p>
          )}
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
          {isAdmin && <button onClick={onEdit} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>✏️ Edit</button>}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "12px", color: C.muted, lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {template.body}
      </p>
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
  mail: { icon: "📬", title: "Mail & Packages" },
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
