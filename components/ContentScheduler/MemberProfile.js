"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#3B82F6", "#06B6D4",
];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Avatar({ name = "", imageUrl, size = 48 }) {
  const [imgError, setImgError] = useState(false);
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: `2px solid ${C.border}`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(name), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: "700", flexShrink: 0,
      border: `2px solid ${C.border}`,
    }}>
      {initials(name)}
    </div>
  );
}

function Pill({ label, color = C.accent, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "20px",
      background: bg || `${color}1A`,
      color: color,
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.04em",
    }}>
      {label}
    </span>
  );
}

function FieldDisplay({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.5" }}>{value}</div>
    </div>
  );
}

function inputStyle(focused) {
  return {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${focused ? C.accent : C.border}`,
    borderRadius: "8px",
    background: C.inputBg,
    color: C.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
}

function FocusInput({ label, value, onChange, placeholder, type = "text", required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </div>
  );
}

function FocusTextarea({ label, value, onChange, placeholder, hint, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle(focused), resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }}
      />
      {hint && <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

const ORG_LEVELS = ["Leadership", "Manager", "Team Lead", "Member", "Volunteer"];

// ─── Profile Edit Form (shared between MyProfile and admin slide-over) ─────────

function ProfileEditForm({ form, set, currentUserName, photoInputRef, teamMembers = [], hidingUserId }) {
  const otherMembers = teamMembers.filter((m) => m.id !== hidingUserId);

  return (
    <div>
      {/* Photo upload */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
          Upload Photo
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {form.image ? (
            <img
              src={form.image}
              alt="Preview"
              style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}`, flexShrink: 0 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#6366F1", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: "700", flexShrink: 0,
              border: `2px solid ${C.border}`,
            }}>
              {(currentUserName || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              border: `1px solid ${C.border}`, background: C.cardBg,
              color: C.text, fontSize: "13px", fontWeight: "600", cursor: "pointer",
            }}
          >
            Choose Photo
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => set("image", ev.target.result);
              reader.readAsDataURL(file);
            }}
          />
        </div>
      </div>
      <FocusInput label="Profile Image URL" value={form.image} onChange={(v) => set("image", v)} placeholder="https://example.com/avatar.jpg" />
      <FocusInput label="Job Title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} placeholder="e.g. Content Strategist" />
      <FocusInput label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@example.com" />
      <FocusInput label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="e.g. (555) 123-4567" />
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Org Level</label>
        <select
          value={form.orgLevel}
          onChange={(e) => set("orgLevel", e.target.value)}
          style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: form.orgLevel ? C.text : C.muted, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        >
          <option value="">Select org level…</option>
          {ORG_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {/* Reports To */}
      {otherMembers.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Reports To</label>
          <select
            value={form.reportsTo || ""}
            onChange={(e) => {
              const m = otherMembers.find((m) => m.id === e.target.value);
              set("reportsTo", e.target.value);
              set("reportsToName", m?.name || "");
            }}
            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: form.reportsTo ? C.text : C.muted, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          >
            <option value="">— None —</option>
            {otherMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}
      <FocusTextarea label="Bio" value={form.bio} onChange={(v) => set("bio", v)} placeholder="Tell us about yourself…" rows={3} />
      <FocusTextarea label="Fun Facts" value={form.funFacts} onChange={(v) => set("funFacts", v)} placeholder="Share a fun fact about yourself" hint="Share a fun fact about yourself" rows={2} />
    </div>
  );
}

// ─── Member Card (Directory) ──────────────────────────────────────────────────

