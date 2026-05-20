"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./constants";
import ContentForm from "./ContentForm";
import Dashboard from "./Dashboard";
import CalendarView from "./CalendarView";
import Pipeline from "./Pipeline";
import ListView from "./ListView";
import AuthScreen from "./AuthScreen";
import TeamManager from "./TeamManager";
import IdeaBoard from "./IdeaBoard";
import SettingsModal from "./SettingsModal";
import SlackPlanner from "./SlackPlanner";
import QuickLinks from "./QuickLinks";
import AssetTracker from "./AssetTracker";
import MemberProfile from "./MemberProfile";
import MyDashboard from "./MyDashboard";
import TeamTaskTracker from "./TeamTaskTracker";
import TrainingView from "./TrainingView";
import EventsView from "./EventsView";

const TOKEN_KEY = "tcf_session";

const CONTENT_VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "pipeline", label: "Pipeline", icon: "⬛" },
  { id: "list", label: "List", icon: "☰" },
  { id: "slack", label: "Slack", icon: "💬" },
  { id: "links", label: "Quick Links", icon: "🔗" },
  { id: "assets", label: "Assets", icon: "📦" },
];

const INTERNAL_VIEW = { id: "internal", label: "Internal", icon: "🔒" };

// ─── Avatar helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function UserAvatar({ name, size = 26 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(name), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.38), fontWeight: "700", flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

// ─── Internal View ───────────────────────────────────────────────────────────

function genHex() {
  return Math.random().toString(16).slice(2, 10);
}

function InventoryRow({ item, isEditing, isLast, editForm, setEditForm, onSaveEdit, onCancelEdit, onStartEdit, onDelete, onStatusChange, NEEDED_COLORS, STATUS_COLORS, NEEDED_WHEN_OPTIONS, ORDER_STATUS_OPTIONS, LOCATION_OPTIONS, AvatarSmall, inputS }) {
  const [rowHov, setRowHov] = useState(false);
  const nwCfg = NEEDED_COLORS[item.neededWhen] || { color:C.muted, bg:C.cardBg };
  const stCfg = STATUS_COLORS[item.orderStatus] || { color:C.muted, bg:C.cardBg };
  return (
    <div
      style={{ display:"grid", gridTemplateColumns:"2fr 90px 130px 1fr 130px 70px 1fr 60px 60px", borderBottom: !isLast ? `1px solid ${C.border}` : "none", padding:"0 8px", background:rowHov ? C.hover : "transparent", transition:"background 0.1s", alignItems:"center" }}
      onMouseEnter={()=>setRowHov(true)} onMouseLeave={()=>setRowHov(false)}
    >
      {isEditing ? (
        <>
          <div style={{ padding:"8px" }}><input value={editForm.itemName||""} onChange={(e)=>setEditForm((f)=>({...f,itemName:e.target.value}))} style={{ ...inputS, width:"100%" }} /></div>
          <div style={{ padding:"8px", fontSize:"12px", color:C.muted }}>{item.date}</div>
          <div style={{ padding:"8px" }}><select value={editForm.neededWhen||""} onChange={(e)=>setEditForm((f)=>({...f,neededWhen:e.target.value}))} style={{ ...inputS, width:"100%" }}><option value="">—</option>{NEEDED_WHEN_OPTIONS.map((n)=><option key={n} value={n}>{n}</option>)}</select></div>
          <div style={{ padding:"8px" }}><input value={editForm.forWhat||""} onChange={(e)=>setEditForm((f)=>({...f,forWhat:e.target.value}))} style={{ ...inputS, width:"100%" }} /></div>
          <div style={{ padding:"8px" }}><select value={editForm.orderStatus||"Not Started"} onChange={(e)=>setEditForm((f)=>({...f,orderStatus:e.target.value}))} style={{ ...inputS, width:"100%" }}>{ORDER_STATUS_OPTIONS.map((s)=><option key={s} value={s}>{s}</option>)}</select></div>
          <div style={{ padding:"8px" }}><select value={editForm.location||""} onChange={(e)=>setEditForm((f)=>({...f,location:e.target.value}))} style={{ ...inputS, width:"100%" }}><option value="">—</option>{LOCATION_OPTIONS.map((l)=><option key={l} value={l}>{l}</option>)}</select></div>
          <div style={{ padding:"8px" }}><input value={editForm.notes||""} onChange={(e)=>setEditForm((f)=>({...f,notes:e.target.value}))} style={{ ...inputS, width:"100%" }} /></div>
          <div style={{ padding:"8px" }}>{item.personAdded && <AvatarSmall name={item.personAdded} />}</div>
          <div style={{ padding:"8px", display:"flex", gap:"4px" }}>
            <button onClick={onSaveEdit} style={{ fontSize:"11px", padding:"4px 8px", borderRadius:"6px", border:"none", background:C.accent, color:"#fff", cursor:"pointer" }}>✓</button>
            <button onClick={onCancelEdit} style={{ fontSize:"11px", padding:"4px 8px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"none", color:C.muted, cursor:"pointer" }}>✕</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding:"10px 8px", fontSize:"13px", fontWeight:"600", color:C.text }}>{item.itemName}</div>
          <div style={{ padding:"10px 8px", fontSize:"12px", color:C.muted }}>{item.date}</div>
          <div style={{ padding:"10px 8px" }}>{item.neededWhen && <span style={{ padding:"2px 8px", borderRadius:"20px", background:nwCfg.bg, color:nwCfg.color, fontSize:"11px", fontWeight:"600" }}>{item.neededWhen}</span>}</div>
          <div style={{ padding:"10px 8px", fontSize:"13px", color:C.text }}>{item.forWhat}</div>
          <div style={{ padding:"6px 8px" }}>
            <div style={{ position:"relative", display:"inline-block", borderRadius:"20px", background:stCfg.bg }}>
              <select
                value={item.orderStatus}
                onChange={(e) => onStatusChange(item.id, e.target.value)}
                style={{ appearance:"none", WebkitAppearance:"none", border:"none", background:"transparent", color:stCfg.color, fontSize:"11px", fontWeight:"600", padding:"2px 20px 2px 8px", cursor:"pointer", outline:"none", fontFamily:"inherit" }}
              >
                {ORDER_STATUS_OPTIONS.map((s)=><option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position:"absolute", right:"6px", top:"50%", transform:"translateY(-50%)", fontSize:"8px", color:stCfg.color, pointerEvents:"none" }}>▼</span>
            </div>
          </div>
          <div style={{ padding:"10px 8px" }}>{item.location && <span style={{ padding:"2px 8px", borderRadius:"6px", background:C.cardBg, border:`1px solid ${C.border}`, fontSize:"11px", color:C.muted }}>{item.location}</span>}</div>
          <div style={{ padding:"10px 8px", fontSize:"12px", color:C.muted }}>{item.notes}</div>
          <div style={{ padding:"10px 8px" }}>{item.personAdded && <AvatarSmall name={item.personAdded} />}</div>
          <div style={{ padding:"10px 8px", display:"flex", gap:"4px", alignItems:"center" }}>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:"14px", color:C.accent, textDecoration:"none" }} title={item.url}>🔗</a>}
            {rowHov && <>
              <button onClick={onStartEdit} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px", color:C.muted, padding:"2px" }}>✏️</button>
              <button onClick={onDelete} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px", color:"#EF4444", padding:"2px" }}>🗑</button>
            </>}
          </div>
        </>
      )}
    </div>
  );
}

