export const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.12)", icon: "📸" },
  { id: "tiktok", label: "TikTok", color: "#00BCD4", bg: "rgba(0,188,212,0.12)", icon: "🎵" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", bg: "rgba(10,102,194,0.12)", icon: "💼" },
  { id: "x", label: "X / Twitter", color: "#475569", bg: "rgba(71,85,105,0.12)", icon: "✖" },
  { id: "facebook", label: "Facebook", color: "#1877F2", bg: "rgba(24,119,242,0.12)", icon: "👥" },
  { id: "youtube", label: "YouTube", color: "#FF0000", bg: "rgba(255,0,0,0.12)", icon: "▶" },
  { id: "pinterest", label: "Pinterest", color: "#E60023", bg: "rgba(230,0,35,0.12)", icon: "📌" },
  { id: "email", label: "Newsletter", color: "#6366F1", bg: "rgba(99,102,241,0.12)", icon: "📧" },
  { id: "blog", label: "Blog", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: "✍" },
  { id: "podcast", label: "Podcast", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "🎙" },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export const CONTENT_TYPES = [
  { id: "post", label: "Static Post" },
  { id: "reel", label: "Reel / Short Video" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Long-Form Video" },
  { id: "live", label: "Live Stream" },
  { id: "article", label: "Article / Blog" },
  { id: "newsletter", label: "Newsletter" },
  { id: "podcast", label: "Podcast Episode" },
  { id: "thread", label: "Thread" },
];

export const STATUSES = [
  { id: "draft", label: "Draft", color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  { id: "review", label: "In Review", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  { id: "approved", label: "Approved", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  { id: "scheduled", label: "Scheduled", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  { id: "published", label: "Published", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  { id: "paused", label: "Paused", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

export const PILLARS = [
  { id: "brand", label: "Brand Awareness" },
  { id: "lead-gen", label: "Lead Generation" },
  { id: "community", label: "Community Building" },
  { id: "product", label: "Product / Service" },
  { id: "educational", label: "Educational" },
  { id: "entertainment", label: "Entertainment" },
  { id: "ugc", label: "UGC / Social Proof" },
  { id: "thought-leadership", label: "Thought Leadership" },
];

export const THEMES = [
  { id: "membership", label: "Membership Related", color: "#6366F1", emoji: "🏛" },
  { id: "events", label: "Event Related", color: "#F59E0B", emoji: "📅" },
  { id: "member-highlight", label: "Member Highlight", color: "#10B981", emoji: "⭐" },
  { id: "behind-the-scenes", label: "Behind the Scenes", color: "#8B5CF6", emoji: "🎬" },
  { id: "tips-education", label: "Tips & Education", color: "#3B82F6", emoji: "💡" },
  { id: "launch", label: "Launch / Announcement", color: "#EF4444", emoji: "🚀" },
  { id: "seasonal", label: "Seasonal / Holiday", color: "#EC4899", emoji: "🎉" },
  { id: "community-spotlight", label: "Community Spotlight", color: "#06B6D4", emoji: "🌟" },
  { id: "general", label: "General", color: "#64748B", emoji: "📌" },
];

export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.id, t]));

export const AUDIENCES = [
  { id: "external", label: "External", description: "Public-facing content", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { id: "internal", label: "Internal", description: "Members only", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
];

export const AUDIENCE_MAP = Object.fromEntries(AUDIENCES.map((a) => [a.id, a]));

export const PRIORITIES = [
  { id: "low", label: "Low", color: "#94A3B8" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "high", label: "High", color: "#EF4444" },
  { id: "urgent", label: "Urgent", color: "#DC2626" },
];

export const BEST_TIMES = {
  instagram: ["08:00", "11:00", "14:00", "17:00", "19:00"],
  tiktok: ["07:00", "13:00", "19:00", "22:00"],
  linkedin: ["07:30", "10:00", "12:00", "17:00"],
  x: ["08:00", "12:00", "17:00", "20:00"],
  facebook: ["09:00", "13:00", "16:00", "19:00"],
  youtube: ["14:00", "17:00", "20:00"],
  pinterest: ["14:00", "16:00", "21:00"],
  email: ["08:00", "10:00", "14:00"],
  blog: ["09:00", "12:00"],
  podcast: ["06:00", "12:00"],
};

export const CHAR_LIMITS = {
  instagram: 2200, tiktok: 2200, linkedin: 3000, x: 280,
  facebook: 63206, youtube: 5000, pinterest: 500,
  email: null, blog: null, podcast: null,
};

// Light theme color palette
export const C = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  cardHover: "#F8FAFC",
  border: "#E2E8F0",
  borderLight: "#CBD5E1",
  text: "#1E293B",
  textSecondary: "#334155",
  muted: "#64748B",
  accent: "#6366F1",
  accentLight: "rgba(99,102,241,0.1)",
  accentBright: "#4F46E5",
  cardBg: "#F8FAFC",
  hover: "rgba(0,0,0,0.04)",
  inputBg: "#F8FAFC",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
};
