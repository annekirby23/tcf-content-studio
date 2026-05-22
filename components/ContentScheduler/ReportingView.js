"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MemberInitials({ name, size = 28 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0 }}>{ini}</div>;
}

const PRIORITY_CFG = {
  high:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "High" },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Medium" },
  low:    { color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Low" },
  critical: { color: "#7C3AED", bg: "rgba(124,58,237,0.1)", label: "Critical" },
};

const STATUS_CFG = {
  in_progress: { color: "#3B82F6", label: "In Progress" },
  done:        { color: "#10B981", label: "Done" },
  blocked:     { color: "#EF4444", label: "Blocked" },
};

// ─── Task Reports Tab ─────────────────────────────────────────────────────────

function TaskReportsTab({ token, teamMembers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  useEffect(() => {
    apiFetch("/api/teamtasks", {}, token)
      .then((r) => r.json())
      .then((d) => setTasks(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const today = new Date().toISOString().split("T")[0];

  const filtered = tasks.filter((t) => {
    if (statusFilter === "open" && t.status === "done") return false;
    if (statusFilter === "done" && t.status !== "done") return false;
    if (statusFilter === "overdue" && (t.status === "done" || !t.dueDate || t.dueDate >= today)) return false;
    if (selectedMember && !(t.assignees || []).some((a) => a.id === selectedMember)) return false;
    return true;
  });

  // Group by member
  const byMember = {};
  filtered.forEach((t) => {
    const assignees = (t.assignees || []);
    if (assignees.length === 0) {
      (byMember["__unassigned__"] = byMember["__unassigned__"] || []).push(t);
    } else {
      assignees.forEach((a) => {
        (byMember[a.id] = byMember[a.id] || []).push(t);
      });
    }
  });

  const openCount = tasks.filter((t) => t.status !== "done").length;
  const overdueCount = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < today).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const inputStyle = { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "12px", outline: "none", fontFamily: "inherit" };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "Open", value: openCount, color: "#3B82F6" },
          { label: "Overdue", value: overdueCount, color: "#EF4444" },
          { label: "Completed", value: doneCount, color: "#10B981" },
          { label: "Total", value: tasks.length, color: C.accent },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 20px", boxShadow: C.shadow, textAlign: "center", minWidth: "80px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="open">Open tasks</option>
          <option value="overdue">Overdue only</option>
          <option value="done">Completed</option>
          <option value="all">All tasks</option>
        </select>
        <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} style={inputStyle}>
          <option value="">All members</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <span style={{ fontSize: "12px", color: C.muted }}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>No tasks match these filters.</div>
      ) : selectedMember ? (
        // Single member — flat list
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((t) => <TaskRow key={t.id} task={t} today={today} />)}
        </div>
      ) : (
        // All — grouped by member
        Object.entries(byMember).map(([memberId, memberTasks]) => {
          const member = memberId === "__unassigned__" ? null : teamMembers.find((m) => m.id === memberId);
          const name = member ? member.name : "Unassigned";
          return (
            <div key={memberId} style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                {member ? <MemberInitials name={name} size={24} /> : <span style={{ fontSize: "18px" }}>👤</span>}
                <span style={{ fontSize: "14px", fontWeight: "700", color: C.text }}>{name}</span>
                <span style={{ fontSize: "11px", color: C.muted, padding: "1px 8px", borderRadius: "10px", background: C.cardBg, border: `1px solid ${C.border}` }}>{memberTasks.length} task{memberTasks.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "32px" }}>
                {memberTasks.map((t) => <TaskRow key={t.id + memberId} task={t} today={today} />)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function TaskRow({ task, today }) {
  const pri = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
  const isOverdue = task.status !== "done" && task.dueDate && task.dueDate < today;
  return (
    <div style={{ background: C.card, border: `1px solid ${isOverdue ? "#EF444440" : C.border}`, borderLeft: `3px solid ${isOverdue ? "#EF4444" : pri.color}`, borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: task.status === "done" ? C.muted : C.text, textDecoration: task.status === "done" ? "line-through" : "none", marginBottom: "3px" }}>{task.text}</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "10px", background: pri.bg, color: pri.color, fontWeight: "700" }}>{pri.label}</span>
          {task.dueDate && <span style={{ fontSize: "10px", color: isOverdue ? "#EF4444" : C.muted, fontWeight: isOverdue ? "700" : "400" }}>{isOverdue ? "⚠ Due " : "Due "}{formatDate(task.dueDate)}</span>}
          {(task.assignees || []).length > 0 && <span style={{ fontSize: "10px", color: C.muted }}>{task.assignees.map((a) => a.name).join(", ")}</span>}
          {(task.locations || []).length > 0 && <span style={{ fontSize: "10px", color: C.muted }}>📍 {task.locations.join(", ")}</span>}
        </div>
      </div>
      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: STATUS_CFG[task.status]?.color + "20" || C.cardBg, color: STATUS_CFG[task.status]?.color || C.muted, fontWeight: "600", flexShrink: 0 }}>
        {STATUS_CFG[task.status]?.label || task.status}
      </span>
    </div>
  );
}

// ─── AI Summary Tab ────────────────────────────────────────────────────────────

function AISummaryTab({ token }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSummary("");
    try {
      const res = await apiFetch("/api/reports", { method: "POST", body: JSON.stringify({ type: "summary" }) }, token);
      const data = await res.json();
      setSummary(data.result || data.error || "No response.");
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "24px" }}>🤖</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "800", color: C.text }}>AI Task Summary</div>
            <div style={{ fontSize: "12px", color: C.muted }}>Get an AI-written overview of your team's current workload, open tasks, and suggested priorities.</div>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: loading ? C.border : C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generating…" : "✨ Generate Summary"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🤔</div>
          Analyzing your team's tasks…
        </div>
      )}

      {summary && !loading && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "24px", boxShadow: C.shadow }}>
          <div style={{ fontSize: "12px", color: C.muted, fontWeight: "600", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>AI Summary · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{summary}</div>
        </div>
      )}
    </div>
  );
}