function MemberCard({ member, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(member)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? C.accent : C.border}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? C.shadowMd : C.shadow,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "10px",
      }}
    >
      <Avatar name={member.name} imageUrl={member.profile?.image} size={56} />
      <div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: C.text }}>{member.name}</div>
        {member.profile?.jobTitle && (
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "3px" }}>{member.profile.jobTitle}</div>
        )}
        {member.profile?.orgLevel && (
          <div style={{ marginTop: "6px" }}>
            <Pill label={member.profile.orgLevel} />
          </div>
        )}
        {member.profile?.reportsToName && (
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>
            Reports to: <span style={{ fontWeight: "600", color: C.text }}>{member.profile.reportsToName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Member Profile Slide-over ────────────────────────────────────────────────

function MemberSlideOver({ member, onClose, token, currentUser, teamMembers = [], onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    image: "", jobTitle: "", email: "", phone: "",
    bio: "", orgLevel: "", funFacts: "", reportsTo: "", reportsToName: "",
  });
  const photoInputRef = useRef(null);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    setEditing(false);
    fetch(`/api/profile?userId=${member.id}`, { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data || {});
        setForm({
          image: data?.image || "",
          jobTitle: data?.jobTitle || "",
          email: data?.email || "",
          phone: data?.phone || "",
          bio: data?.bio || "",
          orgLevel: data?.orgLevel || "",
          funFacts: data?.funFacts || "",
          reportsTo: data?.reportsTo || "",
          reportsToName: data?.reportsToName || "",
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [member, token]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify({ ...form, targetUserId: member.id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setProfile(data);
      setEditing(false);
      if (onProfileUpdated) onProfileUpdated(member.id, data);
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      image: profile?.image || "",
      jobTitle: profile?.jobTitle || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      orgLevel: profile?.orgLevel || "",
      funFacts: profile?.funFacts || "",
      reportsTo: profile?.reportsTo || "",
      reportsToName: profile?.reportsToName || "",
    });
    setEditing(false);
    setError("");
  };

  if (!member) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "440px", maxWidth: "100vw",
        background: C.surface || C.card,
        borderLeft: `1px solid ${C.border}`,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        zIndex: 1001,
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: C.surface || C.card, zIndex: 1,
        }}>
          <span style={{ fontSize: "15px", fontWeight: "700", color: C.text }}>
            {editing ? `Edit ${member.name}'s Profile` : "Member Profile"}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isAdmin && !editing && !loading && (
              <button
                onClick={() => setEditing(true)}
                style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                ✏️ Edit
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: C.muted, padding: "4px", lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: C.muted, fontSize: "14px" }}>Loading profile…</div>
          ) : editing ? (
            <>
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "13px", marginBottom: "16px" }}>
                  {error}
                </div>
              )}
              <ProfileEditForm form={form} set={set} currentUserName={member.name} photoInputRef={photoInputRef} teamMembers={teamMembers} hidingUserId={member.id} />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button onClick={handleCancel} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: "8px", border: "none", background: saving ? C.muted : C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          ) : !profile || Object.keys(profile).length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>👤</div>
              <div style={{ fontSize: "14px", color: C.muted }}>Profile not set up yet</div>
              {isAdmin && (
                <button onClick={() => setEditing(true)} style={{ marginTop: "14px", padding: "8px 18px", borderRadius: "8px", border: `1px solid ${C.accent}`, background: C.accentLight, color: C.accentBright, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  + Set Up Profile
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "16px",
                marginBottom: "24px", padding: "16px",
                background: C.cardBg, borderRadius: "12px",
                border: `1px solid ${C.border}`,
              }}>
                <Avatar name={member.name} imageUrl={profile.image} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: C.text }}>{member.name}</div>
                  {profile.jobTitle && (
                    <div style={{ fontSize: "13px", color: C.muted, marginTop: "3px" }}>{profile.jobTitle}</div>
                  )}
                  {profile.orgLevel && (
                    <div style={{ marginTop: "8px" }}>
                      <Pill label={profile.orgLevel} />
                    </div>
                  )}
                  {profile.reportsToName && (
                    <div style={{ fontSize: "12px", color: C.muted, marginTop: "8px" }}>
                      👤 Reports to: <span style={{ fontWeight: "600", color: C.text }}>{profile.reportsToName}</span>
                    </div>
                  )}
                </div>
              </div>

              <FieldDisplay label="Email" value={profile.email} />
              <FieldDisplay label="Phone" value={profile.phone} />
              {profile.bio && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Bio</div>
                  <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.6", padding: "12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                    {profile.bio}
                  </div>
                </div>
              )}
              {profile.funFacts && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Fun Facts</div>
                  <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.6", padding: "12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                    {profile.funFacts}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── My Profile Tab ───────────────────────────────────────────────────────────

function MyProfileTab({ currentUser, token, teamMembers = [] }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    image: "", jobTitle: "", email: "", phone: "",
    bio: "", orgLevel: "", funFacts: "", reportsTo: "", reportsToName: "",
  });
  const photoInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/profile", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data || {});
        setForm({
          image: data?.image || "",
          jobTitle: data?.jobTitle || "",
          email: data?.email || "",
          phone: data?.phone || "",
          bio: data?.bio || "",
          orgLevel: data?.orgLevel || "",
          funFacts: data?.funFacts || "",
          reportsTo: data?.reportsTo || "",
          reportsToName: data?.reportsToName || "",
        });
      })
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": token },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setProfile(data);
      setEditing(false);
    } catch (e) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      image: profile?.image || "",
      jobTitle: profile?.jobTitle || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      orgLevel: profile?.orgLevel || "",
      funFacts: profile?.funFacts || "",
      reportsTo: profile?.reportsTo || "",
      reportsToName: profile?.reportsToName || "",
    });
    setEditing(false);
    setError("");
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "64px 16px", color: C.muted, fontSize: "14px" }}>Loading profile…</div>;
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "16px", padding: "24px",
        boxShadow: C.shadow, marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar name={currentUser?.name || ""} imageUrl={profile?.image} size={72} />
            <div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: C.text }}>{currentUser?.name}</div>
              {profile?.jobTitle && (
                <div style={{ fontSize: "13px", color: C.muted, marginTop: "3px" }}>{profile.jobTitle}</div>
              )}
              {profile?.orgLevel && <div style={{ marginTop: "8px" }}><Pill label={profile.orgLevel} /></div>}
              {profile?.reportsToName && (
                <div style={{ fontSize: "12px", color: C.muted, marginTop: "6px" }}>
                  👤 Reports to: <span style={{ fontWeight: "600", color: C.text }}>{profile.reportsToName}</span>
                </div>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ padding: "8px 18px", borderRadius: "20px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.text, fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "border-color 0.15s" }}
            >
              ✏️ Edit Profile
            </button>
          )}
          {editing && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleCancel} style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", background: saving ? C.muted : C.accent, color: "#fff", fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {editing ? (
          <ProfileEditForm form={form} set={set} currentUserName={currentUser?.name} photoInputRef={photoInputRef} teamMembers={teamMembers} hidingUserId={currentUser?.id} />
        ) : (
          <div>
            {!profile?.email && !profile?.phone && !profile?.bio && !profile?.funFacts ? (
              <div style={{ textAlign: "center", padding: "32px 16px", background: C.cardBg, borderRadius: "10px", border: `1px dashed ${C.border}`, color: C.muted, fontSize: "13px" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🙂</div>
                Your profile is empty. Click "Edit Profile" to fill it in.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <FieldDisplay label="Email" value={profile?.email} />
                <FieldDisplay label="Phone" value={profile?.phone} />
                {profile?.bio && (
                  <div style={{ gridColumn: "1 / -1", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Bio</div>
                    <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.6", padding: "12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>{profile.bio}</div>
                  </div>
                )}
                {profile?.funFacts && (
                  <div style={{ gridColumn: "1 / -1", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Fun Facts</div>
                    <div style={{ fontSize: "14px", color: C.text, lineHeight: "1.6", padding: "12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}` }}>{profile.funFacts}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Directory Tab ───────────────────────────────────────────────────────

function TeamDirectoryTab({ teamMembers, token, currentUser }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [search, setSearch] = useState("");

  const loadProfile = (id) => {
    fetch(`/api/profile?userId=${id}`, { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setProfiles((prev) => ({ ...prev, [id]: data }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!teamMembers.length) return;
    teamMembers.forEach((m) => loadProfile(m.id));
  }, [teamMembers, token]); // eslint-disable-line

  const handleProfileUpdated = (userId, updatedProfile) => {
    setProfiles((prev) => ({ ...prev, [userId]: updatedProfile }));
  };

  const membersWithProfiles = teamMembers.map((m) => ({
    ...m,
    profile: profiles[m.id] || m.profile || null,
  }));

  const filtered = search
    ? membersWithProfiles.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.profile?.jobTitle || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.profile?.orgLevel || "").toLowerCase().includes(search.toLowerCase())
      )
    : membersWithProfiles;

  return (
    <div>
      {/* Search */}
      {teamMembers.length > 4 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team members…"
          style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.inputBg, color: C.text, fontSize: "13px", outline: "none", width: "260px", marginBottom: "16px", boxSizing: "border-box" }}
        />
      )}

      {teamMembers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 16px", background: C.cardBg, borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
          <div style={{ fontSize: "14px" }}>No team members yet</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} onClick={setSelectedMember} />
          ))}
        </div>
      )}

      {selectedMember && (
        <MemberSlideOver
          member={selectedMember}
          token={token}
          currentUser={currentUser}
          teamMembers={teamMembers}
          onClose={() => setSelectedMember(null)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function MemberProfile({ currentUser, token, teamMembers = [] }) {
  const [tab, setTab] = useState("my-profile");

  const tabs = [
    { id: "my-profile", label: "My Profile" },
    { id: "directory", label: "Team Directory" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: C.text }}>Profile</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Manage your profile and explore the team directory</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: tab === t.id ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
              marginBottom: "-1px",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "my-profile" && (
        <MyProfileTab currentUser={currentUser} token={token} teamMembers={teamMembers} />
      )}
      {tab === "directory" && (
        <TeamDirectoryTab teamMembers={teamMembers} token={token} currentUser={currentUser} />
      )}
    </div>
  );
}
