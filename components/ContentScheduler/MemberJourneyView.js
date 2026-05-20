"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function textInput(extra = {}) {
  return {
    padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "8px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    boxSizing: "border-box", ...extra,
  };
}

function MemberInitials({ name, size = 28 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0 }}>
      {ini}
    </div>
  );
}

function EditableText({ value, onSave, multiline = false, placeholder = "Click to edit…", fontSize = "13px", color, bold = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [hov, setHov] = useState(false);

  useEffect(() => { setDraft(value || ""); }, [value]);

  const save = () => { setEditing(false); if (draft !== value) onSave(draft); };
  const cancel = () => { setDraft(value || ""); setEditing(false); };

  if (editing) {
    const shared = {
      value: draft, onChange: (e) => setDraft(e.target.value),
      autoFocus: true, onBlur: save,
      onKeyDown: (e) => { if (!multiline && e.key === "Enter") save(); if (e.key === "Escape") cancel(); },
      style: { ...textInput({ width: "100%", fontSize, fontWeight: bold ? "700" : "400", fontFamily: "inherit", resize: multiline ? "vertical" : "none", lineHeight: "1.6" }) },
    };
    return multiline
      ? <textarea {...shared} rows={4} />
      : <input {...shared} />;
  }

  return (
    <div
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Click to edit"
      style={{
        fontSize, fontWeight: bold ? "700" : "400",
        color: value ? (color || C.text) : C.muted,
        lineHeight: "1.7", cursor: "pointer", padding: "2px 4px",
        borderRadius: "4px",
        background: hov ? "rgba(99,102,241,0.06)" : "transparent",
        border: hov ? `1px dashed ${C.border}` : "1px dashed transparent",
        transition: "all 0.1s",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}
    >
      {value || <em style={{ opacity: 0.5, fontStyle: "italic" }}>{placeholder}</em>}
    </div>
  );
}

// ─── Editable Bullet Step ────────────────────────────────────────────────────

function BulletStep({ step, stageColor, stepIndex, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.text || "");
  const [hov, setHov] = useState(false);

  useEffect(() => { setDraft(step.text || ""); }, [step.text]);

  const save = () => {
    setEditing(false);
    if (draft.trim() && draft !== step.text) onEdit(step.id, draft.trim());
    else setDraft(step.text || "");
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "8px 12px",
        background: hov ? `${stageColor}08` : C.cardBg,
        borderRadius: "10px",
        border: `1px solid ${hov ? `${stageColor}25` : C.border}`,
        transition: "all 0.15s",
      }}
    >
      {/* Bullet */}
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
        background: stageColor, marginTop: "5px",
      }} />

      {/* Number */}
      <div style={{ fontSize: "9px", fontWeight: "800", color: C.muted, flexShrink: 0, minWidth: "14px", marginTop: "3px" }}>{stepIndex + 1}.</div>

      {/* Text */}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(step.text || ""); setEditing(false); } }}
          style={{ ...textInput({ flex: 1, fontSize: "13px", padding: "2px 6px" }) }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          title="Click to edit"
          style={{ flex: 1, fontSize: "13px", color: C.text, lineHeight: "1.5", cursor: "text", padding: "1px 0", wordBreak: "break-word" }}
        >
          {step.text}
        </span>
      )}

      {/* Delete */}
      {hov && !editing && (
        <button
          onClick={() => onDelete(step.id)}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "12px", opacity: 0.5, padding: "1px 3px", flexShrink: 0, marginTop: "1px" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Stage Pipeline Card ──────────────────────────────────────────────────────

function StageCard({ stage, isSelected, onClick, stageIndex, totalStages }) {
  const [hov, setHov] = useState(false);
  const assignedMembers = stage.assignedMembers || [];
  const stepCount = (stage.steps || []).length;

  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          flex: 1, minWidth: 0,
          background: isSelected ? stage.color : (hov ? C.hover : C.card),
          border: `2px solid ${isSelected ? stage.color : (hov ? stage.color : C.border)}`,
          borderRadius: "14px",
          padding: "16px 14px",
          cursor: "pointer",
          transition: "all 0.18s",
          boxShadow: isSelected ? `0 4px 20px ${stage.color}40` : (hov ? C.shadowMd : C.shadow),
          transform: isSelected ? "translateY(-3px)" : (hov ? "translateY(-1px)" : "none"),
          position: "relative",
        }}
      >
        {/* Icon */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: isSelected ? "rgba(255,255,255,0.25)" : `${stage.color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", marginBottom: "10px",
        }}>
          {stage.icon}
        </div>

        {/* Name */}
        <div style={{ fontSize: "13px", fontWeight: "800", color: isSelected ? "#fff" : C.text, marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {stage.name}
        </div>

        {/* Tagline */}
        <div style={{ fontSize: "10px", color: isSelected ? "rgba(255,255,255,0.75)" : C.muted, lineHeight: "1.3", marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {stage.tagline}
        </div>

        {/* Step count */}
        {stepCount > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "9px", color: isSelected ? "rgba(255,255,255,0.7)" : C.muted }}>{stepCount} step{stepCount !== 1 ? "s" : ""}</div>
          </div>
        )}

        {/* Assigned members */}
        {assignedMembers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {assignedMembers.slice(0, 3).map((m) => (
              <div key={m.id} title={m.name}>
                <MemberInitials name={m.name} size={18} />
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div style={{ fontSize: "9px", color: isSelected ? "rgba(255,255,255,0.8)" : C.muted, fontWeight: "700" }}>+{assignedMembers.length - 3}</div>
            )}
          </div>
        )}

        {/* Step number badge */}
        <div style={{
          position: "absolute", top: "10px", right: "10px",
          width: "20px", height: "20px", borderRadius: "50%",
          background: isSelected ? "rgba(255,255,255,0.3)" : C.cardBg,
          border: `1px solid ${isSelected ? "rgba(255,255,255,0.4)" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: "800",
          color: isSelected ? "#fff" : C.muted,
        }}>
          {stageIndex + 1}
        </div>
      </div>

      {/* Arrow connector */}
      {stageIndex < totalStages - 1 && (
        <div style={{ flexShrink: 0, width: "24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: "16px", color: C.border, userSelect: "none" }}>›</div>
        </div>
      )}
    </div>
  );
}

// ─── Stage Detail Panel ───────────────────────────────────────────────────────

function StageDetail({ stage, token, teamMembers, onUpdate }) {
  const [newStep, setNewStep] = useState("");
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [showAddResource, setShowAddResource] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = async (body) => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/memberjourney", { method: "PUT", body: JSON.stringify(body) }, token);
      const updated = await res.json();
      onUpdate(updated);
    } finally { setSaving(false); }
  };

  const updateField = (field, value) => patch({ stageAction: "updateStage", stageId: stage.id, patch: { [field]: value } });

  const addStep = async () => {
    if (!newStep.trim()) return;
    await patch({ stageAction: "addStep", stageId: stage.id, text: newStep.trim() });
    setNewStep("");
  };

  const editStep = (stepId, text) => patch({ stageAction: "editStep", stageId: stage.id, stepId, text });
  const deleteStep = (stepId) => patch({ stageAction: "deleteStep", stageId: stage.id, stepId });

  const addResource = async () => {
    if (!newResourceUrl.trim()) return;
    await patch({ stageAction: "addResource", stageId: stage.id, label: newResourceLabel.trim() || newResourceUrl.trim(), url: newResourceUrl.trim() });
    setNewResourceLabel(""); setNewResourceUrl(""); setShowAddResource(false);
  };

  const deleteResource = (resourceId) => patch({ stageAction: "deleteResource", stageId: stage.id, resourceId });

  // Multi-assignee toggle
  const assignedMembers = stage.assignedMembers || [];
  const toggleAssignee = (member) => {
    const exists = assignedMembers.find((m) => m.id === member.id);
    const updated = exists
      ? assignedMembers.filter((m) => m.id !== member.id)
      : [...assignedMembers, { id: member.id, name: member.name }];
    patch({ stageAction: "updateStage", stageId: stage.id, patch: { assignedMembers: updated } });
  };

  const steps = stage.steps || [];
  const resources = stage.resources || [];

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderTop: `4px solid ${stage.color}`,
      borderRadius: "16px",
      padding: "28px",
      boxShadow: C.shadowMd,
      marginTop: "16px",
      animation: "fadeSlideIn 0.2s ease",
    }}>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: `${stage.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
          {stage.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "22px", fontWeight: "800", color: C.text, marginBottom: "4px" }}>{stage.name}</div>
          <EditableText
            value={stage.tagline}
            onSave={(v) => updateField("tagline", v)}
            placeholder="Add a tagline…"
            fontSize="14px"
            color={C.muted}
          />
        </div>

        {/* Multi-assign members */}
        {teamMembers.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "10px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Assigned To</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxWidth: "240px" }}>
              {teamMembers.map((m) => {
                const assigned = assignedMembers.find((a) => a.id === m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleAssignee(m)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "4px 9px", borderRadius: "20px", border: "none", cursor: "pointer",
                      background: assigned ? `${stage.color}20` : C.cardBg,
                      border: `1px solid ${assigned ? stage.color : C.border}`,
                      fontSize: "11px", fontWeight: "600",
                      color: assigned ? stage.color : C.muted,
                      transition: "all 0.12s",
                    }}
                  >
                    <MemberInitials name={m.name} size={16} />
                    {m.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            {assignedMembers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
                {assignedMembers.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MemberInitials name={m.name} size={20} />
                    <span style={{ fontSize: "11px", color: C.text, fontWeight: "500" }}>{m.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Left: Description + Why It Matters + Notes + Resources */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: stage.color }}>●</span> About This Stage
            </div>
            <div style={{ padding: "14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
              <EditableText
                value={stage.description}
                onSave={(v) => updateField("description", v)}
                multiline
                placeholder="Describe what happens at this stage…"
                fontSize="13px"
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💡</span> Why This Matters
            </div>
            <div style={{ padding: "14px", background: "rgba(245,158,11,0.06)", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>
              <EditableText
                value={stage.whyImportant}
                onSave={(v) => updateField("whyImportant", v)}
                multiline
                placeholder="Explain why this stage is critical to the member journey…"
                fontSize="13px"
                color={C.text}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>📝 Team Notes</div>
            <div style={{ padding: "14px", background: C.cardBg, borderRadius: "10px", border: `1px solid ${C.border}` }}>
              <EditableText
                value={stage.notes}
                onSave={(v) => updateField("notes", v)}
                multiline
                placeholder="Add team notes, tips, scripts, or anything useful for this stage…"
                fontSize="13px"
              />
            </div>
          </div>

          {/* Resources */}
          <div>
            <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              🔗 Resources & Links
              <button onClick={() => setShowAddResource((v) => !v)} style={{ fontSize: "11px", color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>+ Add</button>
            </div>
            {showAddResource && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", padding: "10px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                <input value={newResourceLabel} onChange={(e) => setNewResourceLabel(e.target.value)} placeholder="Label (e.g. Tour Script)" style={{ ...textInput({ fontSize: "12px" }) }} />
                <input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addResource()} placeholder="https://…" style={{ ...textInput({ fontSize: "12px" }) }} />
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={addResource} disabled={!newResourceUrl.trim()} style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "none", background: newResourceUrl.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newResourceUrl.trim() ? "pointer" : "not-allowed" }}>Add Link</button>
                  <button onClick={() => setShowAddResource(false)} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {resources.length === 0 && !showAddResource && (
              <div style={{ fontSize: "12px", color: C.muted, fontStyle: "italic", padding: "8px 0" }}>No resources yet. Add scripts, guides, or links.</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {resources.map((r) => (
                <div key={r.id} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: C.cardBg, border: `1px solid ${C.border}`, fontSize: "12px" }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>🔗 {r.label}</a>
                  <button onClick={() => deleteResource(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "11px", padding: "0 1px" }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Process Steps (bullet points) */}
        <div>
          <div style={{ fontSize: "11px", color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: stage.color }}>●</span> Process Steps
            <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "400", color: C.muted }}>{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
          </div>

          {steps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 16px", background: C.cardBg, borderRadius: "10px", border: `1px dashed ${C.border}`, color: C.muted, fontSize: "12px", marginBottom: "12px" }}>
              No steps yet — add your first process step below.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {steps.map((step, i) => (
                <BulletStep
                  key={step.id}
                  step={step}
                  stageColor={stage.color}
                  stepIndex={i}
                  onEdit={editStep}
                  onDelete={deleteStep}
                />
              ))}
            </div>
          )}

          {/* Add step */}
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
              placeholder="+ Add a process step…"
              style={{ ...textInput({ flex: 1, fontSize: "12px" }) }}
            />
            <button
              onClick={addStep}
              disabled={!newStep.trim()}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: newStep.trim() ? stage.color : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: newStep.trim() ? "pointer" : "not-allowed", transition: "all 0.12s" }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Journey Overview Stats ───────────────────────────────────────────────────

function JourneyStats({ stages }) {
  const totalSteps = stages.reduce((a, s) => a + (s.steps || []).length, 0);
  const assignedStages = stages.filter((s) => (s.assignedMembers || []).length > 0).length;
  const totalAssigned = stages.reduce((a, s) => a + (s.assignedMembers || []).length, 0);

  const stats = [
    { label: "Journey Stages", value: stages.length, color: "#6366F1" },
    { label: "Total Process Steps", value: totalSteps, color: "#8B5CF6" },
    { label: "Stages with Owners", value: `${assignedStages}/${stages.length}`, color: "#10B981" },
    { label: "Team Assignments", value: totalAssigned, color: "#F59E0B" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 18px", boxShadow: C.shadow }}>
          <div style={{ fontSize: "24px", fontWeight: "800", color: s.color, marginBottom: "4px" }}>{s.value}</div>
          <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main MemberJourneyView ───────────────────────────────────────────────────

export default function MemberJourneyView({ token, teamMembers = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/memberjourney", {}, token)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.stages && d.stages.length > 0 && !selectedStageId) {
          setSelectedStageId(d.stages[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpdate = (updated) => {
    setData(updated);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>Loading member journey…</div>;
  }

  const stages = data?.stages || [];
  const selectedStage = stages.find((s) => s.id === selectedStageId);

  return (
    <div>
      {/* Intro */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: "800", color: C.text }}>🗺️ Member Journey</h2>
        <p style={{ margin: 0, fontSize: "13px", color: C.muted, lineHeight: "1.6" }}>
          Every step from first hearing about TCF to becoming a connected, lifelong member. Click any stage to view and edit its process, importance, and ownership.
        </p>
      </div>

      {/* Stats row */}
      <JourneyStats stages={stages} />

      {/* Pipeline */}
      <div style={{ display: "flex", alignItems: "stretch", gap: "0", marginBottom: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {stages.map((stage, i) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isSelected={selectedStageId === stage.id}
            onClick={() => setSelectedStageId(selectedStageId === stage.id ? null : stage.id)}
            stageIndex={i}
            totalStages={stages.length}
          />
        ))}
      </div>

      {/* Stage step indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
        {stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStageId(s.id)}
            style={{ width: selectedStageId === s.id ? "24px" : "6px", height: "6px", borderRadius: "3px", background: selectedStageId === s.id ? s.color : C.border, border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedStage && (
        <StageDetail
          key={selectedStage.id}
          stage={selectedStage}
          token={token}
          teamMembers={teamMembers}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
