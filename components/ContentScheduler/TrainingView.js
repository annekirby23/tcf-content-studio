"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./constants";

// ─── helpers ──────────────────────────────────────────────────────────────────
function genHex() {
  return Math.random().toString(16).slice(2, 10);
}

function transformEmbedUrl(raw) {
  if (!raw) return "";
  // If it's already an iframe, extract src
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  // youtube.com/watch?v=XXX  →  youtube.com/embed/XXX
  const ytWatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
  // youtube.com/shorts/XXX
  const ytShorts = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;
  // vimeo.com/12345
  const vimeo = raw.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return raw;
}

// ─── shared constants ─────────────────────────────────────────────────────────
const LINK_CATEGORIES = ["Onboarding", "Policies", "Software", "Safety", "General"];
const CATEGORY_COLOR = {
  Onboarding: { color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  Policies:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  Software:   { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  Safety:     { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  General:    { color: "#64748B", bg: "rgba(100,116,139,0.12)" },
};

// ─── shared styles ────────────────────────────────────────────────────────────
const inputStyle = (extra = {}) => ({
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.inputBg,
  color: C.text, fontSize: 14, outline: "none",
  boxSizing: "border-box", ...extra,
});
const labelSt = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" };
const btnPrimary = (saving) => ({
  padding: "8px 20px", borderRadius: 8, border: "none",
  background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600,
  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
});
const btnSecondary = {
  padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: "transparent", color: C.muted, fontSize: 14, cursor: "pointer",
};
const iconBtn = (color = "#EF4444") => ({
  padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
  background: `${color}1A`, color, border: "none", fontWeight: 600,
});

function SectionEmpty({ icon, message }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{message}</div>
      <div style={{ fontSize: 13 }}>Use the form above to add your first item.</div>
    </div>
  );
}

// ─── Videos Tab ───────────────────────────────────────────────────────────────
function VideosTab({ token }) {
  const [videos, setVideos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [form, setForm]           = useState({ title: "", description: "", embedUrl: "" });
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/training", { headers: { "x-session": token } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setVideos(data.videos || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    load();
  }, [token]);

  async function save(newVideos) {
    const res = await fetch("/api/training", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-session": token },
      body: JSON.stringify({ videos: newVideos }),
    });
    if (!res.ok) throw new Error("Failed to save");
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.embedUrl.trim()) return;
    setSaving(true);
    try {
      const item = { id: genHex(), title: form.title.trim(), description: form.description.trim(), embedUrl: transformEmbedUrl(form.embedUrl.trim()) };
      const updated = [item, ...videos];
      await save(updated);
      setVideos(updated);
      setForm({ title: "", description: "", embedUrl: "" });
      setShowAdd(false);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this video?")) return;
    const updated = videos.filter((v) => v.id !== id);
    try { await save(updated); setVideos(updated); } catch (e) { alert(e.message); }
  }

  return (
    <div>
      {/* Add form */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 16, marginBottom: 20, boxShadow: C.shadow,
      }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{
            ...btnPrimary(false), background: "transparent", color: C.accent,
            border: `1px dashed ${C.accent}`, width: "100%", textAlign: "center",
            padding: "10px 0",
          }}>
            + Add Training Video
          </button>
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Add Training Video</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inputStyle()} value={form.title} placeholder="e.g. New Member Onboarding"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>YouTube / Vimeo URL or embed code *</label>
                <input style={inputStyle()} value={form.embedUrl} placeholder="https://youtube.com/watch?v=..."
                  onChange={(e) => setForm((f) => ({ ...f, embedUrl: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>Description</label>
                <textarea style={{ ...inputStyle(), minHeight: 64, resize: "vertical" }} value={form.description}
                  placeholder="What is this video about?"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAdd(false); setForm({ title: "", description: "", embedUrl: "" }); }} style={btnSecondary}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={btnPrimary(saving)}>{saving ? "Saving…" : "Save Video"}</button>
            </div>
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading…</div>}

      {!loading && videos.length === 0 && (
        <SectionEmpty icon="🎬" message="No training videos yet" />
      )}

      {!loading && videos.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}>
          {videos.map((v) => (
            <div key={v.id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              overflow: "hidden", boxShadow: C.shadow,
            }}>
              {/* Toggle preview */}
              {previewId === v.id ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
                  <iframe src={v.embedUrl} title={v.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                </div>
              ) : (
                <button onClick={() => setPreviewId(v.id)} style={{
                  width: "100%", height: 180, background: "#0f172a", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 8,
                }}>
                  <div style={{ fontSize: 40 }}>▶</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Click to play</div>
                </button>
              )}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, flex: 1 }}>{v.title}</div>
                  <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                    {previewId === v.id
                      ? <button onClick={() => setPreviewId(null)} style={iconBtn("#64748B")}>Hide</button>
                      : <button onClick={() => setPreviewId(v.id)} style={iconBtn(C.accent)}>Play</button>
                    }
                    <button onClick={() => handleDelete(v.id)} style={iconBtn()}>Del</button>
                  </div>
                </div>
                {v.description && (
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{v.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Links Tab ────────────────────────────────────────────────────────────────
function LinksTab({ token }) {
  const [links, setLinks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title: "", url: "", description: "", category: "General" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/training", { headers: { "x-session": token } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLinks(data.links || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    load();
  }, [token]);

  async function save(newLinks) {
    const res = await fetch("/api/training", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-session": token },
      body: JSON.stringify({ links: newLinks }),
    });
    if (!res.ok) throw new Error("Failed to save");
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      let updated;
      if (editItem) {
        updated = links.map((l) => l.id === editItem.id ? { ...l, ...form } : l);
      } else {
        const item = { id: genHex(), ...form, title: form.title.trim(), url: form.url.trim() };
        updated = [item, ...links];
      }
      await save(updated);
      setLinks(updated);
      setForm({ title: "", url: "", description: "", category: "General" });
      setShowAdd(false);
      setEditItem(null);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this link?")) return;
    const updated = links.filter((l) => l.id !== id);
    try { await save(updated); setLinks(updated); } catch (e) { alert(e.message); }
  }

  function startEdit(link) {
    setForm({ title: link.title, url: link.url, description: link.description || "", category: link.category || "General" });
    setEditItem(link);
    setShowAdd(true);
  }

  return (
    <div>
      {/* Add/edit form */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 16, marginBottom: 20, boxShadow: C.shadow,
      }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{
            ...btnPrimary(false), background: "transparent", color: C.accent,
            border: `1px dashed ${C.accent}`, width: "100%", textAlign: "center", padding: "10px 0",
          }}>
            + Add Training Link
          </button>
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>
              {editItem ? "Edit Link" : "Add Training Link"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inputStyle()} value={form.title} placeholder="Link title"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>URL *</label>
                <input style={inputStyle()} value={form.url} placeholder="https://..."
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={inputStyle()}>
                  {LINK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Description</label>
                <input style={inputStyle()} value={form.description} placeholder="Brief description"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAdd(false); setEditItem(null); setForm({ title: "", url: "", description: "", category: "General" }); }} style={btnSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary(saving)}>{saving ? "Saving…" : editItem ? "Update Link" : "Save Link"}</button>
            </div>
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading…</div>}
      {!loading && links.length === 0 && <SectionEmpty icon="🔗" message="No training links yet" />}

      {!loading && links.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {links.map((link) => {
            const cc = CATEGORY_COLOR[link.category] || CATEGORY_COLOR["General"];
            return (
              <div key={link.id} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: "14px 16px", boxShadow: C.shadow,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: cc.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>🔗</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{
                      fontWeight: 700, fontSize: 14, color: C.accent, textDecoration: "none",
                    }}
                      onClick={(e) => e.stopPropagation()}
                    >{link.title}</a>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      color: cc.color, background: cc.bg,
                    }}>{link.category || "General"}</span>
                  </div>
                  {link.description && (
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{link.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4, wordBreak: "break-all" }}>{link.url}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(link)} style={iconBtn(C.accent)}>Edit</button>
                  <button onClick={() => handleDelete(link.id)} style={iconBtn()}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PDFs Tab ─────────────────────────────────────────────────────────────────
function PdfsTab({ token }) {
  const [pdfs, setPdfs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [form, setForm]         = useState({ title: "", url: "", filename: "", description: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/training", { headers: { "x-session": token } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPdfs(data.pdfs || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    load();
  }, [token]);

  async function save(newPdfs) {
    const res = await fetch("/api/training", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-session": token },
      body: JSON.stringify({ pdfs: newPdfs }),
    });
    if (!res.ok) throw new Error("Failed to save");
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, filename: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, url: ev.target.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const item = {
        id: genHex(),
        title: form.title.trim(),
        url: form.url.trim(),
        filename: form.filename.trim(),
        description: form.description.trim(),
      };
      const updated = [item, ...pdfs];
      await save(updated);
      setPdfs(updated);
      setForm({ title: "", url: "", filename: "", description: "" });
      setShowAdd(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this PDF?")) return;
    const updated = pdfs.filter((p) => p.id !== id);
    try { await save(updated); setPdfs(updated); } catch (e) { alert(e.message); }
  }

  return (
    <div>
      {/* Add form */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 16, marginBottom: 20, boxShadow: C.shadow,
      }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{
            ...btnPrimary(false), background: "transparent", color: C.accent,
            border: `1px dashed ${C.accent}`, width: "100%", textAlign: "center", padding: "10px 0",
          }}>
            + Add PDF Resource
          </button>
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Add PDF Resource</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inputStyle()} value={form.title} placeholder="PDF title"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>External URL (Google Drive, Dropbox, etc.)</label>
                <input style={inputStyle()} value={form.url} placeholder="https://drive.google.com/..."
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelSt}>— OR upload a PDF file —</label>
                <div style={{
                  border: `1.5px dashed ${C.border}`, borderRadius: 8,
                  padding: "16px", textAlign: "center", background: C.cardBg,
                }}>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange}
                    style={{ display: "none" }} id="pdf-upload" />
                  <label htmlFor="pdf-upload" style={{
                    cursor: "pointer", color: C.accent, fontWeight: 600, fontSize: 14,
                  }}>
                    {form.filename ? `✓ ${form.filename}` : "Click to choose a PDF"}
                  </label>
                </div>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelSt}>Description</label>
                <input style={inputStyle()} value={form.description} placeholder="Brief description"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAdd(false); setForm({ title: "", url: "", filename: "", description: "" }); if (fileRef.current) fileRef.current.value = ""; }} style={btnSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary(saving)}>{saving ? "Saving…" : "Save PDF"}</button>
            </div>
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading…</div>}
      {!loading && pdfs.length === 0 && <SectionEmpty icon="📄" message="No PDF resources yet" />}

      {!loading && pdfs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pdfs.map((pdf) => (
            <div key={pdf.id}>
              <div style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: "14px 16px", boxShadow: C.shadow,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{pdf.title}</div>
                  {pdf.filename && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{pdf.filename}</div>
                  )}
                  {pdf.description && (
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{pdf.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {pdf.url && (
                    <>
                      {pdf.url.startsWith("data:") ? (
                        <button onClick={() => setPreviewId(previewId === pdf.id ? null : pdf.id)} style={iconBtn(C.accent)}>
                          {previewId === pdf.id ? "Hide" : "Preview"}
                        </button>
                      ) : (
                        <a href={pdf.url} target="_blank" rel="noreferrer" style={{
                          ...iconBtn(C.accent), textDecoration: "none", display: "inline-flex", alignItems: "center",
                        }}>Open</a>
                      )}
                    </>
                  )}
                  <button onClick={() => handleDelete(pdf.id)} style={iconBtn()}>Del</button>
                </div>
              </div>

              {/* Inline preview for base64 PDFs */}
              {previewId === pdf.id && pdf.url.startsWith("data:") && (
                <div style={{
                  border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden",
                  marginTop: 4, boxShadow: C.shadow,
                }}>
                  <iframe src={pdf.url} title={pdf.title}
                    style={{ width: "100%", height: 500, border: "none", display: "block" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function TrainingView({ token, currentUser }) {
  const [activeTab, setActiveTab] = useState("videos");

  const tabs = [
    { key: "videos", label: "🎬 Training Videos" },
    { key: "links",  label: "🔗 Training Links" },
    { key: "pdfs",   label: "📄 PDF Resources" },
  ];

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Training & Resources</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
          Team training materials, reference links, and PDF documents.
        </div>
      </div>

      {/* Tab pills */}
      <div style={{
        display: "flex", gap: 4, background: C.cardBg,
        border: `1px solid ${C.border}`, borderRadius: 10, padding: 3,
        marginBottom: 20, width: "fit-content",
      }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
            background: activeTab === t.key ? C.accent : "transparent",
            color: activeTab === t.key ? "#fff" : C.muted,
            whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "videos" && <VideosTab token={token} />}
      {activeTab === "links"  && <LinksTab  token={token} />}
      {activeTab === "pdfs"   && <PdfsTab   token={token} />}
    </div>
  );
}
