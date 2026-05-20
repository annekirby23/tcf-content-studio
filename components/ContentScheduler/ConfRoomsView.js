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

// ─── Room Modal ───────────────────────────────────────────────────────────────

function RoomModal({ room, token, onClose, onSave, onDelete }) {
  const [name, setName] = useState(room?.name || "");
  const [location, setLocation] = useState(room?.location || "");
  const [capacity, setCapacity] = useState(room?.capacity || "");
  const [pricing, setPricing] = useState(room?.pricing || "");
  const [amenities, setAmenities] = useState(room?.amenities || "");
  const [bookingContact, setBookingContact] = useState(room?.bookingContact || "");
  const [bookingUrl, setBookingUrl] = useState(room?.bookingUrl || "");
  const [details, setDetails] = useState(room?.details || "");
  const [image, setImage] = useState(room?.image || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isNew = !room?.id;

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

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(
      { name: name.trim(), location, capacity, pricing, amenities, bookingContact, bookingUrl, details, image },
      room?.id
    );
    setSaving(false);
    onClose();
  };

  const labelStyle = {
    display: "block", fontSize: "11px", color: C.muted, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px",
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
          {isNew ? "Add Conference Room" : "Edit Conference Room"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Room Name *</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Board Room, Studio 3, Meeting Room A…" />
          </div>

          {/* Location / Building */}
          <div>
            <label style={labelStyle}>Location / Building</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Main building, 2nd floor…" />
          </div>

          {/* Capacity + Pricing row */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Capacity</label>
              <input
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
                placeholder="Up to 12 people"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pricing</label>
              <input
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
                placeholder="$75/hr, Free for members…"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label style={labelStyle}>Amenities & Features</label>
            <input
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              style={{ ...textInput({ width: "100%" }) }}
              placeholder="Projector, whiteboard, A/V system, natural light…"
            />
          </div>

          {/* Booking contact + URL */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Booking Contact</label>
              <input
                value={bookingContact}
                onChange={(e) => setBookingContact(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
                placeholder="Name or email…"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Booking Link</label>
              <input
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
                placeholder="https://calendly.com/…"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Details & Notes</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }) }}
              placeholder="Entry instructions, setup notes, parking, anything the team should know…"
            />
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Room Photo</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              {image && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={image} alt="Room" style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}` }} />
                  <button onClick={() => setImage("")} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                </div>
              )}
              <div>
                <button onClick={() => fileRef.current?.click()} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                  {image ? "Replace Photo" : "Upload Photo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>Or paste an image URL:</div>
                <input
                  value={image.startsWith("data:") ? "" : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://…"
                  style={{ ...textInput({ width: "220px", fontSize: "12px", marginTop: "4px" }) }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "24px", justifyContent: "space-between" }}>
          <div>
            {!isNew && (
              <button
                onClick={() => { if (confirm("Delete this conference room?")) { onDelete(room.id); onClose(); } }}
                style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                🗑 Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: name.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() ? "pointer" : "not-allowed" }}
            >
              {saving ? "Saving…" : isNew ? "Add Room" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, onClick }) {
  const [hov, setHov] = useState(false);

  // Parse amenities into pill list
  const amenityList = room.amenities
    ? room.amenities.split(/[,;]+/).map((a) => a.trim()).filter(Boolean)
    : [];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov ? C.accent : C.border}`,
        borderRadius: "14px", overflow: "hidden", cursor: "pointer",
        transition: "all 0.15s", boxShadow: hov ? C.shadowMd : C.shadow,
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ width: "100%", height: "150px", background: C.cardBg, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {room.image ? (
          <img src={room.image} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", opacity: 0.25 }}>🏢</div>
        )}
        {/* Pricing badge */}
        {room.pricing && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)",
            color: "#fff", fontSize: "11px", fontWeight: "700",
            padding: "4px 10px", borderRadius: "20px",
          }}>
            {room.pricing}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{room.name}</div>

        {/* Location */}
        {room.location && (
          <div style={{ fontSize: "12px", color: C.muted, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            📍 {room.location}
          </div>
        )}

        {/* Capacity */}
        {room.capacity && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
            <span style={{
              background: "rgba(99,102,241,0.1)", color: C.accent,
              fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px",
            }}>
              👥 {room.capacity}
            </span>
          </div>
        )}

        {/* Amenities pills */}
        {amenityList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
            {amenityList.slice(0, 4).map((a, i) => (
              <span key={i} style={{
                background: C.cardBg, border: `1px solid ${C.border}`,
                color: C.muted, fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
              }}>{a}</span>
            ))}
            {amenityList.length > 4 && (
              <span style={{ fontSize: "11px", color: C.muted, padding: "2px 4px" }}>+{amenityList.length - 4} more</span>
            )}
          </div>
        )}

        {/* Notes preview */}
        {room.details && (
          <div style={{
            fontSize: "12px", color: C.muted, lineHeight: "1.5",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", marginBottom: "10px", flex: 1,
          }}>
            {room.details}
          </div>
        )}

        {/* Booking footer */}
        {(room.bookingContact || room.bookingUrl) && (
          <div style={{ paddingTop: "10px", borderTop: `1px solid ${C.border}`, marginTop: "auto" }}>
            {room.bookingUrl ? (
              <a
                href={room.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12px", fontWeight: "600", color: C.accent, textDecoration: "none",
                }}
              >
                📅 Book this room ↗
              </a>
            ) : room.bookingContact ? (
              <div style={{ fontSize: "12px", color: C.muted }}>
                📅 Contact: <span style={{ color: C.text, fontWeight: "600" }}>{room.bookingContact}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ConfRoomsView ───────────────────────────────────────────────────────

export default function ConfRoomsView({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalRoom, setModalRoom] = useState(null); // null=closed, false=new, obj=edit
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/confrooms", {}, token)
      .then((r) => r.json())
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (data, id) => {
    if (id) {
      const res = await apiFetch(`/api/confrooms/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setRooms((prev) => prev.map((r) => r.id === id ? saved : r));
    } else {
      const res = await apiFetch("/api/confrooms", { method: "POST", body: JSON.stringify(data) }, token);
      const saved = await res.json();
      setRooms((prev) => [...prev, saved]);
    }
  };

  const handleDelete = async (id) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    await apiFetch(`/api/confrooms/${id}`, { method: "DELETE" }, token);
  };

  const filtered = rooms.filter((r) =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.location || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.amenities || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>🏢 Conference Rooms</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>All available conference and meeting rooms — capacity, pricing, amenities, and booking info.</p>
        </div>
        <button
          onClick={() => setModalRoom(false)}
          style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          + Add Room
        </button>
      </div>

      {/* Search */}
      {rooms.length > 3 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms, amenities…"
          style={{ padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", width: "280px", marginBottom: "16px", boxSizing: "border-box" }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.muted }}>Loading rooms…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏢</div>
          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>
            {rooms.length === 0 ? "No rooms yet" : "No results"}
          </div>
          <div style={{ fontSize: "13px" }}>
            {rooms.length === 0 ? "Add your first conference room to get started." : "Try a different search term."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}>
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} onClick={() => setModalRoom(room)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalRoom !== null && (
        <RoomModal
          room={modalRoom || null}
          token={token}
          onClose={() => setModalRoom(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
