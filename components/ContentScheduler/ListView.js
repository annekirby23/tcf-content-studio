"use client";

import { useState } from "react";
import { PLATFORMS, STATUSES, STATUS_MAP, PLATFORM_MAP, CONTENT_TYPES, PILLARS, PRIORITIES, C } from "./constants";

const SORT_OPTS = [
  { id: "date-asc", label: "Date (Earliest)" },
  { id: "date-desc", label: "Date (Latest)" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
  { id: "title", label: "Title" },
  { id: "created", label: "Recently Created" },
];

function FilterPill({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: "20px",
        border: `1px solid ${active ? (color || C.accent) : C.border}`,
        background: active ? (color ? `${color}25` : C.accentLight) : "transparent",
        color: active ? (color || C.accentBright) : C.muted,
        fontSize: "12px",
        fontWeight: active ? "600" : "400",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function ListView({ posts, campaigns, onEdit, onNewPost }) {
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterPillar, setFilterPillar] = useState("");
  const [sort, setSort] = useState("date-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const today = new Date().toISOString().split("T")[0];

  const filtered = posts
    .filter((p) => {
      if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.caption?.toLowerCase().includes(search.toLowerCase()) && !p.campaign?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPlatform && !p.platforms?.includes(filterPlatform)) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterCampaign && p.campaign !== filterCampaign) return false;
      if (filterPillar && p.pillar !== filterPillar) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "date-asc": return (`${a.scheduledDate || "9999"}T${a.scheduledTime || "00:00"}`).localeCompare(`${b.scheduledDate || "9999"}T${b.scheduledTime || "00:00"}`);
        case "date-desc": return (`${b.scheduledDate || "9999"}T${b.scheduledTime || "00:00"}`).localeCompare(`${a.scheduledDate || "9999"}T${a.scheduledTime || "00:00"}`);
        case "priority": return PRIORITIES.findIndex((p) => p.id === a.priority) - PRIORITIES.findIndex((p) => p.id === b.priority);
        case "status": return STATUSES.findIndex((s) => s.id === a.status) - STATUSES.findIndex((s) => s.id === b.status);
        case "title": return (a.title || "").localeCompare(b.title || "");
        case "created": return (b.createdAt || "").localeCompare(a.createdAt || "");
        default: return 0;
      }
    });

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "8px 12px",
    color: C.text,
    fontSize: "13px",
    outline: "none",
  };

  const colStyle = (flex, align = "left") => ({
    flex,
    textAlign: align,
    padding: "0 8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
          placeholder="Search posts, captions, campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowFilters((f) => !f)}
          style={{ ...inputStyle, cursor: "pointer", color: showFilters ? C.accentBright : C.muted, border: `1px solid ${showFilters ? C.accent : C.border}`, background: showFilters ? C.accentLight : "rgba(255,255,255,0.06)" }}
        >
          Filters {showFilters ? "▲" : "▼"}
        </button>
        <select
          style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "28px" }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button
          onClick={() => onNewPost()}
          style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", flexShrink: 0 }}
        >
          + New Post
        </button>
      </div>

      {/* Filter pills */}
      {showFilters && (
        <div style={{ marginBottom: "14px", padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${C.border}` }}>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Platform</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterPill label="All" active={!filterPlatform} onClick={() => setFilterPlatform("")} />
              {PLATFORMS.map((p) => (
                <FilterPill key={p.id} label={`${p.icon} ${p.label}`} active={filterPlatform === p.id} onClick={() => setFilterPlatform(filterPlatform === p.id ? "" : p.id)} color={p.color} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Status</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterPill label="All" active={!filterStatus} onClick={() => setFilterStatus("")} />
              {STATUSES.map((s) => (
                <FilterPill key={s.id} label={s.label} active={filterStatus === s.id} onClick={() => setFilterStatus(filterStatus === s.id ? "" : s.id)} color={s.color} />
              ))}
            </div>
          </div>
          {campaigns.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Campaign</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <FilterPill label="All" active={!filterCampaign} onClick={() => setFilterCampaign("")} />
                {campaigns.map((c) => (
                  <FilterPill key={c.id} label={c.name} active={filterCampaign === c.name} onClick={() => setFilterCampaign(filterCampaign === c.name ? "" : c.name)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: "12px", color: C.muted, marginBottom: "10px" }}>
        {filtered.length} post{filtered.length !== 1 ? "s" : ""}
        {selected.size > 0 && <span style={{ color: C.accentBright, marginLeft: "8px" }}>{selected.size} selected</span>}
      </div>

      {/* Table */}
      <div style={{ borderRadius: "12px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: "20px", marginRight: "12px", flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={selectAll}
              style={{ cursor: "pointer", accentColor: C.accent }}
            />
          </div>
          <div style={{ ...colStyle(3), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Title</div>
          <div style={{ ...colStyle(1.5), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Platforms</div>
          <div style={{ ...colStyle(1), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Status</div>
          <div style={{ ...colStyle(1.2), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Date</div>
          <div style={{ ...colStyle(1.2), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Campaign</div>
          <div style={{ ...colStyle(0.8), fontSize: "11px", fontWeight: "700", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Priority</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted, fontSize: "14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
            No posts match your filters
          </div>
        ) : (
          filtered.map((p, i) => {
            const statusCfg = STATUS_MAP[p.status] || {};
            const isOverdue = p.scheduledDate && p.scheduledDate < today && p.status !== "published";
            const priorityCfg = PRIORITIES.find((pr) => pr.id === p.priority);
            const isSelected = selected.has(p.id);
            const dayLabel = (() => {
              if (!p.scheduledDate) return "—";
              if (p.scheduledDate === today) return "Today";
              const [y, m, d] = p.scheduledDate.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            })();

            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  background: isSelected ? C.accentLight : "transparent",
                  transition: "background 0.1s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: "20px", marginRight: "12px", flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(p.id)}
                    style={{ cursor: "pointer", accentColor: C.accent }}
                  />
                </div>

                <div style={{ ...colStyle(3) }} onClick={() => onEdit(p)}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>{p.title}</div>
                  {p.caption && <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis" }}>{p.caption.slice(0, 60)}{p.caption.length > 60 ? "…" : ""}</div>}
                </div>

                <div style={{ ...colStyle(1.5) }} onClick={() => onEdit(p)}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {(p.platforms || []).slice(0, 4).map((pid) => {
                      const cfg = PLATFORM_MAP[pid];
                      return cfg ? (
                        <span key={pid} style={{ fontSize: "14px" }} title={cfg.label}>{cfg.icon}</span>
                      ) : null;
                    })}
                    {(!p.platforms || p.platforms.length === 0) && <span style={{ fontSize: "11px", color: C.muted }}>—</span>}
                  </div>
                </div>

                <div style={{ ...colStyle(1) }} onClick={() => onEdit(p)}>
                  <span style={{ padding: "3px 9px", borderRadius: "20px", background: statusCfg.bg, color: statusCfg.color, fontSize: "11px", fontWeight: "600" }}>
                    {statusCfg.label}
                  </span>
                </div>

                <div style={{ ...colStyle(1.2), fontSize: "12px", color: isOverdue ? "#EF4444" : C.muted, fontFamily: "monospace" }} onClick={() => onEdit(p)}>
                  {isOverdue && "⚠ "}{dayLabel}
                  {p.scheduledTime && <span style={{ color: C.muted, marginLeft: "4px" }}>{p.scheduledTime}</span>}
                </div>

                <div style={{ ...colStyle(1.2), fontSize: "12px", color: C.muted }} onClick={() => onEdit(p)}>
                  {p.campaign || "—"}
                </div>

                <div style={{ ...colStyle(0.8), fontSize: "11px", fontWeight: "600", color: priorityCfg?.color || C.muted, textTransform: "capitalize" }} onClick={() => onEdit(p)}>
                  {p.priority || "—"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
