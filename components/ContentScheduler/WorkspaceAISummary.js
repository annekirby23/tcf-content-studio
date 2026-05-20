"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

// ─── Small typing indicator ──────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: C.accent, opacity: 0.5,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

// ─── Chat message bubble ──────────────────────────────────────────────────────

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "8px" }}>
      <div style={{
        maxWidth: "85%",
        padding: "10px 14px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser ? C.accent : C.cardBg,
        color: isUser ? "#fff" : C.text,
        fontSize: "13px",
        lineHeight: "1.65",
        border: isUser ? "none" : `1px solid ${C.border}`,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {content}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function WorkspaceAISummary({ token, currentUser, viewingUserId, ownerName }) {
  const OPEN_KEY    = `tcf_ai_open_${viewingUserId}`;
  const CACHE_KEY   = `tcf_ai_summary_${viewingUserId}_${todayKey()}`;

  // Load cached summary for today (if any)
  const cachedSummary = (() => { try { return localStorage.getItem(CACHE_KEY) || ""; } catch { return ""; } })();

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(OPEN_KEY) !== "false"; } catch { return true; }
  });
  const [summary, setSummary] = useState(cachedSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryDate] = useState(todayKey());

  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Persist open state
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(OPEN_KEY, next ? "true" : "false"); } catch {}
  };

  // Auto-generate ONLY if no cached summary exists for today
  useEffect(() => {
    if (open && !cachedSummary && !summaryLoading) generateSummary();
  }, [open, viewingUserId]); // eslint-disable-line

  const generateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await apiFetch("/api/workspace-ai", {
        method: "POST",
        body: JSON.stringify({ type: "summary", userName: ownerName, userId: viewingUserId }),
      }, token);
      const data = await res.json();
      if (data.error) { setSummaryError(data.error); return; }
      setSummary(data.result);
      // Cache for today so it doesn't regenerate on every visit
      try { localStorage.setItem(CACHE_KEY, data.result); } catch {}
    } catch {
      setSummaryError("Couldn't generate summary — try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const sendQuestion = async () => {
    const q = question.trim();
    if (!q || chatLoading) return;
    setQuestion("");
    setChatError("");
    const userMsg = { role: "user", content: q };
    setChatHistory((h) => [...h, userMsg]);
    setChatLoading(true);
    try {
      const res = await apiFetch("/api/workspace-ai", {
        method: "POST",
        body: JSON.stringify({
          type: "question",
          question: q,
          userName: ownerName,
          history: chatHistory,
        }),
      }, token);
      const data = await res.json();
      if (data.error) { setChatError(data.error); setChatHistory((h) => h.slice(0, -1)); return; }
      setChatHistory((h) => [...h, { role: "assistant", content: data.result }]);
    } catch {
      setChatError("Something went wrong — please try again.");
      setChatHistory((h) => h.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  const inputStyle = {
    padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "10px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  // Split summary into task paragraph and message paragraph
  const [taskPara, messagePara] = (() => {
    if (!summary) return ["", ""];
    const parts = summary.trim().split(/\n\n+/);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join("\n\n")];
    return [summary, ""];
  })();

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%)`,
      border: `1px solid rgba(99,102,241,0.2)`,
      borderRadius: "16px",
      marginBottom: "20px",
      overflow: "hidden",
      boxShadow: C.shadow,
    }}>
      {/* Header / toggle */}
      <button
        onClick={toggleOpen}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "14px 20px", border: "none", cursor: "pointer", textAlign: "left",
          background: "transparent",
        }}
      >
        <span style={{ fontSize: "20px" }}>✨</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: C.text }}>
            Your Daily Briefing
          </div>
          {!open && (
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "1px" }}>
              Tasks, updates & ask anything
            </div>
          )}
        </div>
        <span style={{
          fontSize: "14px", color: C.muted,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
          flexShrink: 0,
        }}>▾</span>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: "0 20px 20px" }}>

          {/* ── Summary section ── */}
          <div style={{ marginBottom: "16px" }}>
            {summaryLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", color: C.muted, fontSize: "13px" }}>
                <TypingDots />
                <span>Generating your briefing…</span>
              </div>
            ) : summaryError ? (
              <div style={{ fontSize: "13px", color: "#EF4444", padding: "8px 0" }}>{summaryError}</div>
            ) : summary ? (
              <div>
                {/* Task snapshot */}
                {taskPara && (
                  <div style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderLeft: `4px solid ${C.accent}`,
                    borderRadius: "10px", padding: "12px 16px", marginBottom: "10px",
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: C.accent, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>📋 Your Key Tasks</div>
                    <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7" }}>{taskPara}</div>
                  </div>
                )}
                {/* Positive message */}
                {messagePara && (
                  <div style={{
                    background: "rgba(99,102,241,0.06)", border: `1px solid rgba(99,102,241,0.15)`,
                    borderRadius: "10px", padding: "12px 16px", marginBottom: "10px",
                  }}>
                    <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", fontStyle: "italic" }}>
                      💙 {messagePara}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Refresh / generate button */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "8px",
                  border: `1px solid ${C.border}`, background: C.card,
                  color: summaryLoading ? C.muted : C.accent,
                  fontSize: "12px", fontWeight: "600", cursor: summaryLoading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "14px" }}>✨</span>
                {summaryLoading ? "Generating…" : summary ? "Refresh Briefing" : "Generate Briefing"}
              </button>
              {summary && !summaryLoading && (
                <span style={{ fontSize: "11px", color: C.muted }}>Generated {summaryDate === todayKey() ? "today" : summaryDate} · auto-refreshes daily</span>
              )}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />

          {/* ── Chat / Q&A section ── */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔍</span> Ask anything about TCF
              <span style={{ fontWeight: "400", color: C.muted, fontSize: "11px" }}>— memberships, events, tasks, policies…</span>
            </div>

            {/* Chat history */}
            {chatHistory.length > 0 && (
              <div style={{
                background: C.cardBg, border: `1px solid ${C.border}`,
                borderRadius: "12px", padding: "12px",
                maxHeight: "300px", overflowY: "auto",
                marginBottom: "10px",
              }}>
                {chatHistory.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} />)}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px" }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {chatError && <div style={{ fontSize: "12px", color: "#EF4444", marginBottom: "8px" }}>{chatError}</div>}

            {/* Input row */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(); } }}
                placeholder="e.g. How much is the social membership?"
                style={{ ...inputStyle, flex: 1 }}
                disabled={chatLoading}
              />
              <button
                onClick={sendQuestion}
                disabled={!question.trim() || chatLoading}
                style={{
                  padding: "9px 16px", borderRadius: "10px", border: "none",
                  background: question.trim() && !chatLoading ? C.accent : C.border,
                  color: "#fff", fontSize: "13px", fontWeight: "700",
                  cursor: question.trim() && !chatLoading ? "pointer" : "not-allowed",
                  flexShrink: 0, transition: "background 0.15s",
                }}
              >
                {chatLoading ? "…" : "Ask"}
              </button>
            </div>

            {chatHistory.length > 0 && (
              <button
                onClick={() => { setChatHistory([]); setChatError(""); }}
                style={{ marginTop: "8px", background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", padding: "2px 0" }}
              >
                Clear conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
