"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const STRIP_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#06B6D4", "#F97316", "#14B8A6"];

function stripColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return STRIP_COLORS[Math.abs(hash) % STRIP_COLORS.length];
}

function avatarColor(name = "") {
  const palette = ["#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const DEFAULT_STUBS = [
  { name: "Sweet Health", icon: "💪", tagline: "Gym & Fitness", description: "", howTo: "", waiverUrl: "", vendors: "", assignedMemberId: "", assignedMemberName: "", notes: "" },
  { name: "Jelly Bellies", icon: "🧒", tagline: "Child Care", description: "", howTo: "", waiverUrl: "", vendors: "", assignedMemberId: "", assignedMemberName: "", notes: "" },
  { name: "ROHO", icon: "🎉", tagline: "Social Club", description: "", howTo: "", waiverUrl: "", vendors: "", assignedMemberId: "", assignedMemberName: "", notes: "" },
  { name: "812 Media Studio", icon: "🎬", tagline: "Media & Recording", description: "", howTo: "", waiverUrl: "", vendors: "", assignedMemberId: "", assignedMemberName: "", notes: "" },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, width = 540 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Resource Modal ────────────────────────────────────────────────────────────
function ResourceModal({ resource, teamMembers, token, onSave, onDelete, onClose }) {
  const isNew = !resource?.id;
  const [name, setName] = useState(resource?.name || "");
  const [icon, setIcon] = useState(resource?.icon || "📦");
  const [tagline, setTagline] = useState(resource?.tagline || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [howTo, setHowTo] = useState(resource?.howTo || "");
  const [waiverUrl, setWaiverUrl] = useState(resource?.waiverUrl || "");
  const [vendors, setVendors] = useState(resource?.vendors || "");
  const [assignedMemberId, setAssignedMemberId] = useState(resource?.assignedMemberId || "");
  const [assignedMemberName, setAssignedMemberName] = useState(resource?.assignedMemberName || "");
  const [notes, setNotes] = useState(resource?.notes || "");
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

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name, icon, tagline, description, howTo, waiverUrl, vendors, assignedMemberId, assignedMemberName, notes };
    try {
      if (isNew) {
        const res = await apiFetch("/api/memberresources", { method: "POST", body: JSON.stringify(payload) }, token);
        const data = await res.json();
        onSave(data, true);
      } else {
        const res = await apiFetch(`/api/memberresources/${resource.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
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
    if (!confirm("Delete this resource?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/memberresources/${resource.id}`, { method: "DELETE" }, token);
      onDelete(resource.id);
      onClose();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isNew ? "New Resource" : "Edit Resource"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ width: "80px" }}>
            <label style={labelStyle}>Icon</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} style={textInput({ width: "100%", textAlign: "center", fontSize: "22px", padding: "6px" })} placeholder="📦" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Sweet Health" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Gym & Fitness" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={textInput({ width: "100%", resize: "vertical" })} placeholder="What is this resource and how does it benefit members?" />
        </div>
        <div>
          <label style={labelStyle}>How-To Instructions</label>
          <textarea value={howTo} onChange={(e) => setHowTo(e.target.value)} rows={4} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Step-by-step instructions for members to access this service…" />
        </div>
        <div>
          <label style={labelStyle}>Waiver URL</label>
          <input value={waiverUrl} onChange={(e) => setWaiverUrl(e.target.value)} style={textInput({ width: "100%" })} placeholder="https://…" />
        </div>
        <div>
          <label style={labelStyle}>Vendors / Contacts</label>
          <textarea value={vendors} onChange={(e) => setVendors(e.target.value)} rows={2} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Key contacts or vendors for this service…" />
        </div>
        <div>
          <label style={labelStyle}>Assigned Team Member</label>
          <select value={assignedMemberId} onChange={handleMemberChange} style={textInput({ width: "100%" })}>
            <option value="">— Unassigned —</option>
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Internal notes…" />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
          {!isNew && <button onClick={handleDelete} disabled={deleting} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #EF4444", background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>{deleting ? "Deleting…" : "Delete"}</button>}
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: saving || !name.trim() ? 0.6 : 1 }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── How-To Popover ────────────────────────────────────────────────────────────
function HowToPopover({ text }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!show) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
        style={{ padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
      >
        📋 How-To
      </button>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 100, background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 16px", boxShadow: C.shadowMd, minWidth: "260px", maxWidth: "320px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>How-To</div>
          <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text || "No instructions added yet."}</p>
        </div>
      )}
    </div>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, isAdmin, onClick }) {
  const [hov, setHov] = useState(false);
  const color = stripColor(resource.name);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: C.card, border: `1px solid ${hov ? C.accent : C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: hov ? C.shadowMd : C.shadow, transition: "all 0.15s", display: "flex", flexDirection: "column" }}
    >
      {/* Colored strip */}
      <div style={{ height: "6px", background: color }} />

      {/* Card body */}
      <div onClick={onClick} style={{ padding: "18px 18px 12px", flex: 1, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <span style={{ fontSize: "32px", lineHeight: 1 }}>{resource.icon}</span>
          <div>
            <div style={{ fontWeight: "800", fontSize: "15px", color: C.text }}>{resource.name}</div>
            {resource.tagline && <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>{resource.tagline}</div>}
          </div>
        </div>

        {resource.assignedMemberName && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", padding: "5px 10px", background: C.cardBg, borderRadius: "20px", width: "fit-content", border: `1px solid ${C.border}` }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: avatarColor(resource.assignedMemberName), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "9px", fontWeight: "700" }}>
              {initials(resource.assignedMemberName)}
            </div>
            <span style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>Managed by {resource.assignedMemberName}</span>
          </div>
        )}

        {resource.description && (
          <p style={{ margin: 0, fontSize: "13px", color: C.muted, lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {resource.description}
          </p>
        )}

        {!resource.description && (
          <p style={{ margin: 0, fontSize: "13px", color: C.muted, fontStyle: "italic" }}>
            {isAdmin ? "Click to add details." : "No description yet."}
          </p>
        )}
      </div>

      {/* Footer */}
      {(resource.waiverUrl || resource.howTo) && (
        <div onClick={(e) => e.stopPropagation()} style={{ padding: "10px 18px 14px", display: "flex", gap: "8px", borderTop: `1px solid ${C.border}` }}>
          {resource.waiverUrl && (
            <a href={resource.waiverUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.accent, textDecoration: "none", padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontWeight: "600" }}>🔗 Waiver</a>
          )}
          {resource.howTo && <HowToPopover text={resource.howTo} />}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemberResourcesView({ token, currentUser, teamMembers = [] }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modalResource, setModalResource] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/memberresources", {}, token);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // Seed defaults
          setSeeding(true);
          const seeded = [];
          for (const stub of DEFAULT_STUBS) {
            const r = await apiFetch("/api/memberresources", { method: "POST", body: JSON.stringify(stub) }, token);
            if (r.ok) seeded.push(await r.json());
          }
          setResources(seeded);
          setSeeding(false);
        } else {
          setResources(data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  function handleSave(updated, isNew) {
    if (isNew) setResources((prev) => [...prev, updated]);
    else setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  }

  function handleDelete(id) {
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading || seeding) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>
        {seeding ? "Setting up default resources…" : "Loading resources…"}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: C.text }}>Member Resources</h2>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: C.muted }}>Partner services and amenities available to TCF members.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setModalResource(null); setShowModal(true); }} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>+ Add Resource</button>
        )}
      </div>

      {/* Resource Grid */}
      {resources.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📦</div>
          <div style={{ fontSize: "15px", fontWeight: "600" }}>No resources yet</div>
          {isAdmin && <div style={{ fontSize: "13px", marginTop: "6px" }}>Click &ldquo;+ Add Resource&rdquo; to create one.</div>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              isAdmin={isAdmin}
              onClick={() => { if (isAdmin) { setModalResource(r); setShowModal(true); } }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ResourceModal
          resource={modalResource}
          teamMembers={teamMembers}
          token={token}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