function InventoryTab({ token, currentUser }) {
  const NEEDED_WHEN_OPTIONS = ["Next Amazon Order", "Wish List", "Weekly Order", "Next Trip", "ASAP"];
  const ORDER_STATUS_OPTIONS = ["Not Started", "Ordered", "In Progress", "Received", "Cancelled"];
  const LOCATION_OPTIONS = ["321", "342", "812"];

  const NEEDED_COLORS = {
    "Next Amazon Order": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
    "Wish List": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    "Weekly Order": { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
    "Next Trip": { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
    "ASAP": { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  };

  const STATUS_COLORS = {
    "Not Started": { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
    "Ordered": { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
    "In Progress": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    "Received": { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
    "Cancelled": { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNeeded, setFilterNeeded] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const emptyForm = { itemName: "", neededWhen: "", forWhat: "", orderStatus: "Not Started", location: "", notes: "", url: "" };
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetch("/api/inventory", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = items.filter((item) => {
    if (filterStatus && item.orderStatus !== filterStatus) return false;
    if (filterNeeded && item.neededWhen !== filterNeeded) return false;
    if (filterLocation && item.location !== filterLocation) return false;
    return true;
  });

  const saveAdd = async () => {
    if (!addForm.itemName.trim()) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const saved = await res.json();
        setItems((p) => [saved, ...p]);
        setAddForm(emptyForm);
        setShowAdd(false);
      }
    } catch {}
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        const saved = await res.json();
        setItems((p) => p.map((it) => it.id === id ? saved : it));
        setEditingId(null);
      }
    } catch {}
  };

  const handleStatusChange = async (id, newStatus) => {
    setItems((p) => p.map((it) => it.id === id ? { ...it, orderStatus: newStatus } : it));
    try {
      await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ id, orderStatus: newStatus }),
      });
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setItems((p) => p.filter((it) => it.id !== id));
    try {
      await fetch(`/api/inventory?id=${id}`, { method: "DELETE", headers: { "x-session": token } });
    } catch {}
  };

  const inputS = { padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: "7px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  function AvatarSmall({ name }) {
    const colors = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
    let h = 0; for (let i = 0; i < (name||"").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    const bg = colors[Math.abs(h) % colors.length];
    const ini = (name||"?").split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0,2);
    return <div style={{ width:24, height:24, borderRadius:"50%", background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:"700", flexShrink:0 }}>{ini}</div>;
  }

  if (loading) return <div style={{ textAlign:"center", padding:"48px", color:C.muted }}>Loading inventory…</div>;

  return (
    <div>
      {/* Filter bar + Add button */}
      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"16px", flexWrap:"wrap" }}>
        <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} style={{ ...inputS, flex:"0 0 auto" }}>
          <option value="">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map((s)=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterNeeded} onChange={(e)=>setFilterNeeded(e.target.value)} style={{ ...inputS, flex:"0 0 auto" }}>
          <option value="">All Timings</option>
          {NEEDED_WHEN_OPTIONS.map((n)=><option key={n} value={n}>{n}</option>)}
        </select>
        {/* Location filter chips */}
        <div style={{ display:"flex", gap:"4px" }}>
          {[["All",""], ["321","321"], ["342","342"], ["812","812"]].map(([label, val]) => (
            <button
              key={val}
              onClick={() => setFilterLocation(val)}
              style={{
                padding:"4px 10px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:"600",
                background: filterLocation === val ? C.accent : C.cardBg,
                color: filterLocation === val ? "#fff" : C.muted,
                transition:"all 0.12s",
              }}
            >{label}</button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <button onClick={()=>setShowAdd((v)=>!v)} style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          {showAdd ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", marginBottom:"16px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"10px" }}>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Item Name *</label>
            <input value={addForm.itemName} onChange={(e)=>setAddForm((f)=>({...f,itemName:e.target.value}))} style={{ ...inputS, width:"100%" }} placeholder="What's needed?" /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Needed When</label>
            <select value={addForm.neededWhen} onChange={(e)=>setAddForm((f)=>({...f,neededWhen:e.target.value}))} style={{ ...inputS, width:"100%" }}>
              <option value="">Select…</option>
              {NEEDED_WHEN_OPTIONS.map((n)=><option key={n} value={n}>{n}</option>)}
            </select></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>For What</label>
            <input value={addForm.forWhat} onChange={(e)=>setAddForm((f)=>({...f,forWhat:e.target.value}))} style={{ ...inputS, width:"100%" }} placeholder="Purpose…" /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Status</label>
            <select value={addForm.orderStatus} onChange={(e)=>setAddForm((f)=>({...f,orderStatus:e.target.value}))} style={{ ...inputS, width:"100%" }}>
              {ORDER_STATUS_OPTIONS.map((s)=><option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Location</label>
            <select value={addForm.location} onChange={(e)=>setAddForm((f)=>({...f,location:e.target.value}))} style={{ ...inputS, width:"100%" }}>
              <option value="">—</option>
              {LOCATION_OPTIONS.map((l)=><option key={l} value={l}>{l}</option>)}
            </select></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>URL</label>
            <input value={addForm.url} onChange={(e)=>setAddForm((f)=>({...f,url:e.target.value}))} style={{ ...inputS, width:"100%" }} placeholder="https://…" /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Notes</label>
            <input value={addForm.notes} onChange={(e)=>setAddForm((f)=>({...f,notes:e.target.value}))} style={{ ...inputS, width:"100%" }} placeholder="Notes…" /></div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"8px" }}>
            <button onClick={saveAdd} style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save</button>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"8px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ border:`1px solid ${C.border}`, borderRadius:"12px", overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 90px 130px 1fr 130px 70px 1fr 60px 60px", background:C.cardBg, borderBottom:`1px solid ${C.border}`, padding:"0 8px" }}>
          {["Item Needed","Date","Needed When","For What","Status","Location","Notes","Person","Link"].map((h,i)=>(
            <div key={i} style={{ padding:"10px 8px", fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.05em", color:C.muted }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px", color:C.muted, fontSize:"14px" }}>No inventory items yet</div>
        ) : filtered.map((item, i) => (
          <InventoryRow
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            isLast={i === filtered.length - 1}
            editForm={editForm}
            setEditForm={setEditForm}
            onSaveEdit={()=>saveEdit(item.id)}
            onCancelEdit={()=>setEditingId(null)}
            onStartEdit={()=>{ setEditingId(item.id); setEditForm({ itemName:item.itemName, neededWhen:item.neededWhen, forWhat:item.forWhat, orderStatus:item.orderStatus, location:item.location||"", notes:item.notes, url:item.url }); }}
            onDelete={()=>handleDelete(item.id)}
            onStatusChange={handleStatusChange}
            NEEDED_COLORS={NEEDED_COLORS}
            STATUS_COLORS={STATUS_COLORS}
            NEEDED_WHEN_OPTIONS={NEEDED_WHEN_OPTIONS}
            ORDER_STATUS_OPTIONS={ORDER_STATUS_OPTIONS}
            LOCATION_OPTIONS={LOCATION_OPTIONS}
            AvatarSmall={AvatarSmall}
            inputS={inputS}
          />
        ))}
      </div>
    </div>
  );
}

