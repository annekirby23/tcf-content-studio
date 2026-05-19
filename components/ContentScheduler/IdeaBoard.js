"use client";

import { useState, useEffect, useCallback } from "react";
import { C, THEMES, THEME_MAP } from "./constants";

const INSPIRATION_PILLS = [
  { title: "Behind the scenes of our process", caption: "Ever wonder what really happens behind the scenes at [Organization]? Here's an honest look at how we do things — the messy, real parts included. 👇 Drop your questions below!" },
  { title: "Member spotlight: share a win", caption: "🎉 Community win alert! We're shining a spotlight on [Member Name] this week. [Describe their achievement or contribution]. This is exactly why we do what we do. Comment with YOUR latest win — we want to celebrate you too!" },
  { title: "Answer the #1 question we get asked", caption: "We get this question ALL the time: \"[Question]\" So let's settle it once and for all. Here's our honest answer 👇\n\n[Your answer here]\n\nHave a question you want us to tackle? Drop it in the comments." },
  { title: "This week's team highlight", caption: "Shoutout to [Team Member] for [accomplishment/contribution] this week! 🙌 Great teams are built one great person at a time. Who on YOUR team deserves a shoutout today?" },
  { title: "What we learned this month", caption: "Month in review 📋 Here's what we learned in [Month]:\n\n✅ [Lesson 1]\n✅ [Lesson 2]\n✅ [Lesson 3]\n\nGrowth isn't always pretty, but it's always worth it. What did YOU learn this month?" },
  { title: "Community poll: vote on our next topic", caption: "We want YOUR input! 🗳️ What should we cover next?\n\n🅰️ [Option A]\n🅱️ [Option B]\n\nVote in the comments — most votes wins and we'll create the content just for you!" },
  { title: "5 tips our members love", caption: "5 things our members say changed the game for them 🎯\n\n1️⃣ [Tip 1]\n2️⃣ [Tip 2]\n3️⃣ [Tip 3]\n4️⃣ [Tip 4]\n5️⃣ [Tip 5]\n\nSave this for later. Which one resonates most with you?" },
  { title: "Throwback: how we started", caption: "Throwback to where it all began ✨ [Share your origin story — what problem you were solving, what the early days looked like, what almost made you quit]. We've come a long way. Grateful for every single one of you who's been part of this journey. 🙏" },
  { title: "Quick win you can apply today", caption: "Here's a quick win you can apply TODAY 💡\n\n[Describe the quick win or tip in 2-3 sentences]\n\nNo fluff, no gatekeeping — just something that actually works. Try it and let me know how it goes in the comments 👇" },
  { title: "Introducing a new team member", caption: "🎊 Please give a warm welcome to [Name], our newest [Role]! \n\nA few fun facts about [Name]:\n🏠 From: [Location]\n🎯 Specialty: [Skill/Focus]\n🌟 Fun fact: [Something personal]\n\nWe're so excited to have [him/her/them] on the team. Say hello in the comments!" },
  { title: "Event recap + key takeaways", caption: "We just wrapped [Event Name] and WOW 🤩 Here are the top takeaways:\n\n🔑 [Key takeaway 1]\n🔑 [Key takeaway 2]\n🔑 [Key takeaway 3]\n\nMissed it? We've got you — [link to recording/recap/resources]. See you at the next one!" },
  { title: "Our most popular post this month", caption: "Our most popular post this month blew us away 📈 In case you missed it:\n\n[Summarize or re-share the content]\n\nThank you for the incredible response. This kind of engagement is what keeps us going. Which post should we expand on next?" },
];

function formatRelativeTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function IdeaBoard({ currentUser, token, onMakePost }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", "x-session": token }),
    [token]
  );

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ideas", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch ideas");
      const data = await res.json();
      setIdeas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const sortedIdeas = [...ideas].sort(
    (a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
  );

  async function handleAddIdea(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          theme: newTheme || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add idea");
      const created = await res.json();
      setIdeas((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewTheme("");
      setShowAddForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(ideaId) {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ action: "upvote" }),
      });
      if (!res.ok) throw new Error("Failed to upvote");
      const updated = await res.json();
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? updated : idea))
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(ideaId) {
    if (!confirm("Delete this idea?")) return;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete idea");
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
    } catch (err) {
      alert(err.message);
    }
  }

  const isAdmin = currentUser?.role === "admin";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
        width: "100%",
      }}
    >
      {/* Left: Idea Board */}
      <div
        style={{
          flex: isMobile ? "none" : "1 1 0",
          minWidth: 0,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          boxShadow: C.shadow,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>
            💡 Idea Board
          </span>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              background: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Idea
          </button>
        </div>

        {/* Add Idea Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddIdea}
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C.border}`,
              background: C.cardBg,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              type="text"
              placeholder="Idea title (required)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "8px 12px",
                fontSize: 14,
                color: C.text,
                outline: "none",
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              style={{
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "8px 12px",
                fontSize: 14,
                color: C.text,
                resize: "vertical",
                outline: "none",
              }}
            />
            <select
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              style={{
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "8px 12px",
                fontSize: 14,
                color: newTheme ? C.text : C.muted,
                outline: "none",
              }}
            >
              <option value="">No theme</option>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={submitting || !newTitle.trim()}
                style={{
                  background: C.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting || !newTitle.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                  setNewDescription("");
                  setNewTheme("");
                }}
                style={{
                  background: "transparent",
                  color: C.muted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Ideas List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {loading && (
            <div
              style={{
                color: C.muted,
                fontSize: 14,
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Loading ideas…
            </div>
          )}
          {error && !loading && (
            <div
              style={{
                color: "#EF4444",
                fontSize: 14,
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && sortedIdeas.length === 0 && (
            <div
              style={{
                color: C.muted,
                fontSize: 14,
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              Be the first to share an idea!
            </div>
          )}
          {!loading &&
            !error &&
            sortedIdeas.map((idea) => {
              const themeInfo = idea.theme ? THEME_MAP[idea.theme] : null;
              const hasUpvoted = idea.upvotes?.includes(currentUser?.id);
              const canDelete = isAdmin || idea.submittedById === currentUser?.id;

              return (
                <div
                  key={idea.id}
                  style={{
                    background: C.cardBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: C.text,
                        lineHeight: 1.4,
                      }}
                    >
                      {idea.title}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(idea.id)}
                        title="Delete idea"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "0 2px",
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  {idea.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: C.muted,
                        margin: "0 0 8px 0",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {idea.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    {themeInfo && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: themeInfo.color,
                          background: `${themeInfo.color}18`,
                          borderRadius: 20,
                          padding: "2px 8px",
                        }}
                      >
                        {themeInfo.emoji} {themeInfo.label}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {idea.submittedBy} · {formatRelativeTime(idea.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => handleUpvote(idea.id)}
                      style={{
                        background: hasUpvoted ? C.accentLight : "transparent",
                        border: `1px solid ${hasUpvoted ? C.accent : C.border}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 12,
                        color: hasUpvoted ? C.accent : C.muted,
                        fontWeight: hasUpvoted ? 700 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      👍 {idea.upvotes?.length || 0}
                    </button>
                    <button
                      onClick={() =>
                        onMakePost?.({
                          title: idea.title,
                          description: idea.description,
                          theme: idea.theme,
                        })
                      }
                      style={{
                        background: C.accent,
                        color: "#fff",
                        border: "none",
                        borderRadius: 20,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Make into Post →
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right: Inspiration */}
      <div
        style={{
          flex: isMobile ? "none" : "0 0 280px",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          boxShadow: C.shadow,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            fontWeight: 700,
            fontSize: 16,
            color: C.text,
          }}
        >
          ✨ Content Inspiration
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: C.muted,
              margin: "0 0 6px 0",
              lineHeight: 1.5,
            }}
          >
            Click any prompt to pre-fill a new post.
          </p>
          {INSPIRATION_PILLS.map((pill) => (
            <button
              key={pill.title}
              onClick={() => onMakePost?.({ title: pill.title, description: pill.caption })}
              style={{
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13,
                color: C.text,
                textAlign: "left",
                cursor: "pointer",
                lineHeight: 1.4,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.hover;
                e.currentTarget.style.borderColor = C.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.cardBg;
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              {pill.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
