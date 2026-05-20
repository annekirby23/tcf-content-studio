"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";
import MemberJourneyView from "./MemberJourneyView";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

const SECTIONS = [
  { key: "mission",  icon: "🎯", title: "Our Mission",    placeholder: "What TCF is here to do — the core purpose that drives everything we do…" },
  { key: "values",   icon: "💙", title: "Our Values",     placeholder: "The principles and beliefs that guide how we operate and treat each other…" },
  { key: "motto",    icon: "✨", title: "Our Motto",      placeholder: "A short, memorable phrase that captures the spirit of TCF…" },
  { key: "history",  icon: "📖", title: "History & About", placeholder: "How TCF started, key milestones, where we've been and where we're going…" },
  { key: "ourWhy",   icon: "❤️",  title: "Our Why",       placeholder: "The deeper reason TCF exists — what inspires us beyond the day-to-day…" },
];

function InfoSection({ sectionKey, icon, title, placeholder, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [hov, setHov] = useState(false);

  useEffect(() => { setDraft(value || ""); }, [value]);

  const save = async () => {
    setSaving(true);
    await onSave(sectionKey, draft);
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => { setDraft(value || ""); setEditing(false); };

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: "14px",
      padding: "24px",
      boxShadow: C.shadow,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: C.text }}>{title}</h2>
      </div>

      {editing ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            style={{
              width: "100%", padding: "12px 14px",
              border: `1px solid ${C.accent}`,
              borderRadius: "10px", background: C.inputBg,
              color: C.text, fontSize: "14px", lineHeight: "1.7",
              resize: "vertical", fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
            placeholder={placeholder}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={cancel}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          title="Click to edit"
          style={{
            fontSize: "14px",
            color: value ? C.text : C.muted,
            lineHeight: "1.8",
            padding: "14px 16px",
            background: hov ? C.hover : C.cardBg,
            borderRadius: "10px",
            border: `1px solid ${hov ? C.accent : C.border}`,
            cursor: "pointer",
            minHeight: "80px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            transition: "all 0.15s",
          }}
        >
          {value || <em style={{ opacity: 0.6 }}>{placeholder}</em>}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "about", label: "🏫 About TCF" },
  { id: "journey", label: "🗺️ Member Journey" },
];

export default function TCFInfoView({ token, teamMembers = [] }) {
  const [activeTab, setActiveTab] = useState("about");
  const [info, setInfo] = useState({ mission: "", values: "", motto: "", history: "", ourWhy: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/tcfinfo", {}, token)
      .then((r) => r.json())
      .then((data) => setInfo(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (key, value) => {
    setInfo((prev) => ({ ...prev, [key]: value }));
    try {
      await apiFetch("/api/tcfinfo", { method: "PUT", body: JSON.stringify({ [key]: value }) }, token);
      setToast("Saved!");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("Failed to save");
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "980px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: C.text }}>🏫 TCF Studio</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Who we are, what we stand for, and how we bring members in.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${C.border}`, paddingBottom: "0" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px", borderRadius: "10px 10px 0 0",
              border: `1px solid ${activeTab === tab.id ? C.border : "transparent"}`,
              borderBottom: activeTab === tab.id ? `1px solid ${C.card}` : "1px solid transparent",
              background: activeTab === tab.id ? C.card : "transparent",
              color: activeTab === tab.id ? C.accent : C.muted,
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              marginBottom: "-1px",
              transition: "all 0.12s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* About TCF tab */}
      {activeTab === "about" && (
        loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>Loading…</div>
        ) : (
          <div style={{ maxWidth: "820px" }}>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: C.muted }}>Our identity, history, and purpose. Click any section to edit.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {SECTIONS.map((s) => (
                <InfoSection
                  key={s.key}
                  sectionKey={s.key}
                  icon={s.icon}
                  title={s.title}
                  placeholder={s.placeholder}
                  value={info[s.key]}
                  onSave={handleSave}
                />
              ))}
            </div>
          </div>
        )
      )}

      {/* Member Journey tab */}
      {activeTab === "journey" && (
        <MemberJourneyView token={token} teamMembers={teamMembers} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          background: C.accent, color: "#fff",
          padding: "10px 20px", borderRadius: "10px",
          fontSize: "13px", fontWeight: "600",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
