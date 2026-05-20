"use client";

import { useState, useEffect, useRef } from "react";
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

const labelStyle = {
  display: "block", fontSize: "11px", color: C.muted, fontWeight: "700",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px",
};

function MemberInitials({ name, size = 32 }) {
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

// ─── Location Modal ────────────────────────────────────────────────────────────

function LocationModal({ location, token, teamMembers, onClose, onSave, onDelete }) {
  const [name, setName] = useState(location?.name || "");
  const [address, setAddress] = useState(location?.address || "");
  const [details, setDetails] = useState(location?.details || "");
  const [image, setImage] = useState(location?.image || "");
  const [responsibleMemberId, setResponsibleMemberId] = useState(location?.responsibleMemberId || "");
  const [responsibleMemberName, setResponsibleMemberName] = useState(location?.responsibleMemberName || "");
  const [parkingDetails, setParkingDetails] = useState(location?.parkingDetails || "");
  const [parkingMapUrl, setParkingMapUrl] = useState(location?.parkingMapUrl || "");
  const [parkingInstructionsData, setParkingInstructionsData] = useState(location?.parkingInstructionsData || "");
  const [parkingInstructionsName, setParkingInstructionsName] = useState(location?.parkingInstructionsName || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const parkingFileRef = useRef(null);
  const isNew = !location?.id;

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleParkingFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParkingInstructionsName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setParkingInstructionsData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleMemberChange = (id) => {
    setResponsibleMemberId(id);
    const m = teamMembers.find((m) => m.id === id);
    setResponsibleMemberName(m?.name || "");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(), address, details, image,
      responsibleMemberId: responsibleMemberId || null,
      responsibleMemberName: responsibleMemberName || null,
      parkingDetails, parkingMapUrl, parkingInstructionsData, parkingInstructionsName,
    }, location?.id);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "560px", maxWidth: "95vw", maxHeight: "92vh",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px",
        zIndex: 3001, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "auto", padding: "28px",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: "800", color: C.text }}>
          {isNew ? "Add Location" : "Edit Location"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Location Name *</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="321 Main St, Studio A…" />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Full address…" />
          </div>
          <div>
            <label style={labelStyle}>Details & Notes</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }) }} placeholder="Hours, entry codes, equipment, anything the team should know…" />
          </div>

          {/* Parking section */}
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "12px" }}>🅿️ Parking Information</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Parking Details</label>
                <textarea value={parkingDetails} onChange={(e) => setParkingDetails(e.target.value)} rows={3} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }) }} placeholder="Parking garage on 5th St, free after 6pm, street parking on Oak Ave…" />
              </div>
              <div>
                <label style={labelStyle}>Parking Map URL</label>
                <input value={parkingMapUrl} onChange={(e) => setParkingMapUrl(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://maps.google.com/…" />
              </div>
              <div>
                <label style={labelStyle}>Guest Parking Instructions (PDF or file)</label>
                {parkingInstructionsName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "12px", color: C.text, fontWeight: "600" }}>📄 {parkingInstructionsName}</div>
                    <button onClick={() => { setParkingInstructionsData(""); setParkingInstructionsName(""); }} style={{ fontSize: "11px", color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>✕ Remove</button>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => parkingFileRef.current?.click()} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      📎 Upload Instructions File
                    </button>
                    <input ref={parkingFileRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" style={{ display: "none" }} onChange={handleParkingFile} />
                    <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>PDF, Word, image, or text file</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Location Photo</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              {image && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={image} alt="Location" style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}` }} />
                  <button onClick={() => setImage("")} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                </div>
              )}
              <div>
                <button onClick={() => fileRef.current?.click()} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                  {image ? "Replace Photo" : "Upload Photo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>Or paste an image URL:</div>
                <input value={image.startsWith("data:") ? "" : image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" style={{ ...textInput({ width: "220px", fontSize: "12px", marginTop: "4px" }) }} />
              </div>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div>
              <label style={labelStyle}>Responsible Team Member</label>
              <select value={responsibleMemberId || ""} onChange={(e) => handleMemberChange(e.target.value)} style={{ ...textInput({ width: "100%", color: C.text }) }}>
                <option value="">— None assigned —</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "24px", justifyContent: "space-between" }}>
          <div>
            {!isNew && (
              <button onClick={() => { if (confirm("Delete this location?")) { onDelete(location.id); onClose(); } }} style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                🗑 Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || saving} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: name.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Saving…" : isNew ? "Add Location" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Location Card ─────────────────────────────────────────────────────────────

function LocationCard({ location, onClick, highlightId }) {
  const [hov, setHov] = useState(false);
  const isHighlighted = highlightId && location.id === highlightId;

  return (
    <div
      id={`loc-${location.id}`}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${isHighlighted ? C.accent : hov ? C.accent : C.border}`,
        borderRadius: "14px", overflow: "hidden", cursor: "pointer",
        transition: "all 0.15s", boxShadow: hov || isHighlighted ? C.shadowMd : C.shadow,
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      {/* Image */}
      <div style={{ width: "100%", height: "140px", background: C.cardBg, overflow: "hidden", position: "relative" }}>
        {location.image ? (
          <img src={location.image} alt={location.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", opacity: 0.3 }}>📍</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{location.name}</div>
        {location.address && (
          <div style={{ fontSize: "12px", color: C.muted, marginBottom: "8px" }}>📍 {location.address}</div>
        )}
        {location.details && (
          <div style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "10px" }}>
            {location.details}
          </div>
        )}

        {/* Parking badge */}
        {(location.parkingDetails || location.parkingMapUrl) && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" }}>
              🅿️ Parking info available
            </span>
            {location.parkingMapUrl && (
              <a href={location.parkingMapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "11px", color: C.accent, fontWeight: "600", textDecoration: "none" }}>
                View map ↗
              </a>
            )}
          </div>
        )}

        {/* Parking instructions download */}
        {location.parkingInstructionsData && location.parkingInstructionsName && (
          <div style={{ marginBottom: "8px" }}>
            <a
              href={location.parkingInstructionsData}
              download={location.parkingInstructionsName}
              onClick={(e) => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#10B981", textDecoration: "none" }}
            >
              📄 Download guest parking instructions
            </a>
          </div>
        )}

        {location.responsibleMemberName && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: `1px solid ${C.border}`, marginTop: "4px" }}>
            <MemberInitials name={location.responsibleMemberName} size={26} />
            <div>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Responsible</div>
              <div style={{ fontSize: "12px", color: C.text, fontWeight: "600" }}>{location.responsibleMemberName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main LocationsView ────────────────────────────────────────────────────────

export default function LocationsView({ token, teamMembers = [], highlightLocationId }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLocation, setModalLocation] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/locations", {}, token)
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Scroll to highlighted location
  useEffect(() => {
    if (highlightLocationId && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`loc-${highlightLocationId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [highlightLocationId, loading]);

  const handleSave = async (data, id) => {
    if (id) {
      const res = await apiFetch(`/api/locations/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setLocations((prev) => prev.map((l) => l.id === id ? saved : l));
    } else {
      const res = await apiFetch("/api/locations", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setLocations((prev) => [...prev, saved]);
    }
  };

  const handleDelete = async (id) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    await apiFetch(`/api/locations/${id}`, { method: "DELETE" }, token);
  };

  const filtered = locations.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>📍 Locations</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>All TCF locations — details, parking, and responsible team members.</p>
        </div>
        <button onClick={() => setModalLocation(false)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
          + Add Location
        </button>
      </div>

      {/* Search */}
      {locations.length > 3 && (
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search locations…" style={{ ...textInput({ width: "300px", marginBottom: "16px" }) }} />
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.muted }}>Loading locations…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📍</div>
          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{locations.length === 0 ? "No locations yet" : "No results"}</div>
          <div style={{ fontSize: "13px" }}>{locations.length === 0 ? "Add your first location to get started." : "Try a different search term."}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filtered.map((loc) => (
            <LocationCard key={loc.id} location={loc} onClick={() => setModalLocation(loc)} highlightId={highlightLocationId} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalLocation !== null && (
        <LocationModal
          location={modalLocation || null}
          token={token}
          teamMembers={teamMembers}
          onClose={() => setModalLocation(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
