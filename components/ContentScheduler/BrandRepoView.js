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

const CATEGORIES = [
  { id: "logo", label: "🎨 Logo Files", color: "#6366F1" },
  { id: "link", label: "🔗 Links & Accounts", color: "#3B82F6" },
  { id: "collateral", label: "🖨️ Print Collateral", color: "#F59E0B" },
  { id: "other", label: "📦 Other Assets", color: "#10B981" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, width = 520 }) {
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

// ── BrandItem Modal ───────────────────────────────────────────────────────────
function BrandItemModal({ item, token, onSave, onDelete, onClose, defaultCategory }) {
  const isNew = !item?.id;
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory] = useState(item?.category || defaultCategory || "other");
  const [url, setUrl] = useState(item?.url || "");
  const [fileData, setFileData] = useState(item?.fileData || null);
  const [fileName, setFileName] = useState(item?.fileName || null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileData(ev.target.result);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name, description, category, url, fileData, fileName };
    try {
      if (isNew) {
        const res = await apiFetch("/api/brandrepo", { method: "POST", body: JSON.stringify(payload) }, token);
        const data = await res.json();
        onSave(data, true);
      } else {
        const res = await apiFetch(`/api/brandrepo/${item.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
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
    if (!confirm("Delete this item?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/brandrepo/${item.id}`, { method: "DELETE" }, token);
      onDelete(item.id);
      onClose();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isNew ? "New Brand Asset" : "Edit Brand Asset"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={textInput({ width: "100%" })} placeholder="e.g. Primary Logo (Dark)" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={textInput({ width: "100%", resize: "vertical" })} placeholder="Brief description of the asset…" />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={textInput({ width: "100%" })}>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>URL / Link</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} style={textInput({ width: "100%" })} placeholder="https://…" />
        </div>
        <div>
          <label style={labelStyle}>File Upload (optional)</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", cursor: "pointer" }}>📎 Choose File</button>
            {fileName && <span style={{ fontSize: "12px", color: C.muted }}>{fileName}</span>}
          </div>
          <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} />
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

// ── Brand Item Card ───────────────────────────────────────────────────────────
function BrandItemCard({ item, onClick }) {
  const [hov, setHov] = useState(false);
  const cat = CAT_MAP[item.category] || CAT_MAP.other;
  const hasFile = !!item.fileData;
  const hasUrl = !!item.url;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{ background: hov ? C.cardBg : C.card, border: `1px solid ${hov ? C.accent : C.border}`, borderRadius: "14px", padding: "18px", cursor: "pointer", boxShadow: hov ? C.shadowMd : C.shadow, transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ fontWeight: "700", fontSize: "14px", color: C.text, lineHeight: 1.3 }}>{item.name}</div>
        <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "20px", background: `${cat.color}18`, color: cat.color, fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>{item.category}</span>
      </div>

      {item.description && (
        <p style={{ margin: 0, fontSize: "12px", color: C.muted, lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
      )}

      {(hasUrl || hasFile) && (
        <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
          {hasFile && (
            <a href={item.fileData} download={item.fileName || "file"} onClick={(e) => e.stopPropagation()} style={{ fontSize: "12px", color: C.accent, textDecoration: "none", padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontWeight: "600" }}>📥 Download</a>
          )}
          {hasUrl && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "12px", color: C.accent, textDecoration: "none", padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontWeight: "600" }}>↗ Open</a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BrandRepoView({ token, currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaultCategory, setModalDefaultCategory] = useState("other");

  const isAdmin = currentUser?.role === "admin";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/brandrepo", {}, token);
      if (res.ok) setItems(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function handleSave(updated, isNew) {
    if (isNew) setItems((prev) => [updated, ...prev]);
    else setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function openAdd(catId) {
    setModalItem(null);
    setModalDefaultCategory(catId);
    setShowModal(true);
  }

  function openEdit(item) {
    setModalItem(item);
    setModalDefaultCategory(item.category);
    setShowModal(true);
  }

  const displayCategories = CATEGORIES.filter((cat) => {
    if (cat.id === "other") return items.some((i) => i.category === "other");
    return true;
  });

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>Loading brand assets…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: C.text }}>Brand Repository</h2>
        <p style={{ margin: "6px 0 0", fontSize: "14px", color: C.muted }}>Logos, links, and print-ready files for TCF's brand identity.</p>
      </div>

      {/* Category Sections */}
      {displayCategories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.id);
        return (
          <div key={cat.id} style={{ marginBottom: "36px" }}>
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>{cat.label}</h3>
                <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: `${cat.color}18`, color: cat.color, fontWeight: "700" }}>{catItems.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => openAdd(cat.id)} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>+ Add</button>
              )}
            </div>

            {catItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", background: C.card, border: `1px dashed ${C.border}`, borderRadius: "12px", color: C.muted }}>
                <p style={{ margin: 0, fontSize: "13px" }}>{isAdmin ? "No items yet. Click \"+ Add\" to create one." : "No items in this category."}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                {catItems.map((item) => (
                  <BrandItemCard key={item.id} item={item} onClick={() => isAdmin ? openEdit(item) : (item.url ? window.open(item.url, "_blank") : null)} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add other section if admin and no "other" items yet */}
      {isAdmin && !items.some((i) => i.category === "other") && (
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: C.text }}>📦 Other Assets</h3>
              <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: "700" }}>0</span>
            </div>
            <button onClick={() => openAdd("other")} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ textAlign: "center", padding: "30px 20px", background: C.card, border: `1px dashed ${C.border}`, borderRadius: "12px", color: C.muted }}>
            <p style={{ margin: 0, fontSize: "13px" }}>No items yet. Click &ldquo;+ Add&rdquo; to create one.</p>
          </div>
        </div>
      )}

      {showModal && (
        <BrandItemModal
          item={modalItem}
          token={token}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setShowModal(false)}
          defaultCategory={modalDefaultCategory}
        />
      )}
    </div>
  );
}
