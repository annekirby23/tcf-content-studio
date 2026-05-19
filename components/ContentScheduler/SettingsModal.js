"use client";

import { useState, useEffect, useCallback } from "react";
import { C, THEMES } from "./constants";

const DEFAULT_CONTENT_TYPES = [
  { id: "post", label: "Static Post" },
  { id: "reel", label: "Reel / Short Video" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Long-Form Video" },
  { id: "live", label: "Live Stream" },
  { id: "article", label: "Article / Blog" },
  { id: "newsletter", label: "Newsletter" },
  { id: "podcast", label: "Podcast Episode" },
  { id: "thread", label: "Thread" },
];

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function SettingsModal({ token, currentUser, onClose, onSettingsUpdate }) {
  const [activeTab, setActiveTab] = useState("themes");
  const [themes, setThemes] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingContentTypes, setLoadingContentTypes] = useState(true);
  const [savingThemes, setSavingThemes] = useState(false);
  const [savingContentTypes, setSavingContentTypes] = useState(false);

  // Editing state for themes
  const [editingThemeId, setEditingThemeId] = useState(null);
  const [editThemeLabel, setEditThemeLabel] = useState("");
  const [editThemeEmoji, setEditThemeEmoji] = useState("");
  const [editThemeColor, setEditThemeColor] = useState("#6366F1");

  // Add theme form
  const [newThemeLabel, setNewThemeLabel] = useState("");
  const [newThemeEmoji, setNewThemeEmoji] = useState("");
  const [newThemeColor, setNewThemeColor] = useState("#6366F1");

  // Editing state for content types
  const [editingContentTypeId, setEditingContentTypeId] = useState(null);
  const [editContentTypeLabel, setEditContentTypeLabel] = useState("");

  // Add content type form
  const [newContentTypeLabel, setNewContentTypeLabel] = useState("");

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", "x-session": token }),
    [token]
  );

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/settings?type=themes", {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setThemes(Array.isArray(data) && data.length > 0 ? data : [...THEMES]);
        } else {
          setThemes([...THEMES]);
        }
      } catch {
        setThemes([...THEMES]);
      } finally {
        setLoadingThemes(false);
      }
    }

    async function fetchContentTypes() {
      try {
        const res = await fetch("/api/settings?type=contentTypes", {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setContentTypes(
            Array.isArray(data) && data.length > 0 ? data : [...DEFAULT_CONTENT_TYPES]
          );
        } else {
          setContentTypes([...DEFAULT_CONTENT_TYPES]);
        }
      } catch {
        setContentTypes([...DEFAULT_CONTENT_TYPES]);
      } finally {
        setLoadingContentTypes(false);
      }
    }

    fetchThemes();
    fetchContentTypes();
  }, [authHeaders]);

  async function saveThemes(updated) {
    setSavingThemes(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ type: "themes", data: updated }),
      });
      if (!res.ok) throw new Error("Failed to save themes");
      setThemes(updated);
      onSettingsUpdate?.({ type: "themes", data: updated });
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingThemes(false);
    }
  }

  async function saveContentTypes(updated) {
    setSavingContentTypes(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ type: "contentTypes", data: updated }),
      });
      if (!res.ok) throw new Error("Failed to save content types");
      setContentTypes(updated);
      onSettingsUpdate?.({ type: "contentTypes", data: updated });
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingContentTypes(false);
    }
  }

  // ---- Theme handlers ----
  function startEditTheme(theme) {
    setEditingThemeId(theme.id);
    setEditThemeLabel(theme.label);
    setEditThemeEmoji(theme.emoji || "");
    setEditThemeColor(theme.color || "#6366F1");
  }

  function cancelEditTheme() {
    setEditingThemeId(null);
    setEditThemeLabel("");
    setEditThemeEmoji("");
    setEditThemeColor("#6366F1");
  }

  async function saveEditTheme(themeId) {
    if (!editThemeLabel.trim()) return;
    const updated = themes.map((t) =>
      t.id === themeId
        ? {
            ...t,
            label: editThemeLabel.trim(),
            emoji: editThemeEmoji.trim().slice(0, 2) || t.emoji,
            color: editThemeColor,
          }
        : t
    );
    await saveThemes(updated);
    cancelEditTheme();
  }

  async function deleteTheme(themeId) {
    if (!confirm("Delete this theme?")) return;
    const updated = themes.filter((t) => t.id !== themeId);
    await saveThemes(updated);
  }

  async function addTheme(e) {
    e.preventDefault();
    if (!newThemeLabel.trim()) return;
    const newTheme = {
      id: genId(),
      label: newThemeLabel.trim(),
      emoji: newThemeEmoji.trim().slice(0, 2) || "📌",
      color: newThemeColor,
    };
    const updated = [...themes, newTheme];
    await saveThemes(updated);
    setNewThemeLabel("");
    setNewThemeEmoji("");
    setNewThemeColor("#6366F1");
  }

  // ---- Content Type handlers ----
  function startEditContentType(ct) {
    setEditingContentTypeId(ct.id);
    setEditContentTypeLabel(ct.label);
  }

  function cancelEditContentType() {
    setEditingContentTypeId(null);
    setEditContentTypeLabel("");
  }

  async function saveEditContentType(ctId) {
    if (!editContentTypeLabel.trim()) return;
    const updated = contentTypes.map((ct) =>
      ct.id === ctId ? { ...ct, label: editContentTypeLabel.trim() } : ct
    );
    await saveContentTypes(updated);
    cancelEditContentType();
  }

  async function deleteContentType(ctId) {
    if (!confirm("Delete this content type?")) return;
    const updated = contentTypes.filter((ct) => ct.id !== ctId);
    await saveContentTypes(updated);
  }

  async function addContentType(e) {
    e.preventDefault();
    if (!newContentTypeLabel.trim()) return;
    const newCt = { id: genId(), label: newContentTypeLabel.trim() };
    const updated = [...contentTypes, newCt];
    await saveContentTypes(updated);
    setNewContentTypeLabel("");
  }

  const isAdmin = currentUser?.role === "admin";

  const inputStyle = {
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    padding: "7px 10px",
    fontSize: 13,
    color: C.text,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    background: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnSecondary = {
    background: "transparent",
    color: C.muted,
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
  };

  const btnDanger = {
    background: "transparent",
    color: "#EF4444",
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 14,
    cursor: "pointer",
  };

  const btnEdit = {
    background: "transparent",
    color: C.muted,
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    /* Overlay */
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Modal */}
      <div
        style={{
          background: C.card,
          borderRadius: 14,
          boxShadow: C.shadowMd,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>
            ⚙️ App Settings
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              color: C.muted,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.border}`,
            padding: "0 24px",
          }}
        >
          {["themes", "contentTypes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `2px solid ${C.accent}` : "2px solid transparent",
                color: activeTab === tab ? C.accent : C.muted,
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 14,
                padding: "12px 16px",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {tab === "themes" ? "Themes" : "Content Types"}
            </button>
          ))}
        </div>

        {!isAdmin && (
          <div
            style={{
              background: "#FEF3C7",
              borderBottom: `1px solid #FDE68A`,
              padding: "10px 24px",
              fontSize: 13,
              color: "#92400E",
            }}
          >
            You have read-only access. Admin role required to make changes.
          </div>
        )}

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* ---- THEMES TAB ---- */}
          {activeTab === "themes" && (
            <div>
              {loadingThemes ? (
                <div style={{ color: C.muted, fontSize: 14, padding: "24px 0" }}>
                  Loading themes…
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        style={{
                          background: C.cardBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 9,
                          padding: "10px 14px",
                        }}
                      >
                        {editingThemeId === theme.id ? (
                          /* Edit row */
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                type="color"
                                value={editThemeColor}
                                onChange={(e) => setEditThemeColor(e.target.value)}
                                style={{
                                  width: 36,
                                  height: 36,
                                  border: "none",
                                  borderRadius: 7,
                                  padding: 2,
                                  cursor: "pointer",
                                  background: "transparent",
                                  flexShrink: 0,
                                }}
                              />
                              <input
                                type="text"
                                value={editThemeEmoji}
                                onChange={(e) => setEditThemeEmoji(e.target.value)}
                                placeholder="Emoji"
                                maxLength={2}
                                style={{ ...inputStyle, width: 60, flexShrink: 0 }}
                              />
                              <input
                                type="text"
                                value={editThemeLabel}
                                onChange={(e) => setEditThemeLabel(e.target.value)}
                                placeholder="Label"
                                style={{ ...inputStyle }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => saveEditTheme(theme.id)}
                                disabled={!editThemeLabel.trim() || savingThemes}
                                style={{
                                  ...btnPrimary,
                                  opacity: !editThemeLabel.trim() || savingThemes ? 0.6 : 1,
                                }}
                              >
                                {savingThemes ? "Saving…" : "Save"}
                              </button>
                              <button onClick={cancelEditTheme} style={btnSecondary}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display row */
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  background: theme.color,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontSize: 16 }}>{theme.emoji}</span>
                              <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
                                {theme.label}
                              </span>
                            </div>
                            {isAdmin && (
                              <div style={{ display: "flex", gap: 2 }}>
                                <button
                                  onClick={() => startEditTheme(theme)}
                                  title="Edit"
                                  style={btnEdit}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteTheme(theme.id)}
                                  title="Delete"
                                  style={btnDanger}
                                >
                                  🗑
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 18,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.text,
                          marginBottom: 10,
                        }}
                      >
                        Add Theme
                      </p>
                      <form onSubmit={addTheme} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="color"
                            value={newThemeColor}
                            onChange={(e) => setNewThemeColor(e.target.value)}
                            style={{
                              width: 36,
                              height: 36,
                              border: "none",
                              borderRadius: 7,
                              padding: 2,
                              cursor: "pointer",
                              background: "transparent",
                              flexShrink: 0,
                            }}
                          />
                          <input
                            type="text"
                            value={newThemeEmoji}
                            onChange={(e) => setNewThemeEmoji(e.target.value)}
                            placeholder="Emoji"
                            maxLength={2}
                            style={{ ...inputStyle, width: 60, flexShrink: 0 }}
                          />
                          <input
                            type="text"
                            value={newThemeLabel}
                            onChange={(e) => setNewThemeLabel(e.target.value)}
                            placeholder="Theme label (required)"
                            required
                            style={{ ...inputStyle }}
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            disabled={!newThemeLabel.trim() || savingThemes}
                            style={{
                              ...btnPrimary,
                              opacity: !newThemeLabel.trim() || savingThemes ? 0.6 : 1,
                            }}
                          >
                            {savingThemes ? "Saving…" : "+ Add Theme"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ---- CONTENT TYPES TAB ---- */}
          {activeTab === "contentTypes" && (
            <div>
              {loadingContentTypes ? (
                <div style={{ color: C.muted, fontSize: 14, padding: "24px 0" }}>
                  Loading content types…
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {contentTypes.map((ct) => (
                      <div
                        key={ct.id}
                        style={{
                          background: C.cardBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 9,
                          padding: "10px 14px",
                        }}
                      >
                        {editingContentTypeId === ct.id ? (
                          /* Edit row */
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input
                              type="text"
                              value={editContentTypeLabel}
                              onChange={(e) => setEditContentTypeLabel(e.target.value)}
                              placeholder="Label"
                              style={inputStyle}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => saveEditContentType(ct.id)}
                                disabled={!editContentTypeLabel.trim() || savingContentTypes}
                                style={{
                                  ...btnPrimary,
                                  opacity:
                                    !editContentTypeLabel.trim() || savingContentTypes ? 0.6 : 1,
                                }}
                              >
                                {savingContentTypes ? "Saving…" : "Save"}
                              </button>
                              <button onClick={cancelEditContentType} style={btnSecondary}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display row */
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
                              {ct.label}
                            </span>
                            {isAdmin && (
                              <div style={{ display: "flex", gap: 2 }}>
                                <button
                                  onClick={() => startEditContentType(ct)}
                                  title="Edit"
                                  style={btnEdit}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteContentType(ct.id)}
                                  title="Delete"
                                  style={btnDanger}
                                >
                                  🗑
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 18,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.text,
                          marginBottom: 10,
                        }}
                      >
                        Add Content Type
                      </p>
                      <form onSubmit={addContentType} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <input
                          type="text"
                          value={newContentTypeLabel}
                          onChange={(e) => setNewContentTypeLabel(e.target.value)}
                          placeholder="Content type label (required)"
                          required
                          style={{ ...inputStyle }}
                        />
                        <button
                          type="submit"
                          disabled={!newContentTypeLabel.trim() || savingContentTypes}
                          style={{
                            ...btnPrimary,
                            flexShrink: 0,
                            opacity:
                              !newContentTypeLabel.trim() || savingContentTypes ? 0.6 : 1,
                          }}
                        >
                          {savingContentTypes ? "Saving…" : "+ Add"}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} style={btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