// ─── Idea Generator Tab ────────────────────────────────────────────────────────

const CONTENT_TYPES = ["Blog Post", "Social Campaign", "Newsletter"];

function IdeaGeneratorTab({ token }) {
  const [contentType, setContentType] = useState("Blog Post");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("current and prospective members");
  const [tone, setTone] = useState("warm, professional, and inspiring");
  const [questions, setQuestions] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({ type: "ideas", contentType, topic, audience, tone, questions }),
      }, token);
      const data = await res.json();
      setResult(data.result || data.error || "No response.");
    } catch {
      setResult("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputStyle = { width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* Left — form */}
      <div style={{ flex: "0 0 340px", minWidth: "280px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", boxShadow: C.shadow }}>
          <div style={{ fontSize: "15px", fontWeight: "800", color: C.text, marginBottom: "16px" }}>✨ Content Idea Generator</div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Content Type</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct}
                  onClick={() => setContentType(ct)}
                  style={{ padding: "6px 12px", borderRadius: "20px", border: `1px solid ${contentType === ct ? C.accent : C.border}`, background: contentType === ct ? C.accentLight : "transparent", color: contentType === ct ? C.accent : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Topic or Theme *</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. membership benefits, community impact…"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Target Audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. current members, local businesses…"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Tone</label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. warm and professional…"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>
              {contentType === "Blog Post" ? "Key points to cover (optional)" : "Additional context (optional)"}
            </label>
            <textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={3}
              placeholder={contentType === "Blog Post" ? "What should the post cover? Any specific angle?" : "Any specific details to include?"}
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
            />
          </div>

          <button
            onClick={generate}
            disabled={!topic.trim() || loading}
            style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: topic.trim() && !loading ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: topic.trim() && !loading ? "pointer" : "not-allowed" }}
          >
            {loading ? "Generating…" : `✨ Generate ${contentType}`}
          </button>
        </div>
      </div>

      {/* Right — output */}
      <div style={{ flex: 1, minWidth: "280px" }}>
        {loading && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "60px 20px", textAlign: "center", boxShadow: C.shadow }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>✍️</div>
            <div style={{ fontSize: "14px", color: C.muted }}>Writing your {contentType.toLowerCase()}…</div>
          </div>
        )}
        {result && !loading && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", boxShadow: C.shadow }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>Generated {contentType}</div>
              <button
                onClick={copy}
                style={{ padding: "5px 12px", borderRadius: "7px", border: `1px solid ${C.border}`, background: copied ? "#10B981" : C.cardBg, color: copied ? "#fff" : C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.9", whiteSpace: "pre-wrap", maxHeight: "600px", overflowY: "auto" }}>{result}</div>
          </div>
        )}
        {!result && !loading && (
          <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: "14px", padding: "60px 20px", textAlign: "center", color: C.muted }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💡</div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: C.text, marginBottom: "4px" }}>Your content will appear here</div>
            <div style={{ fontSize: "12px" }}>Fill in the form and click Generate</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ReportingView ───────────────────────────────────────────────────────

export default function ReportingView({ token, teamMembers = [] }) {
  const [activeTab, setActiveTab] = useState("tasks");

  const TABS = [
    { id: "tasks", label: "📋 Open Tasks", desc: "View and filter tasks by member" },
    { id: "summary", label: "🤖 AI Summary", desc: "AI-generated workload summary" },
    { id: "ideas", label: "✨ Idea Generator", desc: "AI-powered content creator" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1060px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: C.text }}>📊 Reports & Tools</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Task visibility, AI summaries, and content idea generation.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px", borderRadius: "8px 8px 0 0",
              border: `1px solid ${activeTab === tab.id ? C.border : "transparent"}`,
              borderBottom: activeTab === tab.id ? `1px solid ${C.card}` : "1px solid transparent",
              background: activeTab === tab.id ? C.card : "transparent",
              color: activeTab === tab.id ? C.accent : C.muted,
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              marginBottom: "-1px", transition: "all 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "tasks" && <TaskReportsTab token={token} teamMembers={teamMembers} />}
      {activeTab === "summary" && <AISummaryTab token={token} />}
      {activeTab === "ideas" && <IdeaGeneratorTab token={token} />}
    </div>
  );
}
