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

// ─── Room Modal ────────────────────────────────────────────────────────────────

function RoomModal({ room, token, locations, currentUser, onClose, onSave, onDelete }) {
  const [name, setName] = useState(room?.name || "");
  const [location, setLocation] = useState(room?.location || "");
  const [capacity, setCapacity] = useState(room?.capacity || "");
  const [pricing, setPricing] = useState(room?.pricing || "");
  const [amenities, setAmenities] = useState(room?.amenities || "");
  const [bookingContact, setBookingContact] = useState(room?.bookingContact || "");
  const [skeddaUrl, setSkeddaUrl] = useState(room?.skeddaUrl || "");
  const [honeyBookUrl, setHoneyBookUrl] = useState(room?.honeyBookUrl || "");
  const [linkedLocationId, setLinkedLocationId] = useState(room?.linkedLocationId || "");
  const [linkedLocationName, setLinkedLocationName] = useState(room?.linkedLocationName || "");
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

  const handleLocationChange = (id) => {
    setLinkedLocationId(id);
    const loc = locations.find((l) => l.id === id);
    setLinkedLocationName(loc?.name || "");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(), location, capacity, pricing, amenities, bookingContact,
      skeddaUrl, honeyBookUrl, linkedLocationId: linkedLocationId || null,
      linkedLocationName: linkedLocationName || "", details, image,
    }, room?.id);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "580px", maxWidth: "95vw", maxHeight: "92vh",
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

          {/* Location text + Linked Location */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Building / Floor</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Main building, 2nd floor…" />
            </div>
            {locations.length > 0 && (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Link to Location</label>
                <select value={linkedLocationId || ""} onChange={(e) => handleLocationChange(e.target.value)} style={{ ...textInput({ width: "100%", color: C.text }) }}>
                  <option value="">— None —</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Capacity + Pricing */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Capacity</label>
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Up to 12 people" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pricing</label>
              <input value={pricing} onChange={(e) => setPricing(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="$75/hr, Free for members…" />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label style={labelStyle}>Amenities & Features</label>
            <input value={amenities} onChange={(e) => setAmenities(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Projector, whiteboard, A/V, natural light…" />
          </div>

          {/* Booking contact */}
          <div>
            <label style={labelStyle}>Booking Contact</label>
            <input value={bookingContact} onChange={(e) => setBookingContact(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Name or email…" />
          </div>

          {/* Skedda + HoneyBook URLs */}
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: C.accent, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              🔗 Booking Links
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Skedda Booking URL (this room)</label>
                <input value={skeddaUrl} onChange={(e) => setSkeddaUrl(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://skedda.com/book/…" />
              </div>
              <div>
                <label style={labelStyle}>HoneyBook Request URL (this room)</label>
                <input value={honeyBookUrl} onChange={(e) => setHoneyBookUrl(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://www.honeybook.com/widget/…" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Details & Notes</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }) }} placeholder="Entry instructions, setup notes, anything the team should know…" />
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
                <input value={image.startsWith("data:") ? "" : image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" style={{ ...textInput({ width: "220px", fontSize: "12px", marginTop: "4px" }) }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "24px", justifyContent: "space-between" }}>
          <div>
            {!isNew && (
              <button onClick={() => { if (confirm("Delete this conference room?")) { onDelete(room.id); onClose(); } }} style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid #EF4444`, background: "none", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                🗑 Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || saving} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: name.trim() ? C.accent : C.border, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: name.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Saving…" : isNew ? "Add Room" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Room Card ─────────────────────────────────────────────────────────────────

function RoomCard({ room, onClick, onNavigateToLocation }) {
  const [hov, setHov] = useState(false);
  const amenityList = room.amenities
    ? room.amenities.split(/[,;]+/).map((a) => a.trim()).filter(Boolean)
    : [];

  return (
    <div
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
      {/* Image — clicking opens edit modal */}
      <div onClick={onClick} style={{ width: "100%", height: "150px", background: C.cardBg, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {room.image ? (
          <img src={room.image} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", opacity: 0.25 }}>🏢</div>
        )}
        {room.pricing && (
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>
            {room.pricing}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div onClick={onClick} style={{ fontSize: "15px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{room.name}</div>

        {/* Location line */}
        {(room.location || room.linkedLocationName) && (
          <div style={{ fontSize: "12px", color: C.muted, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            📍{" "}
            {room.linkedLocationId && onNavigateToLocation ? (
              <span
                onClick={(e) => { e.stopPropagation(); onNavigateToLocation(room.linkedLocationId); }}
                style={{ color: C.accent, fontWeight: "600", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
              >
                {room.linkedLocationName || room.location}
              </span>
            ) : (
              <span>{room.linkedLocationName || room.location}</span>
            )}
          </div>
        )}

        {/* Capacity */}
        {room.capacity && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
            <span style={{ background: "rgba(99,102,241,0.1)", color: C.accent, fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" }}>
              👥 {room.capacity}
            </span>
          </div>
        )}

        {/* Amenities pills */}
        {amenityList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
            {amenityList.slice(0, 4).map((a, i) => (
              <span key={i} style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.muted, fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{a}</span>
            ))}
            {amenityList.length > 4 && <span style={{ fontSize: "11px", color: C.muted, padding: "2px 4px" }}>+{amenityList.length - 4} more</span>}
          </div>
        )}

        {/* Notes preview */}
        {room.details && (
          <div onClick={onClick} style={{ fontSize: "12px", color: C.muted, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "10px", flex: 1 }}>
            {room.details}
          </div>
        )}

        {/* Booking links footer */}
        {(room.skeddaUrl || room.honeyBookUrl || room.bookingContact) && (
          <div style={{ paddingTop: "10px", borderTop: `1px solid ${C.border}`, marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
            {room.skeddaUrl && (
              <a href={room.skeddaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: C.accent, textDecoration: "none" }}>
                📅 Book this room on Skedda ↗
              </a>
            )}
            {room.honeyBookUrl && (
              <a href={room.honeyBookUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#8B5CF6", textDecoration: "none" }}>
                📋 Fill out a request form on HoneyBook ↗
              </a>
            )}
            {!room.skeddaUrl && !room.honeyBookUrl && room.bookingContact && (
              <div style={{ fontSize: "12px", color: C.muted }}>📅 Contact: <span style={{ color: C.text, fontWeight: "600" }}>{room.bookingContact}</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Panel (admin) ────────────────────────────────────────────────────

function EmbedSettings({ token, currentUser, settings, onSettingsChange }) {
  const [skeddaEmbed, setSkeddaEmbed] = useState(settings?.skeddaEmbedUrl || "");
  const [honeyBookCode, setHoneyBookCode] = useState(settings?.honeyBookEmbedCode || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch("/api/confrooms/settings", {
      method: "PUT",
      body: JSON.stringify({ skeddaEmbedUrl: skeddaEmbed, honeyBookEmbedCode: honeyBookCode }),
    }, token);
    const data = await res.json();
    onSettingsChange(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (currentUser?.role !== "admin") return null;

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: C.accent, marginBottom: "12px" }}>⚙️ Admin: Embed Settings</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Skedda Embed URL (for the Skedda tab)</label>
          <input value={skeddaEmbed} onChange={(e) => setSkeddaEmbed(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="https://skedda.com/book/yourspace" />
        </div>
        <div>
          <label style={labelStyle}>HoneyBook Embed Code (for the HoneyBook tab)</label>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "6px" }}>
            Paste the full embed code snippet from HoneyBook — including any {"<iframe>"} or {"<script>"} tags.
          </div>
          <textarea
            value={honeyBookCode}
            onChange={(e) => setHoneyBookCode(e.target.value)}
            rows={5}
            spellCheck={false}
            style={{
              ...textInput({ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.5" }),
            }}
            placeholder={"<iframe src=\"https://app.honeybook.com/…\" …></iframe>\nor\n<script src=\"…\"></script>"}
          />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} style={{ marginTop: "10px", padding: "7px 18px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Iframe Tab ────────────────────────────────────────────────────────────────

function EmbedTab({ url, placeholder, icon, label }) {
  if (!url) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>{icon}</div>
        <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{label} not configured</div>
        <div style={{ fontSize: "13px" }}>{placeholder}</div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <iframe
        src={url}
        style={{ width: "100%", height: "700px", border: "none", display: "block" }}
        allow="payment"
        title={label}
      />
    </div>
  );
}

// ─── HoneyBook Embed Tab (renders raw embed code) ─────────────────────────────

function HoneyBookEmbedTab({ embedCode }) {
  if (!embedCode?.trim()) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
        <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>HoneyBook embed not configured</div>
        <div style={{ fontSize: "13px" }}>An admin needs to paste the HoneyBook embed code in the Rooms tab settings.</div>
      </div>
    );
  }

  // Wrap the embed code in a full HTML document so scripts execute correctly
  const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: sans-serif; }
  </style>
</head>
<body>
${embedCode}
</body>
</html>`;

  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <iframe
        srcDoc={srcdoc}
        style={{ width: "100%", height: "780px", border: "none", display: "block" }}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="HoneyBook Request Form"
      />
    </div>
  );
}

// ─── Step List Editor ─────────────────────────────────────────────────────────

function StepListEditor({ steps, onChange }) {
  const addStep = () => onChange([...steps, ""]);
  const update = (i, val) => { const n = [...steps]; n[i] = val; onChange(n); };
  const remove = (i) => onChange(steps.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const n = [...steps]; const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; onChange(n);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "6px" }}>
            <button onClick={() => move(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "10px", padding: "1px 3px", opacity: i === 0 ? 0.3 : 1 }}>▲</button>
            <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "10px", padding: "1px 3px", opacity: i === steps.length - 1 ? 0.3 : 1 }}>▼</button>
          </div>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0, marginTop: "8px" }}>{i + 1}</div>
          <textarea
            value={step}
            onChange={(e) => update(i, e.target.value)}
            rows={2}
            style={{ ...textInput({ flex: 1, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }) }}
            placeholder={`Step ${i + 1}…`}
          />
          <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "16px", paddingTop: "8px" }}>✕</button>
        </div>
      ))}
      <button
        onClick={addStep}
        style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: "8px", border: `1px dashed ${C.border}`, background: "none", color: C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer", marginTop: "4px" }}
      >
        + Add Step
      </button>
    </div>
  );
}

// ─── Comm Card Modal ──────────────────────────────────────────────────────────

const CARD_TYPES = [
  { id: "email",   label: "📧 Email Template",    desc: "Pre-written email for client communication" },
  { id: "howto",   label: "📋 How-To Guide",       desc: "Step-by-step process for the team" },
  { id: "general", label: "💬 Notes / Questions",  desc: "Intake questions, general notes, checklists" },
];

const EMAIL_CATEGORIES = ["Inquiry Response", "Booking Confirmation", "Follow-Up", "Cancellation", "Day-Of Instructions", "Other"];
const HOWTO_CATEGORIES = ["Booking Process", "Room Setup", "AV & Tech", "Catering", "Policies", "Other"];
const GENERAL_CATEGORIES = ["Intake Questions", "Pricing FAQ", "Rules & Policies", "Quick Reference", "Other"];

function CommCardModal({ card, onClose, onSave, onDelete }) {
  const isNew = !card?.id;
  const [type, setType] = useState(card?.type || "email");
  const [title, setTitle] = useState(card?.title || "");
  const [category, setCategory] = useState(card?.category || "");
  const [subject, setSubject] = useState(card?.subject || "");
  const [overview, setOverview] = useState(card?.overview || "");
  const [body, setBody] = useState(card?.body || "");
  const [steps, setSteps] = useState(card?.steps || []);
  const [notes, setNotes] = useState(card?.notes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const cats = type === "email" ? EMAIL_CATEGORIES : type === "howto" ? HOWTO_CATEGORIES : GENERAL_CATEGORIES;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ ...card, type, title, category, subject, overview, body, steps, notes });
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 3000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(700px,95vw)", maxHeight: "90vh", overflowY: "auto", background: C.card, borderRadius: "20px", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", zIndex: 3001, padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: C.text }}>{isNew ? "New Card" : "Edit Card"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: C.muted }}>✕</button>
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Card Type</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {CARD_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => { setType(ct.id); setCategory(""); }}
                style={{ padding: "8px 16px", borderRadius: "10px", border: `2px solid ${type === ct.id ? C.accent : C.border}`, background: type === ct.id ? C.accentLight : C.cardBg, color: type === ct.id ? C.accentBright : C.text, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                {ct.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>{CARD_TYPES.find((ct) => ct.id === type)?.desc}</div>
        </div>

        {/* Title + Category */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="Card title…" />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...textInput({ width: "100%" }) }}>
              <option value="">— Select category —</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Email subject */}
        {type === "email" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email Subject Line</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...textInput({ width: "100%" }) }} placeholder="e.g. Booking Confirmation — [Room Name]" />
          </div>
        )}

        {/* Overview / intro */}
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>{type === "email" ? "Email Body" : type === "howto" ? "Overview / Intro" : "Content"}</label>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "6px" }}>Supports paragraphs — press Enter for line breaks.</div>
          <textarea
            value={type === "email" ? body : overview}
            onChange={(e) => type === "email" ? setBody(e.target.value) : setOverview(e.target.value)}
            rows={type === "email" ? 10 : 4}
            style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }) }}
            placeholder={type === "email" ? "Write your email template here…\nUse [Room Name], [Date], [Time], [Client Name] as placeholders." : "Brief overview of this process…"}
          />
        </div>

        {/* Steps (how-to only) */}
        {type === "howto" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Step-by-Step Instructions</label>
            <StepListEditor steps={steps} onChange={setSteps} />
          </div>
        )}

        {/* Notes callout (howto + general) */}
        {(type === "howto" || type === "general") && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Notes & Tips</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...textInput({ width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5", borderColor: "#fbbf24", background: "#fffbeb" }) }}
              placeholder="Any extra tips, warnings, or reminders for the team…"
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", paddingTop: "18px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isNew && (
              <button onClick={() => { onDelete(card.id); onClose(); }} style={{ padding: "9px 18px", borderRadius: "10px", border: `1px solid #fca5a5`, background: "#fff1f2", color: "#dc2626", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                🗑 Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "10px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: "9px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: saving || !title.trim() ? 0.6 : 1 }}>
              {saving ? "Saving…" : isNew ? "Create Card" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Comm Card Display ────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  email:   { icon: "📧", accent: "#6366f1", accentLight: "#eef2ff", label: "Email Template" },
  howto:   { icon: "📋", accent: "#10b981", accentLight: "#ecfdf5", label: "How-To Guide" },
  general: { icon: "💬", accent: "#f59e0b", accentLight: "#fffbeb", label: "Notes / Questions" },
};

function CommCard({ card, isAdmin, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.general;

  const copyText = card.type === "email"
    ? (card.subject ? `Subject: ${card.subject}\n\n${card.body}` : card.body)
    : (card.overview || "");

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: C.shadow }}>
      {/* Accent bar */}
      <div style={{ height: "4px", background: cfg.accent }} />

      {/* Header */}
      <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span style={{ fontSize: "22px", flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: C.text }}>{card.title}</span>
            {card.category && (
              <span style={{ fontSize: "10px", fontWeight: "700", color: cfg.accent, background: cfg.accentLight, padding: "2px 8px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.category}</span>
            )}
          </div>
          {card.type === "email" && card.subject && (
            <div style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>Subject: {card.subject}</div>
          )}
          {card.type === "howto" && card.overview && !expanded && (
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "360px" }}>{card.overview}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {copyText && (
            <button
              onClick={handleCopy}
              style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: copied ? "#ecfdf5" : C.cardBg, color: copied ? "#10b981" : C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onEdit(card)} style={{ padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
              ✏️ Edit
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{ padding: "5px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
          >
            {expanded ? "▲ Collapse" : "▼ Expand"}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 18px 18px" }}>
          {/* Email body */}
          {card.type === "email" && card.body && (
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px", fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {card.body}
            </div>
          )}

          {/* How-to: overview + steps + notes */}
          {card.type === "howto" && (
            <>
              {card.overview && (
                <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px", fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", marginBottom: "14px" }}>
                  {card.overview}
                </div>
              )}
              {card.steps && card.steps.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>Steps</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {card.steps.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                        <div style={{ flex: 1, fontSize: "13px", color: C.text, lineHeight: "1.6", paddingTop: "3px", whiteSpace: "pre-wrap" }}>{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {card.notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#92400e", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  <span style={{ fontWeight: "700" }}>💡 Notes: </span>{card.notes}
                </div>
              )}
            </>
          )}

          {/* General / intake questions */}
          {card.type === "general" && (
            <>
              {card.overview && (
                <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px", fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", marginBottom: card.notes ? "14px" : "0" }}>
                  {card.overview}
                </div>
              )}
              {card.notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#92400e", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  <span style={{ fontWeight: "700" }}>💡 Notes: </span>{card.notes}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Communications Tab ───────────────────────────────────────────────────────

function CommTab({ token, currentUser }) {
  const isAdmin = currentUser?.role === "admin";
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCard, setModalCard] = useState(null);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    apiFetch("/api/confrooms/comms", {}, token)
      .then((r) => r.json())
      .then((data) => {
        setCards(Array.isArray(data.cards) ? data.cards : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (updated) => {
    // Assign a temporary client-side id so the card is immediately editable
    const withId = updated.id ? updated : { ...updated, id: `c_${Date.now().toString(36)}` };
    let newCards;
    if (withId.id && cards.find((c) => c.id === withId.id)) {
      newCards = cards.map((c) => c.id === withId.id ? withId : c);
    } else {
      newCards = [...cards, withId];
    }
    setCards(newCards);
    // Use server-returned cards so IDs are canonical
    const res = await apiFetch("/api/confrooms/comms", { method: "PUT", body: JSON.stringify({ cards: newCards }) }, token);
    const data = await res.json();
    if (Array.isArray(data.cards)) setCards(data.cards);
  };

  const remove = async (id) => {
    const newCards = cards.filter((c) => c.id !== id);
    setCards(newCards);
    await apiFetch("/api/confrooms/comms", { method: "PUT", body: JSON.stringify({ cards: newCards }) }, token);
  };

  const filtered = filterType === "all" ? cards : cards.filter((c) => c.type === filterType);

  const emailCards = filtered.filter((c) => c.type === "email");
  const howtoCards = filtered.filter((c) => c.type === "howto");
  const generalCards = filtered.filter((c) => c.type === "general");

  const FILTER_TABS = [
    { id: "all",     label: "All Cards" },
    { id: "email",   label: "📧 Email Templates" },
    { id: "howto",   label: "📋 How-To Guides" },
    { id: "general", label: "💬 Notes & Questions" },
  ];

  const SectionHeader = ({ icon, title, accent, count }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", marginTop: "8px" }}>
      <div style={{ width: "3px", height: "20px", borderRadius: "2px", background: accent }} />
      <span style={{ fontSize: "13px", fontWeight: "800", color: C.text }}>{icon} {title}</span>
      <span style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>({count})</span>
    </div>
  );

  return (
    <div>
      {/* Sub-filter bar + Add button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {FILTER_TABS.map((ft) => (
            <button
              key={ft.id}
              onClick={() => setFilterType(ft.id)}
              style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${filterType === ft.id ? C.accent : C.border}`, background: filterType === ft.id ? C.accentLight : "none", color: filterType === ft.id ? C.accentBright : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              {ft.label}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => setModalCard({})}
            style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
          >
            + New Card
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.muted }}>Loading…</div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>📨</div>
          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No communications yet</div>
          <div style={{ fontSize: "13px" }}>Add email templates, how-to guides, and intake questions for the team.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {(filterType === "all" || filterType === "email") && emailCards.length > 0 && (
            <div>
              <SectionHeader icon="📧" title="Email Templates" accent="#6366f1" count={emailCards.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {emailCards.map((c) => <CommCard key={c.id} card={c} isAdmin={isAdmin} onEdit={(card) => setModalCard(card)} />)}
              </div>
            </div>
          )}
          {(filterType === "all" || filterType === "howto") && howtoCards.length > 0 && (
            <div>
              <SectionHeader icon="📋" title="How-To Guides" accent="#10b981" count={howtoCards.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {howtoCards.map((c) => <CommCard key={c.id} card={c} isAdmin={isAdmin} onEdit={(card) => setModalCard(card)} />)}
              </div>
            </div>
          )}
          {(filterType === "all" || filterType === "general") && generalCards.length > 0 && (
            <div>
              <SectionHeader icon="💬" title="Notes & Questions" accent="#f59e0b" count={generalCards.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {generalCards.map((c) => <CommCard key={c.id} card={c} isAdmin={isAdmin} onEdit={(card) => setModalCard(card)} />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted, fontSize: "13px" }}>
              No cards of this type yet.
            </div>
          )}
        </div>
      )}

      {modalCard !== null && (
        <CommCardModal
          card={Object.keys(modalCard).length === 0 ? null : modalCard}
          onClose={() => setModalCard(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}

// ─── Main ConfRoomsView ────────────────────────────────────────────────────────

const TABS = [
  { id: "rooms",    label: "🏢 Rooms" },
  { id: "comms",    label: "📨 Communications" },
  { id: "skedda",   label: "📅 Book on Skedda" },
  { id: "honeybook", label: "📋 HoneyBook Request" },
];

export default function ConfRoomsView({ token, currentUser }) {
  const [tab, setTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalRoom, setModalRoom] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/confrooms", {}, token).then((r) => r.json()),
      apiFetch("/api/confrooms/settings", {}, token).then((r) => r.json()),
      apiFetch("/api/locations", {}, token).then((r) => r.json()),
    ])
      .then(([rooms, settings, locations]) => {
        setRooms(Array.isArray(rooms) ? rooms : []);
        setSettings(settings || {});
        setLocations(Array.isArray(locations) ? locations : []);
      })
      .catch(() => {})
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

  // Filter rooms by selected location chip
  const filtered = rooms.filter((r) => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.amenities || "").toLowerCase().includes(search.toLowerCase());
    const matchLoc = !selectedLocation || r.linkedLocationId === selectedLocation;
    return matchSearch && matchLoc;
  });

  // Location chips (rooms that have a linked location)
  const linkedLocations = locations.filter((l) => rooms.some((r) => r.linkedLocationId === l.id));

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: C.text }}>🏢 Conference Rooms</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Capacity, pricing, amenities, and booking info for all rooms.</p>
        </div>
        {tab === "rooms" && currentUser?.role === "admin" && (
          <button onClick={() => setModalRoom(false)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            + Add Room
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: `1px solid ${C.border}`, paddingBottom: "0" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: tab === t.id ? "700" : "500",
              color: tab === t.id ? C.accentBright : C.muted,
              borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
              marginBottom: "-1px", transition: "all 0.12s", borderRadius: "0",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ROOMS TAB ── */}
      {tab === "rooms" && (
        <>
          {/* Admin embed settings */}
          <EmbedSettings token={token} currentUser={currentUser} settings={settings} onSettingsChange={setSettings} />

          {/* Location filter chips */}
          {linkedLocations.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
              <button onClick={() => setSelectedLocation(null)} style={{ padding: "5px 14px", borderRadius: "20px", border: `1px solid ${!selectedLocation ? C.accent : C.border}`, background: !selectedLocation ? C.accentLight : "none", color: !selectedLocation ? C.accentBright : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                All
              </button>
              {linkedLocations.map((l) => (
                <button key={l.id} onClick={() => setSelectedLocation(selectedLocation === l.id ? null : l.id)} style={{ padding: "5px 14px", borderRadius: "20px", border: `1px solid ${selectedLocation === l.id ? C.accent : C.border}`, background: selectedLocation === l.id ? C.accentLight : "none", color: selectedLocation === l.id ? C.accentBright : C.muted, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                  📍 {l.name}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          {rooms.length > 3 && (
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rooms, amenities…" style={{ ...textInput({ width: "280px", marginBottom: "16px" }) }} />
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.muted }}>Loading rooms…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏢</div>
              <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{rooms.length === 0 ? "No rooms yet" : "No results"}</div>
              <div style={{ fontSize: "13px" }}>{rooms.length === 0 ? "Add your first conference room to get started." : "Try a different search or filter."}</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}>
              {filtered.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => setModalRoom(room)}
                  onNavigateToLocation={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── COMMUNICATIONS TAB ── */}
      {tab === "comms" && (
        <CommTab token={token} currentUser={currentUser} />
      )}

      {/* ── SKEDDA TAB ── */}
      {tab === "skedda" && (
        <EmbedTab
          url={settings?.skeddaEmbedUrl}
          icon="📅"
          label="Skedda Booking"
          placeholder="An admin needs to set the Skedda embed URL in the Rooms tab settings."
        />
      )}

      {/* ── HONEYBOOK TAB ── */}
      {tab === "honeybook" && (
        <HoneyBookEmbedTab embedCode={settings?.honeyBookEmbedCode} />
      )}

      {/* Modal */}
      {modalRoom !== null && (
        <RoomModal
          room={modalRoom || null}
          token={token}
          locations={locations}
          currentUser={currentUser}
          onClose={() => setModalRoom(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
