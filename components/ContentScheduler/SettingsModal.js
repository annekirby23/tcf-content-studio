"use client";

import { useState, useEffect, useCallback } from "react";
import { C, THEMES, PLATFORMS, PILLARS } from "./constants";

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

// ─── Simple label-only list tab (Content Types, Pillars) ─────────────────────

function SimpleListTab({ items, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === item.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={inputStyle} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(items.map((x) => x.id === item.id ? { ...x, label: editLabel.trim() } : x));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{item.label}</span>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(item.id); setEditLabel(item.label); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this item?")) return;
                        await onSave(items.filter((x) => x.id !== item.id));
                      }}
                      style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}
                    >🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Item</p>
          <form onSubmit={async (e) => { e.preventDefault(); if (!newLabel.trim()) return; await onSave([...items, { id: genId(), label: newLabel.trim() }]); setNewLabel(""); }} style={{ display: "flex", gap: 10 }}>
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (required)" required style={inputStyle} />
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Themes tab (label + emoji + color) ─────────────────────────────────────

function ThemesTab({ themes, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editColor, setEditColor] = useState("#6366F1");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const colorInput = { width: 36, height: 36, border: "none", borderRadius: 7, padding: 2, cursor: "pointer", background: "transparent", flexShrink: 0 };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {themes.map((theme) => (
          <div key={theme.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === theme.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={colorInput} />
                  <input type="text" value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} placeholder="Emoji" maxLength={2} style={{ ...inputStyle, width: 60, flexShrink: 0 }} />
                  <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Label" style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(themes.map((t) => t.id === theme.id ? { ...t, label: editLabel.trim(), emoji: editEmoji.trim().slice(0, 2) || t.emoji, color: editColor } : t));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: theme.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{theme.emoji}</span>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{theme.label}</span>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(theme.id); setEditLabel(theme.label); setEditEmoji(theme.emoji || ""); setEditColor(theme.color || "#6366F1"); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button onClick={async () => { if (!confirm("Delete this theme?")) return; await onSave(themes.filter((t) => t.id !== theme.id)); }} style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Theme</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            await onSave([...themes, { id: genId(), label: newLabel.trim(), emoji: newEmoji.trim().slice(0, 2) || "📌", color: newColor }]);
            setNewLabel(""); setNewEmoji(""); setNewColor("#6366F1");
          }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={colorInput} />
              <input type="text" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="Emoji" maxLength={2} style={{ ...inputStyle, width: 60, flexShrink: 0 }} />
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Theme label (required)" required style={inputStyle} />
            </div>
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content", opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add Theme"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Platforms tab (label + icon/emoji + color) ───────────────────────────────

function PlatformsTab({ platforms, isAdmin, saving, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("#6366F1");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const inputStyle = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, color: C.text, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const colorInput = { width: 36, height: 36, border: "none", borderRadius: 7, padding: 2, cursor: "pointer", background: "transparent", flexShrink: 0 };

  return (
    <div>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        Changes here update the platform list in the post form. Icon can be any emoji.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {platforms.map((p) => (
          <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
            {editingId === p.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={colorInput} />
                  <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Icon emoji" maxLength={4} style={{ ...inputStyle, width: 72, flexShrink: 0 }} />
                  <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Platform name" style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!editLabel.trim()) return;
                      await onSave(platforms.map((x) => x.id === p.id ? { ...x, label: editLabel.trim(), icon: editIcon.trim() || x.icon, color: editColor, bg: `${editColor}1F` } : x));
                      setEditingId(null);
                    }}
                    disabled={!editLabel.trim() || saving}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !editLabel.trim() || saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{p.label}</span>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEditingId(p.id); setEditLabel(p.label); setEditIcon(p.icon || ""); setEditColor(p.color || "#6366F1"); }} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                    <button onClick={async () => { if (!confirm("Delete this platform?")) return; await onSave(platforms.filter((x) => x.id !== p.id)); }} style={{ background: "transparent", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Platform</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            const id = newLabel.trim().toLowerCase().replace(/\s+/g, "-");
            await onSave([...platforms, { id: id + "-" + genId().slice(0, 4), label: newLabel.trim(), icon: newIcon.trim() || "📡", color: newColor, bg: `${newColor}1F` }]);
            setNewLabel(""); setNewIcon(""); setNewColor("#6366F1");
          }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={colorInput} />
              <input type="text" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon emoji" maxLength={4} style={{ ...inputStyle, width: 72, flexShrink: 0 }} />
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Platform name (required)" required style={inputStyle} />
            </div>
            <button type="submit" disabled={!newLabel.trim() || saving} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content", opacity: !newLabel.trim() || saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "+ Add Platform"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "themes", label: "Themes" },
  { id: "contentTypes", label: "Content Types" },
  { id: "platforms", label: "Platforms" },
  { id: "pillars", label: "Content Pillars" },
];

export default function SettingsModal({ token, currentUser, onClose, onSettingsUpdate }) {
  const [activeTab, setActiveTab] = useState("themes");
  const [data, setData] = useState({ themes: [], contentTypes: [], platforms: [], pillars: [] });
  const [loading, setLoading] = useState({ themes: true, contentTypes: true, platforms: true, pillars: true });
  const [saving, setSaving] = useState({ themes: false, contentTypes: false, platforms: false, pillars: false });

  const isAdmin = currentUser?.role === "admin";

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", "x-session": token }),
    [token]
  );

  const DEFAULTS = {
    themes: THEMES,
    contentTypes: DEFAULT_CONTENT_TYPES,
    platforms: PLATFORMS,
    pillars: PILLARS,
  };

  useEffect(() => {
    const types = ["themes", "contentTypes", "platforms", "pillars"];
    types.forEach(async (type) => {
      try {
        const res = await fetch(`/api/settings?type=${type}`, { headers: authHeaders() });
        const fetched = res.ok ? await res.json() : null;
        setData((d) => ({ ...d, [type]: Array.isArray(fetched) && fetched.length > 0 ? fetched : [...DEFAULTS[type]] }));
      } catch {
        setData((d) => ({ ...d, [type]: [...DEFAULTS[type]] }));
      } finally {
        setLoading((l) => ({ ...l, [type]: false }));
      }
    });
  }, [authHeaders]);

  async function handleSave(type, updated) {
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ type, data: updated }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setData((d) => ({ ...d, [type]: updated }));
      onSettingsUpdate?.({ type, data: updated });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: C.card, borderRadius: 14, boxShadow: C.shadowMd, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>⚙️ App Settings</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: C.muted, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 24px", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "transparent", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                color: activeTab === tab.id ? C.accent : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: 13, padding: "12px 14px", cursor: "pointer", marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!isAdmin && (
          <div style={{ background: "#FEF3C7", borderBottom: `1px solid #FDE68A`, padding: "10px 24px", fontSize: 13, color: "#92400E" }}>
            Read-only — admin role required to make changes.
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading[activeTab] ? (
            <div style={{ color: C.muted, fontSize: 14, padding: "24px 0" }}>Loading…</div>
          ) : (
            <>
              {activeTab === "themes" && (
                <ThemesTab themes={data.themes} isAdmin={isAdmin} saving={saving.themes} onSave={(updated) => handleSave("themes", updated)} />
              )}
              {activeTab === "contentTypes" && (
                <SimpleListTab items={data.contentTypes} isAdmin={isAdmin} saving={saving.contentTypes} onSave={(updated) => handleSave("contentTypes", updated)} />
              )}
              {activeTab === "platforms" && (
                <PlatformsTab platforms={data.platforms} isAdmin={isAdmin} saving={saving.platforms} onSave={(updated) => handleSave("platforms", updated)} />
              )}
              {activeTab === "pillars" && (
                <SimpleListTab items={data.pillars} isAdmin={isAdmin} saving={saving.pillars} onSave={(updated) => handleSave("pillars", updated)} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