function ContactsTab({ token }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyForm = { name:"", role:"", phone:"", email:"", notes:"" };
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [hoverIds, setHoverIds] = useState(new Set());

  useEffect(() => {
    fetch("/api/internal", { headers:{"x-session":token} })
      .then((r)=>r.json())
      .then((d)=>setContacts(Array.isArray(d?.contacts) ? d.contacts : []))
      .catch(()=>setContacts([]))
      .finally(()=>setLoading(false));
  }, [token]);

  const save = async (contacts) => {
    await fetch("/api/internal", {
      method:"PUT", headers:{"Content-Type":"application/json","x-session":token},
      body:JSON.stringify({ contacts }),
    });
  };

  const addContact = async () => {
    if (!addForm.name.trim()) return;
    const newContact = { ...addForm, id: genHex() };
    const updated = [newContact, ...contacts];
    setContacts(updated);
    setAddForm(emptyForm);
    setShowAdd(false);
    await save(updated);
  };

  const updateContact = async (id) => {
    const updated = contacts.map((c)=>c.id===id ? { ...c, ...editForm } : c);
    setContacts(updated);
    setEditingId(null);
    await save(updated);
  };

  const deleteContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    const updated = contacts.filter((c)=>c.id!==id);
    setContacts(updated);
    await save(updated);
  };

  const inputS = { padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:"8px", background:C.inputBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };

  if (loading) return <div style={{ textAlign:"center", padding:"48px", color:C.muted }}>Loading contacts…</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
        <button onClick={()=>setShowAdd((v)=>!v)} style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          {showAdd ? "Cancel" : "+ Add Contact"}
        </button>
      </div>
      {showAdd && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", marginBottom:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Name *</label><input value={addForm.name} onChange={(e)=>setAddForm((f)=>({...f,name:e.target.value}))} style={inputS} /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Role</label><input value={addForm.role} onChange={(e)=>setAddForm((f)=>({...f,role:e.target.value}))} style={inputS} /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Phone</label><input value={addForm.phone} onChange={(e)=>setAddForm((f)=>({...f,phone:e.target.value}))} style={inputS} /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Email</label><input value={addForm.email} onChange={(e)=>setAddForm((f)=>({...f,email:e.target.value}))} style={inputS} /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Notes</label><input value={addForm.notes} onChange={(e)=>setAddForm((f)=>({...f,notes:e.target.value}))} style={inputS} /></div>
          <div style={{ gridColumn:"1/-1", display:"flex", gap:"8px" }}>
            <button onClick={addContact} style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save Contact</button>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"8px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {contacts.length === 0 && <div style={{ textAlign:"center", padding:"48px", color:C.muted, fontSize:"14px" }}>No contacts yet. Add the first one!</div>}
        {contacts.map((c) => (
          <div key={c.id}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", position:"relative" }}
            onMouseEnter={()=>setHoverIds((h)=>{ const n=new Set(h); n.add(c.id); return n; })}
            onMouseLeave={()=>setHoverIds((h)=>{ const n=new Set(h); n.delete(c.id); return n; })}
          >
            {editingId === c.id ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Name</label><input value={editForm.name||""} onChange={(e)=>setEditForm((f)=>({...f,name:e.target.value}))} style={inputS} /></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Role</label><input value={editForm.role||""} onChange={(e)=>setEditForm((f)=>({...f,role:e.target.value}))} style={inputS} /></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Phone</label><input value={editForm.phone||""} onChange={(e)=>setEditForm((f)=>({...f,phone:e.target.value}))} style={inputS} /></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Email</label><input value={editForm.email||""} onChange={(e)=>setEditForm((f)=>({...f,email:e.target.value}))} style={inputS} /></div>
                <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Notes</label><input value={editForm.notes||""} onChange={(e)=>setEditForm((f)=>({...f,notes:e.target.value}))} style={inputS} /></div>
                <div style={{ gridColumn:"1/-1", display:"flex", gap:"8px" }}>
                  <button onClick={()=>updateContact(c.id)} style={{ padding:"7px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditingId(null)} style={{ padding:"7px 12px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:"15px", fontWeight:"700", color:C.text }}>{c.name}</div>
                    {c.role && <div style={{ fontSize:"12px", color:C.muted, marginTop:"2px" }}>{c.role}</div>}
                  </div>
                  {hoverIds.has(c.id) && (
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={()=>{ setEditingId(c.id); setEditForm({...c}); }} style={{ padding:"4px 10px", borderRadius:"6px", border:`1px solid ${C.border}`, background:C.cardBg, color:C.muted, fontSize:"12px", cursor:"pointer" }}>Edit</button>
                      <button onClick={()=>deleteContact(c.id)} style={{ padding:"4px 10px", borderRadius:"6px", border:"1px solid #FECACA", background:"rgba(239,68,68,0.06)", color:"#EF4444", fontSize:"12px", cursor:"pointer" }}>Delete</button>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:"16px", marginTop:"10px", flexWrap:"wrap" }}>
                  {c.phone && <span style={{ fontSize:"13px", color:C.text }}>📞 {c.phone}</span>}
                  {c.email && <span style={{ fontSize:"13px", color:C.text }}>✉️ {c.email}</span>}
                </div>
                {c.notes && <div style={{ fontSize:"13px", color:C.muted, marginTop:"8px", lineHeight:"1.5" }}>{c.notes}</div>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MembershipsTab({ token }) {
  const BILLING_OPTIONS = ["monthly", "annual", "one-time"];
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyForm = { name:"", cost:"", billingCycle:"monthly", details:"", link:"" };
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [hoverIds, setHoverIds] = useState(new Set());

  useEffect(() => {
    fetch("/api/internal", { headers:{"x-session":token} })
      .then((r)=>r.json())
      .then((d)=>setMemberships(Array.isArray(d?.memberships) ? d.memberships : []))
      .catch(()=>setMemberships([]))
      .finally(()=>setLoading(false));
  }, [token]);

  const save = async (memberships) => {
    await fetch("/api/internal", {
      method:"PUT", headers:{"Content-Type":"application/json","x-session":token},
      body:JSON.stringify({ memberships }),
    });
  };

  const addMembership = async () => {
    if (!addForm.name.trim()) return;
    const item = { ...addForm, id: genHex() };
    const updated = [item, ...memberships];
    setMemberships(updated);
    setAddForm(emptyForm);
    setShowAdd(false);
    await save(updated);
  };

  const updateMembership = async (id) => {
    const updated = memberships.map((m)=>m.id===id ? { ...m, ...editForm } : m);
    setMemberships(updated);
    setEditingId(null);
    await save(updated);
  };

  const deleteMembership = async (id) => {
    if (!window.confirm("Delete this membership?")) return;
    const updated = memberships.filter((m)=>m.id!==id);
    setMemberships(updated);
    await save(updated);
  };

  const inputS = { padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:"8px", background:C.inputBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };

  if (loading) return <div style={{ textAlign:"center", padding:"48px", color:C.muted }}>Loading memberships…</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
        <button onClick={()=>setShowAdd((v)=>!v)} style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          {showAdd ? "Cancel" : "+ Add Membership"}
        </button>
      </div>
      {showAdd && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", marginBottom:"16px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
          <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Name *</label><input value={addForm.name} onChange={(e)=>setAddForm((f)=>({...f,name:e.target.value}))} style={inputS} placeholder="e.g. Canva Pro" /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Cost ($)</label><input type="number" value={addForm.cost} onChange={(e)=>setAddForm((f)=>({...f,cost:e.target.value}))} style={inputS} placeholder="0" /></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Billing Cycle</label>
            <select value={addForm.billingCycle} onChange={(e)=>setAddForm((f)=>({...f,billingCycle:e.target.value}))} style={inputS}>
              {BILLING_OPTIONS.map((b)=><option key={b} value={b}>{b}</option>)}
            </select></div>
          <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Link</label><input value={addForm.link} onChange={(e)=>setAddForm((f)=>({...f,link:e.target.value}))} style={inputS} placeholder="https://…" /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Details</label><textarea value={addForm.details} onChange={(e)=>setAddForm((f)=>({...f,details:e.target.value}))} rows={2} style={{ ...inputS, resize:"vertical" }} placeholder="What's included, login info, notes…" /></div>
          <div style={{ gridColumn:"1/-1", display:"flex", gap:"8px" }}>
            <button onClick={addMembership} style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save Membership</button>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"8px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {memberships.length === 0 && <div style={{ textAlign:"center", padding:"48px", color:C.muted, fontSize:"14px" }}>No memberships yet. Add the first one!</div>}
        {memberships.map((m) => (
          <div key={m.id}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px" }}
            onMouseEnter={()=>setHoverIds((h)=>{ const n=new Set(h); n.add(m.id); return n; })}
            onMouseLeave={()=>setHoverIds((h)=>{ const n=new Set(h); n.delete(m.id); return n; })}
          >
            {editingId === m.id ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Name</label><input value={editForm.name||""} onChange={(e)=>setEditForm((f)=>({...f,name:e.target.value}))} style={inputS} /></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Cost ($)</label><input type="number" value={editForm.cost||""} onChange={(e)=>setEditForm((f)=>({...f,cost:e.target.value}))} style={inputS} /></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Billing</label><select value={editForm.billingCycle||"monthly"} onChange={(e)=>setEditForm((f)=>({...f,billingCycle:e.target.value}))} style={inputS}>{BILLING_OPTIONS.map((b)=><option key={b} value={b}>{b}</option>)}</select></div>
                <div><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Link</label><input value={editForm.link||""} onChange={(e)=>setEditForm((f)=>({...f,link:e.target.value}))} style={inputS} /></div>
                <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"3px" }}>Details</label><textarea value={editForm.details||""} onChange={(e)=>setEditForm((f)=>({...f,details:e.target.value}))} rows={2} style={{ ...inputS, resize:"vertical" }} /></div>
                <div style={{ gridColumn:"1/-1", display:"flex", gap:"8px" }}>
                  <button onClick={()=>updateMembership(m.id)} style={{ padding:"7px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditingId(null)} style={{ padding:"7px 12px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                    <span style={{ fontSize:"15px", fontWeight:"700", color:C.text }}>{m.name}</span>
                    {m.cost && <span style={{ padding:"2px 8px", borderRadius:"20px", background:`${C.accent}18`, color:C.accent, fontSize:"11px", fontWeight:"700" }}>${m.cost}/{m.billingCycle}</span>}
                  </div>
                  {m.details && <div style={{ fontSize:"13px", color:C.muted, lineHeight:"1.5", marginBottom:"6px", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{m.details}</div>}
                  {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:"12px", color:C.accent, textDecoration:"none" }}>🔗 Visit</a>}
                </div>
                {hoverIds.has(m.id) && (
                  <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                    <button onClick={()=>{ setEditingId(m.id); setEditForm({...m}); }} style={{ padding:"4px 10px", borderRadius:"6px", border:`1px solid ${C.border}`, background:C.cardBg, color:C.muted, fontSize:"12px", cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>deleteMembership(m.id)} style={{ padding:"4px 10px", borderRadius:"6px", border:"1px solid #FECACA", background:"rgba(239,68,68,0.06)", color:"#EF4444", fontSize:"12px", cursor:"pointer" }}>Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HRInfoTab({ token }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    fetch("/api/internal", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.hrSections) && d.hrSections.length > 0) {
          setSections(d.hrSections);
          setExpandedIds(new Set([d.hrSections[0]?.id]));
        } else if (d?.hrInfo) {
          const migrated = [{ id: "legacy", title: "General HR Info", content: d.hrInfo }];
          setSections(migrated);
          setExpandedIds(new Set(["legacy"]));
        } else {
          setSections([]);
        }
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [token]);

  const saveSections = async (updated) => {
    await fetch("/api/internal", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-session": token },
      body: JSON.stringify({ hrSections: updated }),
    });
  };

  const addSection = async () => {
    if (!addForm.title.trim()) return;
    const section = { id: genHex(), ...addForm };
    const updated = [...sections, section];
    setSections(updated);
    setAddForm({ title: "", content: "" });
    setShowAdd(false);
    setExpandedIds((prev) => { const n = new Set(prev); n.add(section.id); return n; });
    await saveSections(updated);
  };

  const updateSection = async (id) => {
    const updated = sections.map((s) => s.id === id ? { ...s, ...editForm } : s);
    setSections(updated);
    setEditingId(null);
    await saveSections(updated);
  };

  const deleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    await saveSections(updated);
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const inputS = { padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:"8px", background:C.inputBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };

  if (loading) return <div style={{ textAlign:"center", padding:"48px", color:C.muted }}>Loading HR info…</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}
        >
          {showAdd ? "Cancel" : "+ Add Section"}
        </button>
      </div>

      {showAdd && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", marginBottom:"16px", display:"flex", flexDirection:"column", gap:"10px" }}>
          <div>
            <label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Section Title *</label>
            <input value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} style={inputS} placeholder="e.g. Benefits, PTO Policy, Onboarding, Payroll…" autoFocus />
          </div>
          <div>
            <label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Content</label>
            <textarea value={addForm.content} onChange={(e) => setAddForm((f) => ({ ...f, content: e.target.value }))} rows={5} style={{ ...inputS, resize:"vertical" }} placeholder="Add details, policies, links, contacts, instructions…" />
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={addSection} style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Add Section</button>
            <button onClick={() => { setShowAdd(false); setAddForm({ title:"", content:"" }); }} style={{ padding:"8px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {sections.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted, fontSize:"14px", background:C.card, border:`1px dashed ${C.border}`, borderRadius:"12px" }}>
            <div style={{ fontSize:"32px", marginBottom:"8px" }}>🏢</div>
            No HR sections yet. Add the first one above!
          </div>
        )}
        {sections.map((section) => (
          <div key={section.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", overflow:"hidden" }}>
            {editingId === section.id ? (
              <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Title</label>
                  <input value={editForm.title||""} onChange={(e) => setEditForm((f) => ({ ...f, title:e.target.value }))} style={inputS} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"4px" }}>Content</label>
                  <textarea value={editForm.content||""} onChange={(e) => setEditForm((f) => ({ ...f, content:e.target.value }))} rows={7} style={{ ...inputS, resize:"vertical" }} />
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => updateSection(section.id)} style={{ padding:"7px 16px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding:"7px 12px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => toggleExpand(section.id)}
                  style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}
                >
                  <span style={{ fontSize:"14px", fontWeight:"700", color:C.text }}>{section.title}</span>
                  <span style={{ fontSize:"10px", color:C.muted, transform:expandedIds.has(section.id) ? "rotate(90deg)" : "rotate(0deg)", display:"inline-block", transition:"transform 0.12s" }}>▶</span>
                </button>
                {expandedIds.has(section.id) && (
                  <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${C.border}` }}>
                    {section.content ? (
                      <div style={{ fontSize:"13px", color:C.text, lineHeight:"1.6", whiteSpace:"pre-wrap", wordBreak:"break-word", paddingTop:"12px" }}>
                        {section.content}
                      </div>
                    ) : (
                      <div style={{ fontSize:"13px", color:C.muted, fontStyle:"italic", paddingTop:"12px" }}>No content yet. Click Edit to add details.</div>
                    )}
                    <div style={{ display:"flex", gap:"8px", marginTop:"14px" }}>
                      <button
                        onClick={() => { setEditingId(section.id); setEditForm({ ...section }); }}
                        style={{ padding:"5px 12px", borderRadius:"6px", border:`1px solid ${C.border}`, background:C.cardBg, color:C.muted, fontSize:"12px", cursor:"pointer" }}
                      >
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        style={{ padding:"5px 12px", borderRadius:"6px", border:"1px solid #FECACA", background:"rgba(239,68,68,0.06)", color:"#EF4444", fontSize:"12px", cursor:"pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PTOEmbedTab({ token }) {
  const [savedUrl, setSavedUrl] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/internal", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((d) => { setSavedUrl(d?.ptoEmbedUrl || ""); setInputVal(d?.ptoEmbedUrl || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/internal", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ ptoEmbedUrl: inputVal }),
      });
      if (res.ok) {
        const d = await res.json();
        setSavedUrl(d.ptoEmbedUrl || "");
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign:"center", padding:"48px", color:C.muted }}>Loading…</div>;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", fontSize:"15px", fontWeight:"700", color:C.text }}>PTO / Vacation Form</h2>
          <p style={{ margin:0, fontSize:"13px", color:C.muted }}>Embed a Google Form or any URL for PTO requests.</p>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          style={{ padding:"7px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:C.cardBg, color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer" }}
        >
          ⚙ {savedUrl ? "Change URL" : "Set URL"}
        </button>
      </div>

      {editing && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px", marginBottom:"20px" }}>
          <label style={{ fontSize:"11px", color:C.muted, fontWeight:"600", display:"block", marginBottom:"6px" }}>Embed URL</label>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="https://docs.google.com/forms/d/e/…/viewform?embedded=true"
            autoFocus
            style={{ width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:"8px", background:C.inputBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box", marginBottom:"10px", fontFamily:"inherit" }}
          />
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={save} disabled={saving} style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:C.accent, color:"#fff", fontSize:"13px", fontWeight:"600", cursor:saving?"not-allowed":"pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setInputVal(savedUrl); }} style={{ padding:"8px 14px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:"13px", cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedUrl ? (
        <div style={{ borderRadius:"12px", overflow:"hidden", border:`1px solid ${C.border}` }}>
          <iframe
            src={savedUrl}
            style={{ width:"100%", height:"720px", border:"none", display:"block" }}
            title="PTO / Vacation Form"
            allow="fullscreen"
          />
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"60px 20px", background:C.card, borderRadius:"12px", border:`1px dashed ${C.border}`, color:C.muted }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>📅</div>
          <div style={{ fontSize:"15px", fontWeight:"600", marginBottom:"6px", color:C.text }}>No form embedded yet</div>
          <div style={{ fontSize:"13px" }}>Click "Set URL" above to embed a Google Form or other URL for PTO / vacation requests.</div>
        </div>
      )}
    </div>
  );
}

function InternalView({ token }) {
  const [activeTab, setActiveTab] = useState("hrInfo");

  const tabs = [
    { id: "hrInfo", label: "HR Info", icon: "🏢" },
    { id: "contacts", label: "Important Contacts", icon: "📞" },
    { id: "membership", label: "Membership Details", icon: "🏛" },
    { id: "pto", label: "PTO / Vacation 🗓", icon: "" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: C.text }}>Internal</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Internal resources — HR info, contacts, membership details, inventory, and PTO</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"24px", borderBottom:`1px solid ${C.border}`, paddingBottom:"0", overflowX:"auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding:"10px 18px", border:"none", background:"none", cursor:"pointer",
              fontSize:"14px", fontWeight:"600",
              color: activeTab === t.id ? C.accent : C.muted,
              borderBottom:`2px solid ${activeTab === t.id ? C.accent : "transparent"}`,
              marginBottom:"-1px", transition:"color 0.15s, border-color 0.15s",
              whiteSpace:"nowrap",
            }}
          >
            {t.icon ? `${t.icon} ` : ""}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "hrInfo" && <HRInfoTab token={token} />}
      {activeTab === "contacts" && <ContactsTab token={token} />}
      {activeTab === "membership" && <MembershipsTab token={token} />}
      {activeTab === "pto" && <PTOEmbedTab token={token} />}
    </div>
  );
}

// ─── Campaign Modal ──────────────────────────────────────────────────────────

function CampaignModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [goal, setGoal] = useState("");

  const inputStyle = {
    width: "100%", background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: "8px", padding: "10px 12px", color: C.text,
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: C.text }}>New Campaign</h2>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Campaign Name *</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer 2026 Launch" autoFocus />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Start Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "light" }} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>End Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "light" }} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Campaign Goal</label>
          <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Drive 500 email signups" />
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => name.trim() && onSave({ name: name.trim(), startDate: start, endDate: end, goal })}
            disabled={!name.trim()}
            style={{ padding: "8px 24px", borderRadius: "8px", border: "none", background: !name.trim() ? C.muted : C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: !name.trim() ? "default" : "pointer" }}
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 3000,
      background: type === "error" ? "#7F1D1D" : "#064E3B",
      border: `1px solid ${type === "error" ? "#EF4444" : "#10B981"}`,
      borderRadius: "10px", padding: "12px 20px", color: "#fff",
      fontSize: "14px", fontWeight: "500",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "fadeIn 0.2s ease",
    }}>
      {message}
    </div>
  );
}

// ─── Section label for sidebar ───────────────────────────────────────────────

function SidebarSectionLabel({ label, visible }) {
  if (!visible) return <div style={{ height: "8px" }} />;
  return (
    <div style={{
      fontSize: "10px", color: C.muted, fontWeight: "700",
      textTransform: "uppercase", letterSpacing: "0.1em",
      padding: "12px 10px 4px",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

// ─── Sidebar nav button ──────────────────────────────────────────────────────

function NavBtn({ icon, label, active, onClick, title, sidebarOpen }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={!sidebarOpen ? title || label : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "9px 10px", borderRadius: "8px", border: "none",
        background: active ? C.accentLight : hov ? C.hover : "transparent",
        color: active ? C.accentBright : C.muted,
        fontSize: "13px", fontWeight: active ? "600" : "400",
        cursor: "pointer", transition: "all 0.15s", textAlign: "left",
        marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden",
      }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
      {sidebarOpen && label}
    </button>
  );
}

// ─── Draggable Nav Item ──────────────────────────────────────────────────────

function DraggableNavItem({ v, idx, active, sidebarOpen, dragIndexRef, orderedContentViews, onNavigate, onReorder }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable
      onDragStart={() => { dragIndexRef.current = idx; }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        const from = dragIndexRef.current;
        if (from === null || from === idx) return;
        const newOrder = [...orderedContentViews];
        const [moved] = newOrder.splice(from, 1);
        newOrder.splice(idx, 0, moved);
        onReorder(newOrder.map((cv) => cv.id));
        dragIndexRef.current = null;
      }}
      style={{ display: "flex", alignItems: "center", gap: "2px" }}
    >
      {sidebarOpen && (
        <span style={{ fontSize: "11px", color: C.muted, opacity: 0.4, flexShrink: 0, userSelect: "none", cursor: "grab", padding: "0 2px" }}>⠿</span>
      )}
      <button
        onClick={onNavigate}
        title={!sidebarOpen ? v.label : undefined}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          flex: 1, display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 10px", borderRadius: "8px", border: "none",
          background: active ? C.accentLight : hov ? C.hover : "transparent",
          color: active ? C.accentBright : C.muted,
          fontSize: "13px", fontWeight: active ? "600" : "400",
          cursor: "pointer", transition: "all 0.15s", textAlign: "left",
          marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "16px", flexShrink: 0 }}>{v.icon}</span>
        {sidebarOpen && v.label}
      </button>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ContentScheduler() {
  const [view, setView] = useState("mydash");
  const [viewingUserId, setViewingUserId] = useState(null); // null = current user
  const [posts, setPosts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [goals, setGoals] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [listFilters, setListFilters] = useState({});
  const [ideas, setIdeas] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [slackChannels, setSlackChannels] = useState([]);
  const [contentViewOrder, setContentViewOrder] = useState(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("tcf_nav_order") : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const dragIndexRef = useRef(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authFetch = useCallback((url, opts = {}) => {
    const token = authToken || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    return fetch(url, {
      ...opts,
      headers: { ...(opts.headers || {}), "x-session": token || "", "Content-Type": "application/json" },
    });
  }, [authToken]);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        const res = await fetch("/api/auth/setup");
        const data = await res.json();
        setNeedsSetup(data.needsSetup);
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", { headers: { "x-session": stored } });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          setAuthToken(stored);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          const setupRes = await fetch("/api/auth/setup");
          const data = await setupRes.json();
          setNeedsSetup(data.needsSetup);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleAuth = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setCurrentUser(user);
    setNeedsSetup(false);
  }, []);

  const handleLogout = async () => {
    const token = authToken;
    setCurrentUser(null);
    setAuthToken(null);
    setPosts([]);
    setCampaigns([]);
    setTeamMembers([]);
    localStorage.removeItem(TOKEN_KEY);
    await fetch("/api/auth/logout", { method: "POST", headers: { "x-session": token } });
  };

  const fetchAll = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [postsRes, campaignsRes, teamRes, goalsRes, assetsRes, channelsRes] = await Promise.all([
        authFetch("/api/scheduler"),
        authFetch("/api/scheduler?type=campaigns"),
        authFetch("/api/team"),
        authFetch("/api/goals"),
        authFetch("/api/assets"),
        authFetch("/api/slack/channels"),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (teamRes.ok) setTeamMembers(await teamRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (channelsRes.ok) setSlackChannels(await channelsRes.json());
      const ideasRes = await authFetch("/api/ideas");
      if (ideasRes.ok) setIdeas(await ideasRes.json());
    } catch {
      showToast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, [authToken, authFetch]);

  useEffect(() => {
    if (!authToken) return;
    const fetchNotifs = async () => {
      try {
        const res = await authFetch("/api/notifications");
        if (res.ok) setNotifications(await res.json());
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [authToken, authFetch]);

  useEffect(() => { if (authToken) fetchAll(); }, [authToken, fetchAll]);

  const openNew = (scheduledDate = null, status = "draft") => {
    setEditingPost({ scheduledDate: scheduledDate || "", status });
    setFormOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    try {
      const isNew = !form.id;
      const res = await authFetch(isNew ? "/api/scheduler" : `/api/scheduler/${form.id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      if (isNew) {
        setPosts((p) => [saved, ...p]);
      } else {
        setPosts((p) => p.map((x) => (x.id === saved.id ? saved : x)));
      }
      setFormOpen(false);
      setEditingPost(null);
      showToast(isNew ? "Post created" : "Post updated");
    } catch {
      showToast("Failed to save", "error");
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: newStatus } : p));
    try {
      const res = await authFetch(`/api/scheduler/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ ...post, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Moved to ${statusLabel}`);
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? post : p));
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/scheduler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((p) => p.filter((x) => x.id !== id));
      setFormOpen(false);
      setEditingPost(null);
      showToast("Post deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleNavigate = (targetView, filters = {}) => {
    setView(targetView);
    setListFilters(filters);
  };

  const handleGoalsUpdate = (updated) => setGoals(updated);

  const handleDateChange = async (postId, newDate) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.scheduledDate === newDate) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, scheduledDate: newDate } : p));
    try {
      const res = await authFetch(`/api/scheduler/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ ...post, scheduledDate: newDate }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? post : p));
      showToast("Failed to move post", "error");
    }
  };

  const handleNoteAdded = (postId, note) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, notes: [...(p.notes || []), note] } : p)
    );
  };

  const handleMakePost = (idea) => {
    setEditingPost({ title: idea.title || "", caption: idea.description || "", status: "draft" });
    setFormOpen(true);
  };

  const handleMarkAllRead = async () => {
    try {
      const token = authToken;
      await fetch("/api/notifications", { method: "POST", headers: { "x-session": token, "Content-Type": "application/json" }, body: JSON.stringify({ ids: [] }) });
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch {}
  };

  const handleCampaignSave = async (data) => {
    try {
      const res = await authFetch("/api/scheduler", {
        method: "POST",
        body: JSON.stringify({ type: "campaign", ...data }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setCampaigns((c) => [...c, saved]);
      setCampaignModalOpen(false);
      showToast("Campaign created");
    } catch {
      showToast("Failed to create campaign", "error");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const scheduledToday = posts.filter((p) => p.scheduledDate === today && p.status === "scheduled").length;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen needsSetup={needsSetup} onAuth={handleAuth} />;
  }

  // Derived workspace owner name for top bar
  const orderedContentViews = (() => {
    if (!contentViewOrder) return CONTENT_VIEWS;
    const ordered = [];
    contentViewOrder.forEach((id) => {
      const v = CONTENT_VIEWS.find((cv) => cv.id === id);
      if (v) ordered.push(v);
    });
    CONTENT_VIEWS.forEach((v) => { if (!ordered.find((o) => o.id === v.id)) ordered.push(v); });
    return ordered;
  })();

  const effectiveViewingUserId = viewingUserId || currentUser?.id;
  const viewingUser = viewingUserId
    ? teamMembers.find((m) => m.id === viewingUserId)
    : currentUser;
  const ownerName = viewingUser?.name || currentUser?.name || "";
  const workspaceTitle = ownerName.endsWith("s") ? `${ownerName}' Workspace` : `${ownerName}'s Workspace`;

  // Top bar title
  const ALL_VIEWS = [
    ...CONTENT_VIEWS,
    INTERNAL_VIEW,
    { id: "inventory", label: "Inventory" },
    { id: "teamtasks", label: "Task Tracker" },
    { id: "training", label: "Training" },
    { id: "events", label: "Events" },
  ];
  const topBarTitle = view === "mydash"
    ? workspaceTitle
    : ALL_VIEWS.find((v) => v.id === view)?.label || view;

  const assignedPostsForViewer = posts.filter((p) => p.assignedTo === effectiveViewingUserId);

  const activeNotifs = notifications.filter((n) => !n.postId || posts.find((p) => p.id === n.postId));

  const otherMembers = teamMembers.filter((m) => m.id !== currentUser.id);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select option { background: ${C.card}; color: ${C.text}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .tcf-sidebar { display: none !important; }
          .tcf-mobile-header { display: flex !important; }
          .tcf-sidebar.mobile-open { display: flex !important; position: fixed; left: 0; top: 0; bottom: 0; z-index: 300; width: 240px !important; box-shadow: 4px 0 20px rgba(0,0,0,0.15); }
          .tcf-sidebar-overlay { display: block !important; }
          .tcf-view-area { padding: 16px !important; }
          .tcf-topbar { padding: 0 16px !important; }
          .tcf-task-table { display: none; }
          .tcf-task-cards { display: flex !important; }
          .workspace-2col { flex-direction: column !important; }
          .workspace-2col > div:first-child { width: 100% !important; }
        }
        @media (min-width: 769px) {
          .tcf-mobile-header { display: none !important; }
          .tcf-sidebar-overlay { display: none !important; }
          .tcf-task-table { display: block; }
          .tcf-task-cards { display: none; }
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {/* ── Mobile sidebar overlay ─── */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 299, display: "none" }}
          className="tcf-sidebar-overlay"
        />
      )}

      <div className={`tcf-sidebar${mobileSidebarOpen ? " mobile-open" : ""}`} style={{
        width: sidebarOpen ? "220px" : "56px",
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px", minHeight: "64px" }}>
          <img src="/tcf-logo.png" alt="TCF" style={{ width: "36px", height: "36px", objectFit: "contain", flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }} />
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `linear-gradient(135deg, ${C.accent}, #8B5CF6)`, display: "none", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "#fff", flexShrink: 0 }}>T</div>
          {sidebarOpen && <span style={{ fontSize: "15px", fontWeight: "800", color: C.text, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>TCF Studio</span>}
        </div>

        {/* Nav */}
        <nav style={{ padding: "8px 8px", flex: 1, overflowY: "auto" }}>

          {/* ── TEAM section ── */}
          <SidebarSectionLabel label="Team" visible={sidebarOpen} />

          {/* Current user → own workspace */}
          <button
            onClick={() => { setView("mydash"); setViewingUserId(null); }}
            title={!sidebarOpen ? `${currentUser.name} (My Workspace)` : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 10px", borderRadius: "8px", border: "none",
              background: view === "mydash" && !viewingUserId ? C.accentLight : "transparent",
              color: view === "mydash" && !viewingUserId ? C.accentBright : C.muted,
              fontSize: "13px", fontWeight: view === "mydash" && !viewingUserId ? "600" : "400",
              cursor: "pointer", transition: "all 0.15s", textAlign: "left",
              marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden",
            }}
            onMouseEnter={(e) => { if (!(view === "mydash" && !viewingUserId)) e.currentTarget.style.background = C.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = view === "mydash" && !viewingUserId ? C.accentLight : "transparent"; }}
          >
            <UserAvatar name={currentUser.name} size={24} />
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
                {sidebarOpen && <div style={{ fontSize: "10px", color: C.muted, textTransform: "capitalize" }}>{currentUser.role}</div>}
              </div>
            )}
          </button>

          {/* Other team members */}
          {otherMembers.map((member) => {
            const isMemberActive = view === "mydash" && viewingUserId === member.id;
            return (
              <button
                key={member.id}
                onClick={() => { setView("mydash"); setViewingUserId(member.id); }}
                title={!sidebarOpen ? member.name : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px 10px", borderRadius: "8px", border: "none",
                  background: isMemberActive ? C.accentLight : "transparent",
                  color: isMemberActive ? C.accentBright : C.muted,
                  fontSize: "13px", fontWeight: isMemberActive ? "600" : "400",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                  marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden",
                }}
                onMouseEnter={(e) => { if (!isMemberActive) e.currentTarget.style.background = C.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isMemberActive ? C.accentLight : "transparent"; }}
              >
                <UserAvatar name={member.name} size={24} />
                {sidebarOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</span>}
              </button>
            );
          })}

          {/* Profile */}
          <NavBtn
            icon="👤"
            label="Profile"
            active={view === "profile"}
            onClick={() => { setView("profile"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          {/* ── CONTENT section ── */}
          <SidebarSectionLabel label="Content" visible={sidebarOpen} />

          {orderedContentViews.map((v, idx) => (
            <DraggableNavItem
              key={v.id}
              v={v}
              idx={idx}
              active={view === v.id}
              sidebarOpen={sidebarOpen}
              dragIndexRef={dragIndexRef}
              orderedContentViews={orderedContentViews}
              onNavigate={() => { setView(v.id); setViewingUserId(null); }}
              onReorder={(ids) => {
                setContentViewOrder(ids);
                try { localStorage.setItem("tcf_nav_order", JSON.stringify(ids)); } catch {}
              }}
            />
          ))}

          {/* New Campaign button — above campaign tags */}
          <button
            onClick={() => setCampaignModalOpen(true)}
            title={!sidebarOpen ? "New Campaign" : undefined}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🎯</span>
            {sidebarOpen && "New Campaign"}
          </button>

          {/* Campaigns list */}
          {sidebarOpen && campaigns.length > 0 && (
            <div style={{ padding: "0 4px", marginTop: "2px" }}>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px", marginBottom: "4px" }}>Campaigns</div>
              {campaigns.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate("list", { campaign: c.name })}
                  style={{ width: "100%", textAlign: "left", fontSize: "12px", color: listFilters.campaign === c.name ? C.accentBright : C.muted, padding: "5px 8px", borderRadius: "6px", cursor: "pointer", border: "none", background: listFilters.campaign === c.name ? C.accentLight : "transparent", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { if (listFilters.campaign !== c.name) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = listFilters.campaign === c.name ? C.accentLight : "transparent"; }}
                >
                  🎯 {c.name}
                </button>
              ))}
            </div>
          )}

          {/* ── INTERNAL section ── */}
          <SidebarSectionLabel label="Internal" visible={sidebarOpen} />

          <NavBtn
            icon={INTERNAL_VIEW.icon}
            label={INTERNAL_VIEW.label}
            active={view === "internal"}
            onClick={() => { setView("internal"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          <NavBtn
            icon="📦"
            label="Inventory"
            active={view === "inventory"}
            onClick={() => { setView("inventory"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          <NavBtn
            icon="✅"
            label="Task Tracker"
            active={view === "teamtasks"}
            onClick={() => { setView("teamtasks"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          <NavBtn
            icon="🎓"
            label="Training"
            active={view === "training"}
            onClick={() => { setView("training"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          <NavBtn
            icon="📅"
            label="Events"
            active={view === "events"}
            onClick={() => { setView("events"); setViewingUserId(null); }}
            sidebarOpen={sidebarOpen}
          />

          {/* ── Admin tools ── */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "10px 0", padding: "10px 0 0" }}>
            {currentUser.role === "admin" && (
              <button
                onClick={() => setSettingsOpen(true)}
                title={!sidebarOpen ? "Settings" : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>⚙️</span>
                {sidebarOpen && "Settings"}
              </button>
            )}

            {currentUser.role === "admin" && (
              <button
                onClick={() => setTeamModalOpen(true)}
                title={!sidebarOpen ? "Manage Team" : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>👥</span>
                {sidebarOpen && (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Team
                    {teamMembers.length > 0 && <span style={{ fontSize: "10px", background: "rgba(0,0,0,0.08)", padding: "1px 6px", borderRadius: "10px" }}>{teamMembers.length}</span>}
                  </span>
                )}
              </button>
            )}
          </div>
        </nav>

        {/* User chip + logout */}
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
          {sidebarOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", marginBottom: "4px" }}>
              <UserAvatar name={currentUser.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
                <div style={{ fontSize: "10px", color: C.muted, textTransform: "capitalize" }}>{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} title="Sign out" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}>↩</button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
              <div title={`${currentUser.name} · ${currentUser.role}`} style={{ cursor: "default" }}>
                <UserAvatar name={currentUser.name} size={28} />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "none", background: "transparent", color: C.muted, fontSize: "13px", cursor: "pointer", textAlign: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div className="tcf-topbar" style={{ padding: "0 28px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Mobile hamburger */}
            <button
              className="tcf-mobile-header"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              style={{ padding: "6px 8px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, cursor: "pointer", fontSize: "16px", color: C.text, lineHeight: 1 }}
            >
              ☰
            </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: C.text }}>
              {topBarTitle}
            </h1>
            {scheduledToday > 0 && (
              <div style={{ fontSize: "11px", color: C.accentBright, marginTop: "1px" }}>{scheduledToday} post{scheduledToday !== 1 ? "s" : ""} going out today</div>
            )}
          </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>{posts.length} total posts</div>
            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                style={{ position: "relative", padding: "8px", borderRadius: "8px", border: `1px solid ${notifOpen ? C.accent : C.border}`, background: notifOpen ? C.accentLight : C.inputBg, color: notifOpen ? C.accentBright : C.muted, fontSize: "16px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Notifications"
              >
                🔔
                {activeNotifs.filter((n) => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                    {activeNotifs.filter((n) => !n.read).length > 9 ? "9+" : activeNotifs.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "340px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", boxShadow: C.shadowMd, zIndex: 1000, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>Notifications</span>
                    {activeNotifs.some((n) => !n.read) && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: "11px", color: C.accentBright, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                    {activeNotifs.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: C.muted, fontSize: "13px" }}>No notifications yet</div>
                    ) : (
                      activeNotifs.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { setNotifOpen(false); const post = posts.find((p) => p.id === n.postId); if (post) openEdit(post); }}
                          style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: n.read ? "transparent" : C.accentLight, cursor: "pointer", transition: "background 0.1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : C.accentLight)}
                        >
                          {!n.read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />}
                          <span style={{ fontSize: "12px", color: C.text }}>
                            <strong>{n.mentionedBy}</strong> mentioned you in <strong>{n.postTitle}</strong>
                          </span>
                          <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{n.noteText}"</div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
                            {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => openNew()}
              style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: `linear-gradient(135deg, ${C.accent}, #8B5CF6)`, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: `0 0 20px rgba(99,102,241,0.3)` }}
            >
              + Create Post
            </button>
          </div>
        </div>

        {/* View area */}
        <div className="tcf-view-area" style={{ flex: 1, overflow: "auto", padding: "28px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
              <div style={{ width: "32px", height: "32px", border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <>
              {view === "dashboard" && <Dashboard posts={posts} campaigns={campaigns} goals={goals} currentUser={currentUser} ideas={ideas} onEdit={openEdit} onNewPost={() => openNew()} onNavigate={handleNavigate} onGoalsUpdate={handleGoalsUpdate} onIdeasUpdate={setIdeas} onMakePost={handleMakePost} token={authToken} />}
              {view === "calendar" && <CalendarView posts={posts} onEdit={openEdit} onNewPost={(date) => openNew(date)} onDateChange={handleDateChange} />}
              {view === "pipeline" && <Pipeline posts={posts} onEdit={openEdit} onNewPost={(date, status) => openNew(date, status || "draft")} onStatusChange={handleStatusChange} currentUser={currentUser} />}
              {view === "list" && <ListView key={JSON.stringify(listFilters)} posts={posts} campaigns={campaigns} onEdit={openEdit} onNewPost={() => openNew()} initialFilters={listFilters} />}
              {view === "slack" && <SlackPlanner currentUser={currentUser} token={authToken} onMakePost={handleMakePost} teamMembers={teamMembers} />}
              {view === "links" && <QuickLinks currentUser={currentUser} token={authToken} />}
              {view === "assets" && <AssetTracker currentUser={currentUser} token={authToken} teamMembers={teamMembers} />}
              {view === "mydash" && (
                <MyDashboard
                  currentUser={currentUser}
                  token={authToken}
                  viewingUserId={effectiveViewingUserId}
                  teamMembers={teamMembers}
                  assignedPosts={assignedPostsForViewer}
                  assignedAssets={assets.filter((a) => a.assignedTo === effectiveViewingUserId)}
                  assignedSlackChannels={slackChannels.filter((c) => c.assignedTo === effectiveViewingUserId)}
                  onOpenPost={(post) => { openEdit(post); }}
                  onOpenAsset={(asset) => { setView("assets"); }}
                  onOpenSlack={() => { setView("slack"); }}
                />
              )}
              {view === "profile" && (
                <MemberProfile
                  currentUser={currentUser}
                  token={authToken}
                  teamMembers={teamMembers}
                  viewingUserId={effectiveViewingUserId}
                />
              )}
              {view === "internal" && <InternalView token={authToken} />}
              {view === "inventory" && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: C.text }}>Inventory</h1>
                    <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Track supplies, equipment, and orders. Filter by location: 321, 342, or 812.</p>
                  </div>
                  <InventoryTab token={authToken} currentUser={currentUser} />
                </div>
              )}
              {view === "teamtasks" && <TeamTaskTracker token={authToken} currentUser={currentUser} teamMembers={teamMembers} />}
              {view === "training" && <TrainingView token={authToken} currentUser={currentUser} />}
              {view === "events" && <EventsView token={authToken} currentUser={currentUser} teamMembers={teamMembers} />}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {formOpen && (
        <ContentForm
          post={editingPost}
          campaigns={campaigns}
          teamMembers={teamMembers}
          currentUser={currentUser}
          token={authToken}
          onSave={handleSave}
          onDelete={handleDelete}
          onNoteAdded={handleNoteAdded}
          onClose={() => { setFormOpen(false); setEditingPost(null); }}
        />
      )}

      {campaignModalOpen && (
        <CampaignModal onSave={handleCampaignSave} onClose={() => setCampaignModalOpen(false)} />
      )}

      {teamModalOpen && (
        <TeamManager
          teamMembers={teamMembers}
          currentUser={currentUser}
          token={authToken}
          onClose={() => setTeamModalOpen(false)}
          onTeamUpdate={setTeamMembers}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          token={authToken}
          currentUser={currentUser}
          onClose={() => setSettingsOpen(false)}
          onSettingsUpdate={() => {}}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
