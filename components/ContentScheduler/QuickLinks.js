"use client";

import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";

const DEFAULT_LINKS = [
  { id: "default-drive", name: "Google Drive", url: "https://drive.google.com", emoji: "📁", description: "Shared team assets", category: "Tools" },
  { id: "default-notion", name: "Notion", url: "https://notion.so", emoji: "📓", description: "Team wiki & docs", category: "Tools" },
  { id: "default-website", name: "Website", url: "https://yourwebsite.com", emoji: "🌐", description: "Main website", category: "Links" },
  { id: "default-calendar", name: "Team Calendar", url: "https://calendar.google.com", emoji: "📅", description: "Shared calendar", category: "Tools" },
  { id: "default-brand", name: "Brand Guidelines", url: "#", emoji: "🎨", description: "Colors, fonts, logos", category: "Resources" },
  { id: "default-analytics", name: "Analytics", url: "#", emoji: "📊", description: "Social performance", category: "Resources" },
];

const CATEGORY_SUGGESTIONS = ["Tools", "Links", "Resources", "Social", "Internal"];

const EMPTY_FORM = { emoji: "🔗", name: "", url: "", description: "", category: "" };

function LinkModal({ title, initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.url.trim()) errs.url = "URL is required";
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: C.card,
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 460,
          boxShadow: C.shadowMd,
          border: `1px solid ${C.border}`,
        }}
      >
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>

        {/* Emoji */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            Emoji
          </label>
          <input
            type="text"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            maxLength={2}
            style={{
              width: 60,
              padding: "8px 12px",
              fontSize: 20,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.inputBg,
              color: C.text,
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            Name <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Notion"
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              border: `1px solid ${errors.name ? "#EF4444" : C.border}`,
              borderRadius: 8,
              background: C.inputBg,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.name && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.name}</p>}
        </div>

        {/* URL */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            URL <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              border: `1px solid ${errors.url ? "#EF4444" : C.border}`,
              borderRadius: 8,
              background: C.inputBg,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.url && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.url}</p>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description (optional)"
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.inputBg,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            Category
          </label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Tools"
            list="category-suggestions"
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.inputBg,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.card,
              color: C.text,
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              background: C.accent,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkCard({ link, isAdmin, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  function handleCardClick(e) {
    // Don't navigate if clicking admin action buttons
    if (e.target.closest("[data-admin-action]")) return;
    if (link.url && link.url !== "#") {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? C.accent : C.border}`,
        borderRadius: 14,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: hovered ? C.shadowMd : C.shadow,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
    >
      {/* Emoji */}
      <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 4 }}>{link.emoji || "🔗"}</div>

      {/* Name */}
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{link.name}</div>

      {/* Description */}
      {link.description && (
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{link.description}</div>
      )}

      {/* Category pill */}
      <div style={{ marginTop: 4 }}>
        <span
          style={{
            display: "inline-block",
            background: C.accentLight,
            color: C.accentBright,
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 10,
          }}
        >
          {link.category || "General"}
        </span>
      </div>

      {/* Admin action bar */}
      {isAdmin && (
        <div
          data-admin-action="true"
          style={{
            display: "flex",
            gap: 2,
            marginTop: 8,
            paddingTop: 10,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            data-admin-action="true"
            onClick={(e) => { e.stopPropagation(); onEdit(link); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: C.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 8px",
              borderRadius: 6,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}
          >
            ✏️ Edit
          </button>
          <button
            data-admin-action="true"
            onClick={(e) => { e.stopPropagation(); onDelete(link); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: C.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 8px",
              borderRadius: 6,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = "#EF4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuickLinks({ currentUser, token }) {
  const isAdmin = currentUser?.role === "admin";

  const [links, setLinks] = useState([]);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", "x-session": token }),
    [token]
  );

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quicklinks", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setLinks(DEFAULT_LINKS);
        setUsingDefaults(true);
      } else {
        setLinks(data);
        setUsingDefaults(false);
      }
    } catch {
      setLinks(DEFAULT_LINKS);
      setUsingDefaults(true);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Derive categories from current links
  const categories = ["All", ...Array.from(new Set(links.map((l) => l.category || "General")))];

  const filteredLinks = activeCategory === "All"
    ? links
    : links.filter((l) => (l.category || "General") === activeCategory);

  // Reset active category if it no longer exists
  useEffect(() => {
    if (activeCategory !== "All" && !categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [links, activeCategory, categories]);

  async function handleAddSave(form) {
    setModalSaving(true);
    try {
      const res = await fetch("/api/quicklinks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url.trim(),
          emoji: form.emoji.trim() || "🔗",
          description: form.description.trim(),
          category: form.category.trim() || "General",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add link");
      }
      const newLink = await res.json();
      // Once a real link is saved, stop showing defaults
      setLinks((prev) => {
        const base = usingDefaults ? [] : prev;
        return [...base, newLink];
      });
      setUsingDefaults(false);
      setShowAddModal(false);
    } catch (e) {
      alert(e.message || "Failed to save link");
    } finally {
      setModalSaving(false);
    }
  }

  async function handleEditSave(form) {
    setModalSaving(true);
    try {
      const isDefault = editTarget.id.startsWith("default-");
      const method = isDefault ? "POST" : "PUT";
      const body = isDefault
        ? { name: form.name.trim(), url: form.url.trim(), emoji: form.emoji.trim() || "🔗", description: form.description.trim(), category: form.category.trim() || "General" }
        : { id: editTarget.id, name: form.name.trim(), url: form.url.trim(), emoji: form.emoji.trim() || "🔗", description: form.description.trim(), category: form.category.trim() || "General" };

      const res = await fetch("/api/quicklinks", { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update link");
      }
      const saved = await res.json();
      setLinks((prev) => {
        const updated = prev.map((l) => (l.id === editTarget.id ? saved : l));
        // If we were using defaults, switching to real links now
        setUsingDefaults(false);
        return updated;
      });
      setEditTarget(null);
    } catch (e) {
      alert(e.message || "Failed to update link");
    } finally {
      setModalSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      if (!deleteTarget.id.startsWith("default-")) {
        const res = await fetch(`/api/quicklinks?id=${encodeURIComponent(deleteTarget.id)}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to delete link");
        }
      }
      setLinks((prev) => {
        const next = prev.filter((l) => l.id !== deleteTarget.id);
        if (next.length === 0) {
          setUsingDefaults(true);
          return DEFAULT_LINKS;
        }
        return next;
      });
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message || "Failed to delete link");
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Quick Links</h2>
          {usingDefaults && !loading && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
              Showing example links — add your own to get started.
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              fontSize: 14,
              fontWeight: 700,
              background: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              boxShadow: C.shadow,
            }}
          >
            + Add Link
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      {!loading && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  borderRadius: 20,
                  background: active ? C.accentLight : C.card,
                  color: active ? C.accentBright : C.muted,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 20,
                height: 120,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Link grid */}
      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              isAdmin={isAdmin}
              onEdit={(l) => setEditTarget(l)}
              onDelete={(l) => setDeleteTarget(l)}
            />
          ))}
          {filteredLinks.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "40px 20px",
                textAlign: "center",
                color: C.muted,
                fontSize: 15,
              }}
            >
              No links in this category yet.
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <LinkModal
          title="Add Link"
          initial={EMPTY_FORM}
          onSave={handleAddSave}
          onClose={() => setShowAddModal(false)}
          saving={modalSaving}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <LinkModal
          title="Edit Link"
          initial={{
            emoji: editTarget.emoji || "🔗",
            name: editTarget.name || "",
            url: editTarget.url || "",
            description: editTarget.description || "",
            category: editTarget.category || "",
          }}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
          saving={modalSaving}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 380,
              boxShadow: C.shadowMd,
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: C.text }}>
              Delete Link
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: C.text }}>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "9px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.card,
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: "9px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 8,
                  background: "#EF4444",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
