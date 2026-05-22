"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

const NEEDED_WHEN_OPTIONS = ["Next Amazon Order", "Wish List", "Weekly Order", "Next Trip", "ASAP"];
const ORDER_STATUS_OPTIONS = ["Not Started", "Ordered", "In Progress", "Received", "Cancelled"];
const LOCATION_OPTIONS = ["321", "342", "812"];

const NEEDED_COLORS = {
  "Next Amazon Order": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "Wish List":         { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "Weekly Order":      { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  "Next Trip":         { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "ASAP":              { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const STATUS_COLORS = {
  "Not Started": { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  "Ordered":     { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "In Progress": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "Received":    { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  "Cancelled":   { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function AvatarSmall({ name }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return <div style={{ width: 26, height: 26, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "700", flexShrink: 0 }}>{ini}</div>;
}

function Pill({ label, color, bg }) {
  if (!label) return null;
  return <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: bg, color, fontWeight: "700", whiteSpace: "nowrap" }}>{label}</span>;
}

// ─── Detail / Edit Modal ─────────────────────────────────────────────────────

function ItemDetailModal({ item, token, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "8px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/inventory", { method: "PUT", body: JSON.stringify(form) }, token);
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        onClose();
      }
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm("Delete this item?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/inventory?id=${item.id}`, { method: "DELETE" }, token);
      onDelete(item.id);
      onClose();
    } finally { setDeleting(false); }
  };

  const field = (label, key, type = "text", opts = null) => (
    <div>
      <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>{label}</label>
      {opts ? (
        <select value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={inputStyle}>
          <option value="">—</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }} />
      ) : (
        <input type={type} value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
      )}
    </div>
  );

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div style={{ background: C.card, borderRadius: "16px", boxShadow: C.shadowMd, width: "100%", maxWidth: "580px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: C.text }}>{item.itemName}</div>
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>Added by {item.personAdded} · {item.date}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", color: C.muted, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {field("Item Name", "itemName")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {field("Needed When", "neededWhen", "text", NEEDED_WHEN_OPTIONS)}
            {field("Status", "orderStatus", "text", ORDER_STATUS_OPTIONS)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {field("For What / Purpose", "forWhat")}
            {field("Location", "location", "text", LOCATION_OPTIONS)}
          </div>
          {field("URL / Order Link", "url")}
          {field("Notes", "notes", "textarea")}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={del} disabled={deleting} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #EF444440", background: "rgba(239,68,68,0.06)", color: "#EF4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Draggable Item Row ──────────────────────────────────────────────────────

function ItemRow({ item, idx, sectionItems, onDrop, onDragStart, dragOverId, setDragOverId, onClick, selected, onToggleSelect, onStatusChange }) {
  const stCfg = STATUS_COLORS[item.orderStatus] || STATUS_COLORS["Not Started"];
  const nwCfg = NEEDED_COLORS[item.neededWhen];
  const isDragOver = dragOverId === item.id;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(item.id); }}
      onDragOver={(e) => { e.preventDefault(); setDragOverId(item.id); }}
      onDragLeave={() => setDragOverId(null)}
      onDrop={(e) => { e.preventDefault(); onDrop(item.id); setDragOverId(null); }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "11px 16px",
        background: selected ? C.accentLight : isDragOver ? C.hover : "transparent",
        borderBottom: `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "background 0.1s",
        userSelect: "none",
      }}
      onMouseEnter={(e) => { if (!isDragOver && !selected) e.currentTarget.style.background = C.hover; }}
      onMouseLeave={(e) => { if (!isDragOver && !selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(item.id)}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "15px", height: "15px", flexShrink: 0, cursor: "pointer", accentColor: C.accent }}
      />

      {/* Drag handle */}
      <span
        style={{ fontSize: "14px", color: C.muted, opacity: 0.35, cursor: "grab", flexShrink: 0, padding: "0 2px" }}
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >⠿</span>

      {/* Item name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.itemName}</div>
        {item.forWhat && <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.forWhat}</div>}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {nwCfg && <Pill label={item.neededWhen} color={nwCfg.color} bg={nwCfg.bg} />}
        {/* Inline status dropdown */}
        <select
          value={item.orderStatus || "Not Started"}
          onChange={(e) => { e.stopPropagation(); onStatusChange(item.id, e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "20px",
            border: `1px solid ${stCfg.color}40`,
            background: stCfg.bg, color: stCfg.color,
            cursor: "pointer", outline: "none", appearance: "none",
            WebkitAppearance: "none", paddingRight: "16px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='${encodeURIComponent(stCfg.color)}' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center",
          }}
        >
          {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {item.location && <Pill label={`📍 ${item.location}`} color={C.muted} bg={C.cardBg} />}
      </div>

      {/* Person */}
      {item.personAdded && <AvatarSmall name={item.personAdded} />}

      {/* Link */}
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "14px", color: C.accent, textDecoration: "none", flexShrink: 0 }} title={item.url}>🔗</a>
      )}
    </div>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────

function SectionBlock({ title, emoji, accentColor, items, token, onItemUpdate, onItemDelete, onReorder, filterStatus, filterNeeded, filterLocation }) {
  const [dragItemId, setDragItemId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = items.filter((item) => {
    if (filterStatus && item.orderStatus !== filterStatus) return false;
    if (filterNeeded && item.neededWhen !== filterNeeded) return false;
    if (filterLocation && item.location !== filterLocation) return false;
    return true;
  });

  const handleDrop = (targetId) => {
    if (!dragItemId || dragItemId === targetId) return;
    const fromIdx = items.findIndex((i) => i.id === dragItemId);
    const toIdx = items.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);
    onReorder(newItems);
    setDragItemId(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((i) => next.delete(i.id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((i) => next.add(i.id)); return next; });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, orderStatus: newStatus };
    onItemUpdate(updated);
    if (detailItem?.id === id) setDetailItem(updated);
    try {
      await apiFetch("/api/inventory", { method: "PUT", body: JSON.stringify(updated) }, token);
    } catch {}
  };

  const handleBatchDelete = async () => {
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    ids.forEach((id) => onItemDelete(id));
    try {
      await Promise.all(ids.map((id) =>
        apiFetch(`/api/inventory?id=${id}`, { method: "DELETE" }, token)
      ));
    } catch {}
  };

  const selectedCount = filtered.filter((i) => selectedIds.has(i.id)).length;

  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);

  return (
    <>
      <div style={{ marginBottom: "32px", background: C.card, borderRadius: "16px", border: `2px solid rgba(${r},${g},${b},0.3)`, boxShadow: `0 2px 12px rgba(${r},${g},${b},0.1)`, overflow: "hidden" }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 22px", background: `rgba(${r},${g},${b},0.07)`, borderBottom: `2px solid rgba(${r},${g},${b},0.2)` }}>
          <div style={{ width: "5px", height: "36px", borderRadius: "3px", background: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: "22px" }}>{emoji}</span>
          <span style={{ fontSize: "17px", fontWeight: "800", color: C.text }}>{title}</span>
          <span style={{ fontSize: "12px", color: accentColor, padding: "3px 12px", borderRadius: "20px", background: `rgba(${r},${g},${b},0.15)`, fontWeight: "700", marginLeft: "auto" }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
            {filtered.length !== items.length ? ` (${filtered.length} shown)` : ""}
          </span>
        </div>

        {/* Batch-delete bar — visible when any items are checked */}
        {selectedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 16px", background: "#fff1f2", borderBottom: `1px solid #fca5a5` }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626", flex: 1 }}>
              {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ fontSize: "12px", color: C.muted, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
            >
              Clear
            </button>
            <button
              onClick={handleBatchDelete}
              style={{ fontSize: "12px", fontWeight: "700", color: "#fff", background: "#dc2626", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer" }}
            >
              🗑 Delete {selectedCount} item{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* Items */}
        {filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: "13px", fontStyle: "italic" }}>
            {items.length === 0 ? "No items yet — add one above." : "No items match the current filters."}
          </div>
        ) : (
          <div>
            {/* Column headers with select-all checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 16px", borderBottom: `1px solid ${C.border}`, background: C.cardBg }}>
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                style={{ width: "15px", height: "15px", flexShrink: 0, cursor: "pointer", accentColor: C.accent }}
                title="Select all"
              />
              <span style={{ width: "18px", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted }}>Item</span>
              <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted, minWidth: "200px", textAlign: "right" }}>When · Status · Location</span>
              <span style={{ width: "26px", flexShrink: 0 }} />
            </div>
            {filtered.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                idx={idx}
                sectionItems={filtered}
                onDragStart={setDragItemId}
                onDrop={handleDrop}
                dragOverId={dragOverId}
                setDragOverId={setDragOverId}
                onClick={() => setDetailItem(item)}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          token={token}
          onSave={(updated) => {
            onItemUpdate(updated);
            setDetailItem(updated);
          }}
          onDelete={(id) => { onItemDelete(id); setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; }); }}
          onClose={() => setDetailItem(null)}
        />
      )}
    </>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

function AddForm({ token, onAdd, onClose }) {
  const [orderType, setOrderType] = useState("recurring");
  const [form, setForm] = useState({ itemName: "", neededWhen: "", forWhat: "", orderStatus: "Not Started", location: "", notes: "", url: "" });
  const [saving, setSaving] = useState(false);

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  const save = async () => {
    if (!form.itemName.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/inventory", { method: "POST", body: JSON.stringify({ ...form, orderType }) }, token);
      if (res.ok) {
        const saved = await res.json();
        onAdd(saved);
        onClose();
      }
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "24px", boxShadow: C.shadow }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700", color: C.text }}>+ Add Inventory Item</h3>

      {/* Type picker */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { value: "recurring", emoji: "🔁", label: "Regular Supply", desc: "Ongoing orders" },
          { value: "purchase", emoji: "🛒", label: "One-Time Purchase", desc: "Equipment, furniture, etc." },
          { value: "roho", emoji: "🎉", label: "ROHO Supplies", desc: "ROHO Social Club supplies" },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setOrderType(opt.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: `2px solid ${orderType === opt.value ? C.accent : C.border}`, background: orderType === opt.value ? C.accentLight : C.cardBg, color: orderType === opt.value ? C.accent : C.muted, fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "left" }}>
            <div>{opt.emoji} {opt.label}</div>
            <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.7, marginTop: "2px" }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Item Name *</label>
          <input autoFocus value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} placeholder="What's needed?" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Needed When</label>
          <select value={form.neededWhen} onChange={(e) => setForm((f) => ({ ...f, neededWhen: e.target.value }))} style={inputStyle}>
            <option value="">Select…</option>
            {NEEDED_WHEN_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>For What</label>
          <input value={form.forWhat} onChange={(e) => setForm((f) => ({ ...f, forWhat: e.target.value }))} placeholder="Purpose…" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Status</label>
          <select value={form.orderStatus} onChange={(e) => setForm((f) => ({ ...f, orderStatus: e.target.value }))} style={inputStyle}>
            {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Location</label>
          <select value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} style={inputStyle}>
            <option value="">—</option>
            {LOCATION_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>URL / Link</label>
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Notes</label>
        <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        <button onClick={save} disabled={!form.itemName.trim() || saving} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", background: form.itemName.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: form.itemName.trim() ? "pointer" : "not-allowed" }}>
          {saving ? "Saving…" : "Add Item"}
        </button>
      </div>
    </div>
  );
}

// ─── Main InventoryView ──────────────────────────────────────────────────────

export default function InventoryView({ token, currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNeeded, setFilterNeeded] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const inputStyle = { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "12px", outline: "none", fontFamily: "inherit" };

  useEffect(() => {
    apiFetch("/api/inventory", {}, token)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const recurringItems = items.filter((i) => i.orderType !== "purchase" && i.orderType !== "roho");
  const purchaseItems = items.filter((i) => i.orderType === "purchase");
  const rohoItems = items.filter((i) => i.orderType === "roho");

  const handleReorder = async (sectionType, newSectionItems) => {
    // Merge the reordered section back into the full items array preserving the other sections
    const otherItems = items.filter((i) =>
      sectionType === "recurring" ? (i.orderType === "purchase" || i.orderType === "roho")
      : sectionType === "purchase" ? (i.orderType !== "purchase")
      : (i.orderType !== "roho")
    );
    const newItems = sectionType === "recurring"
      ? [...newSectionItems, ...otherItems]
      : [...otherItems, ...newSectionItems];
    setItems(newItems);
    // Persist full reordered array
    try {
      await apiFetch("/api/inventory", { method: "PUT", body: JSON.stringify({ bulkReorder: newItems.map((i) => i.id) }) }, token);
    } catch {}
  };

  const handleItemUpdate = (updated) => {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  const handleItemDelete = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAdd = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
    setShowAdd(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "60px", color: C.muted }}>Loading inventory…</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1060px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: C.text }}>📦 Inventory</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Track supplies and orders. Click any item to view or edit details. Drag ⠿ to reorder.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterNeeded} onChange={(e) => setFilterNeeded(e.target.value)} style={inputStyle}>
          <option value="">All Timings</option>
          {NEEDED_WHEN_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ display: "flex", gap: "4px" }}>
          {[["All", ""], ["321", "321"], ["342", "342"], ["812", "812"]].map(([lbl, val]) => (
            <button key={val} onClick={() => setFilterLocation(val)} style={{ padding: "5px 10px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600", background: filterLocation === val ? C.accent : C.cardBg, color: filterLocation === val ? "#fff" : C.muted }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAdd((v) => !v)} style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: showAdd ? C.border : C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
          {showAdd ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {showAdd && <AddForm token={token} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {/* Two separate sections */}
      <SectionBlock
        title="Regular Supply Orders"
        emoji="🔁"
        accentColor="#10B981"
        items={recurringItems}
        token={token}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onReorder={(newItems) => handleReorder("recurring", newItems)}
        filterStatus={filterStatus}
        filterNeeded={filterNeeded}
        filterLocation={filterLocation}
      />

      <SectionBlock
        title="One-Time Purchases"
        emoji="🛒"
        accentColor="#F59E0B"
        items={purchaseItems}
        token={token}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onReorder={(newItems) => handleReorder("purchase", newItems)}
        filterStatus={filterStatus}
        filterNeeded={filterNeeded}
        filterLocation={filterLocation}
      />

      <SectionBlock
        title="ROHO Supplies"
        emoji="🎉"
        accentColor="#EC4899"
        items={rohoItems}
        token={token}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onReorder={(newItems) => handleReorder("roho", newItems)}
        filterStatus={filterStatus}
        filterNeeded={filterNeeded}
        filterLocation={filterLocation}
      />
    </div>
  );
}
