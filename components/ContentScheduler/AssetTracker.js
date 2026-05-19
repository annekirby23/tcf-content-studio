"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

// ── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#3B82F6", "#06B6D4",
];

const ASSET_STATUSES = [
  { id: "needed",      label: "Needed",      color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  { id: "in-progress", label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
  { id: "in-review",   label: "In Review",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)"  },
  { id: "complete",    label: "Complete",     color: "#10B981", bg: "rgba(16,185,129,0.15)"  },
];

const STATUS_MAP = Object.fromEntries(ASSET_STATUSES.map((s) => [s.id, s]));
const STATUS_ORDER = ASSET_STATUSES.map((s) => s.id);

const ASSET_TYPES = [
  "Video",
  "Graphic / Image",
  "Photo",
  "Copy / Caption",
  "Logo / Brand",
  "Audio",
  "Animation",
  "Document",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  type: "",
  status: "needed",
  assignedTo: "",
  assignedToName: "",
  dueDate: "",
  driveUrl: "",
  postTitle: "",
  notes: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function nextStatus(currentId) {
  const idx = STATUS_ORDER.indexOf(currentId);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 28 }) {
  const color = getAvatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: "700",
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function StatusPill({ statusId, onClick, style }) {
  const cfg = STATUS_MAP[statusId] || STATUS_MAP["needed"];
  return (
    <button
      onClick={onClick}
      title={onClick ? "Click to advance status" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        color: cfg.color,
        fontSize: 12,
        fontWeight: "600",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {cfg.label}
    </button>
  );
}

function TypeBadge({ type }) {
  return (
    <span
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        color: C.muted,
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}

function InputField({ label, required, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  color: C.text,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

// ── Assignee Dropdown (inline) ───────────────────────────────────────────────

function AssigneeDropdown({ asset, teamMembers, onAssign, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        zIndex: 100,
        top: "100%",
        left: 0,
        marginTop: 4,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: C.shadowMd,
        minWidth: 180,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => onAssign(null)}
        style={{
          padding: "8px 12px",
          fontSize: 13,
          color: C.muted,
          cursor: "pointer",
          borderBottom: `1px solid ${C.border}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        Unassign
      </div>
      {teamMembers.map((m) => (
        <div
          key={m.id}
          onClick={() => onAssign(m)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            fontSize: 13,
            color: C.text,
            cursor: "pointer",
            background: asset.assignedTo === m.id ? C.accentLight : "transparent",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              asset.assignedTo === m.id ? C.accentLight : "transparent")
          }
        >
          <Avatar name={m.name} size={22} />
          <span>{m.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────

function AssetModal({ asset, teamMembers, onSave, onClose, saving }) {
  const isEdit = Boolean(asset?.id);
  const [form, setForm] = useState(
    asset
      ? {
          name: asset.name || "",
          type: asset.type || "",
          status: asset.status || "needed",
          assignedTo: asset.assignedTo || "",
          assignedToName: asset.assignedToName || "",
          dueDate: asset.dueDate ? asset.dueDate.slice(0, 10) : "",
          driveUrl: asset.driveUrl || "",
          postTitle: asset.postTitle || "",
          notes: asset.notes || "",
        }
      : { ...EMPTY_FORM }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAssigneeChange = (e) => {
    const id = e.target.value;
    const member = teamMembers.find((m) => m.id === id);
    set("assignedTo", id);
    set("assignedToName", member ? member.name : "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.type) return;
    onSave(form);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          boxShadow: C.shadowMd,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: "700",
              color: C.text,
            }}
          >
            {isEdit ? "Edit Asset" : "Add Asset"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: C.muted,
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Name — full width */}
            <InputField label="Name" required>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Asset name"
                required
              />
            </InputField>

            {/* Type + Status — 2 cols */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="Type" required>
                <select
                  style={inputStyle}
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  required
                >
                  <option value="">Select type…</option>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="Status" required>
                <select
                  style={inputStyle}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  required
                >
                  {ASSET_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </InputField>
            </div>

            {/* Assigned To + Due Date — 2 cols */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="Assigned To">
                <select
                  style={inputStyle}
                  value={form.assignedTo}
                  onChange={handleAssigneeChange}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="Due Date">
                <input
                  type="date"
                  style={inputStyle}
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </InputField>
            </div>

            {/* Google Drive URL — full width */}
            <InputField label="Google Drive URL">
              <input
                type="url"
                style={inputStyle}
                value={form.driveUrl}
                onChange={(e) => set("driveUrl", e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </InputField>

            {/* Related Post Title — full width */}
            <InputField label="Related Post Title">
              <input
                style={inputStyle}
                value={form.postTitle}
                onChange={(e) => set("postTitle", e.target.value)}
                placeholder="Optional context"
              />
            </InputField>

            {/* Notes — full width */}
            <InputField label="Notes">
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any notes…"
              />
            </InputField>
          </div>

          {/* Modal footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "none",
                fontSize: 14,
                color: C.muted,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: saving ? C.muted : C.accent,
                color: "#fff",
                fontSize: 14,
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AssetTracker({ currentUser, token, teamMembers }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selected, setSelected] = useState(new Set());
  const [assigneeDropdown, setAssigneeDropdown] = useState(null); // asset id
  const [modalAsset, setModalAsset] = useState(null); // null | {} (new) | asset (edit)
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/assets", {
        headers: { "x-session": token },
      });
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      setAssets(data);
    } catch (e) {
      setError(e.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  function authFetch(url, opts = {}) {
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "x-session": token,
        ...(opts.headers || {}),
      },
    });
  }

  // ── Status cycle ─────────────────────────────────────────────────────────

  async function handleStatusCycle(asset) {
    const newStatus = nextStatus(asset.status);
    // optimistic
    setAssets((prev) =>
      prev.map((a) => (a.id === asset.id ? { ...a, status: newStatus } : a))
    );
    try {
      const res = await authFetch(`/api/assets/${asset.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? updated : a))
      );
    } catch {
      // revert
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? asset : a))
      );
    }
  }

  // ── Assignee change ───────────────────────────────────────────────────────

  async function handleAssign(asset, member) {
    const updated = {
      ...asset,
      assignedTo: member ? member.id : "",
      assignedToName: member ? member.name : "",
    };
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));
    setAssigneeDropdown(null);
    try {
      const res = await authFetch(`/api/assets/${asset.id}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedTo: member ? member.id : null,
          assignedToName: member ? member.name : null,
        }),
      });
      if (!res.ok) throw new Error();
      const serverData = await res.json();
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? serverData : a))
      );
    } catch {
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
    }
  }

  // ── Save (add / edit) ────────────────────────────────────────────────────

  async function handleSave(form) {
    const isEdit = Boolean(modalAsset?.id);
    setSaving(true);
    try {
      let res, saved;
      if (isEdit) {
        res = await authFetch(`/api/assets/${modalAsset.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        res = await authFetch("/api/assets", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      saved = await res.json();

      if (isEdit) {
        setAssets((prev) =>
          prev.map((a) => (a.id === saved.id ? saved : a))
        );
      } else {
        setAssets((prev) => [saved, ...prev]);
      }
      setModalAsset(null);
    } catch {
      // leave modal open so user can retry
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(asset) {
    if (confirmDelete !== asset.id) {
      setConfirmDelete(asset.id);
      return;
    }
    setConfirmDelete(null);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    try {
      await authFetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    } catch {
      // restore
      setAssets((prev) => [...prev, asset]);
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = assets.filter((a) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterType && a.type !== filterType) return false;
    if (filterAssignee && a.assignedTo !== filterAssignee) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.name?.toLowerCase().includes(q) &&
        !a.postTitle?.toLowerCase().includes(q) &&
        !a.type?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // ── Status counts ─────────────────────────────────────────────────────────

  const statusCounts = Object.fromEntries(
    ASSET_STATUSES.map((s) => [
      s.id,
      assets.filter((a) => a.status === s.id).length,
    ])
  );

  // ── Select helpers ────────────────────────────────────────────────────────

  const allChecked =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  function canDelete(asset) {
    return (
      currentUser?.role === "admin" ||
      currentUser?.id === asset.createdBy
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "inherit",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: "700",
            color: C.text,
          }}
        >
          Digital Assets
        </h2>
        <button
          onClick={() => setModalAsset({})}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + Add Asset
        </button>
      </div>

      {/* ── Progress summary strip ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {ASSET_STATUSES.map((s) => {
          const active = filterStatus === s.id;
          return (
            <button
              key={s.id}
              onClick={() =>
                setFilterStatus(active ? "" : s.id)
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                borderRadius: 20,
                border: active
                  ? `1.5px solid ${C.accent}`
                  : `1px solid ${C.border}`,
                background: active ? C.accentLight : C.surface,
                cursor: "pointer",
                fontSize: 13,
                color: C.text,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: "500" }}>{s.label}</span>
              <span
                style={{
                  background: s.bg,
                  color: s.color,
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {statusCounts[s.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <input
          style={{
            ...inputStyle,
            width: "auto",
            flex: "1 1 180px",
            maxWidth: 280,
          }}
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Type filter */}
        <select
          style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Assignee filter */}
        <select
          style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        >
          <option value="">All assignees</option>
          {(teamMembers || []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            color: "#EF4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: C.muted,
            fontSize: 14,
          }}
        >
          Loading assets…
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "36px minmax(160px,2fr) 120px 120px 150px 90px 100px 80px",
              alignItems: "center",
              background: C.cardBg,
              borderBottom: `1px solid ${C.border}`,
              padding: "0 8px",
            }}
          >
            {[
              <input
                key="chk"
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                style={{ cursor: "pointer" }}
              />,
              "Name",
              "Type",
              "Status",
              "Assigned To",
              "Due Date",
              "Drive",
              "Actions",
            ].map((col, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 8px",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: C.muted,
                  userSelect: "none",
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Asset rows */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "56px 24px",
                color: C.muted,
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <div>No assets yet — add your first one</div>
            </div>
          ) : (
            filtered.map((asset, idx) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                isLast={idx === filtered.length - 1}
                isSelected={selected.has(asset.id)}
                teamMembers={teamMembers || []}
                canDelete={canDelete(asset)}
                assigneeDropdownOpen={assigneeDropdown === asset.id}
                confirmingDelete={confirmDelete === asset.id}
                onToggle={() => toggleOne(asset.id)}
                onStatusClick={() => handleStatusCycle(asset)}
                onAssigneeClick={() =>
                  setAssigneeDropdown(
                    assigneeDropdown === asset.id ? null : asset.id
                  )
                }
                onAssign={(member) => handleAssign(asset, member)}
                onAssigneeClose={() => setAssigneeDropdown(null)}
                onEdit={() => setModalAsset(asset)}
                onDelete={() => handleDelete(asset)}
                onAddDriveLink={() => setModalAsset(asset)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modalAsset !== null && (
        <AssetModal
          asset={modalAsset?.id ? modalAsset : null}
          teamMembers={teamMembers || []}
          onSave={handleSave}
          onClose={() => setModalAsset(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// ── Asset Row (extracted for readability) ────────────────────────────────────

function AssetRow({
  asset,
  isLast,
  isSelected,
  teamMembers,
  canDelete,
  assigneeDropdownOpen,
  confirmingDelete,
  onToggle,
  onStatusClick,
  onAssigneeClick,
  onAssign,
  onAssigneeClose,
  onEdit,
  onDelete,
  onAddDriveLink,
}) {
  const [hovered, setHovered] = useState(false);
  const overdue = isOverdue(asset.dueDate);
  const dueFmt = formatDate(asset.dueDate);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "36px minmax(160px,2fr) 120px 120px 150px 90px 100px 80px",
        alignItems: "center",
        padding: "0 8px",
        background: hovered ? C.hover : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${C.border}`,
        transition: "background 0.1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div style={{ padding: "10px 8px" }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* Name */}
      <div style={{ padding: "10px 8px" }}>
        <div
          style={{ fontWeight: "600", fontSize: 13, color: C.text }}
        >
          {asset.name}
        </div>
        {asset.postTitle && (
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 200,
            }}
          >
            {asset.postTitle}
          </div>
        )}
      </div>

      {/* Type */}
      <div style={{ padding: "10px 8px" }}>
        {asset.type ? <TypeBadge type={asset.type} /> : <span style={{ color: C.muted, fontSize: 13 }}>—</span>}
      </div>

      {/* Status */}
      <div style={{ padding: "10px 8px" }}>
        <StatusPill statusId={asset.status} onClick={onStatusClick} />
      </div>

      {/* Assigned To */}
      <div style={{ padding: "10px 8px", position: "relative" }}>
        {asset.assignedToName ? (
          <button
            onClick={onAssigneeClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: C.text,
              fontSize: 13,
            }}
          >
            <Avatar name={asset.assignedToName} size={24} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 90,
              }}
            >
              {asset.assignedToName}
            </span>
          </button>
        ) : (
          <button
            onClick={onAssigneeClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              fontSize: 13,
              padding: 0,
            }}
          >
            —
          </button>
        )}
        {assigneeDropdownOpen && (
          <AssigneeDropdown
            asset={asset}
            teamMembers={teamMembers}
            onAssign={onAssign}
            onClose={onAssigneeClose}
          />
        )}
      </div>

      {/* Due Date */}
      <div style={{ padding: "10px 8px" }}>
        {dueFmt ? (
          <span
            style={{
              fontSize: 13,
              color: overdue ? "#EF4444" : C.text,
              fontWeight: overdue ? "600" : "400",
            }}
          >
            {dueFmt}
          </span>
        ) : (
          <span style={{ color: C.muted, fontSize: 13 }}>—</span>
        )}
      </div>

      {/* Drive */}
      <div style={{ padding: "10px 8px" }}>
        {asset.driveUrl ? (
          <a
            href={asset.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: C.accent,
              fontSize: 12,
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            📁 Open
          </a>
        ) : (
          <button
            onClick={onAddDriveLink}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              fontSize: 12,
              padding: 0,
            }}
          >
            — add link
          </button>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: "10px 8px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Edit */}
        <button
          onClick={onEdit}
          title="Edit"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            padding: "3px 5px",
            borderRadius: 6,
            color: C.muted,
          }}
        >
          ✏️
        </button>

        {/* Delete (admin or creator only) */}
        {canDelete && (
          <button
            onClick={onDelete}
            title={confirmingDelete ? "Click again to confirm" : "Delete"}
            style={{
              background: confirmingDelete
                ? "rgba(239,68,68,0.12)"
                : "none",
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              padding: "3px 5px",
              borderRadius: 6,
              color: confirmingDelete ? "#EF4444" : C.muted,
            }}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
