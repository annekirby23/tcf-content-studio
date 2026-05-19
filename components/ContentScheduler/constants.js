export const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.15)", icon: "📸" },
  { id: "tiktok", label: "TikTok", color: "#69C9D0", bg: "rgba(105,201,208,0.15)", icon: "🎵" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", bg: "rgba(10,102,194,0.15)", icon: "💼" },
  { id: "x", label: "X / Twitter", color: "#94A3B8", bg: "rgba(148,163,184,0.15)", icon: "✖" },
  { id: "facebook", label: "Facebook", color: "#1877F2", bg: "rgba(24,119,242,0.15)", icon: "👥" },
  { id: "youtube", label: "YouTube", color: "#FF0000", bg: "rgba(255,0,0,0.15)", icon: "▶" },
  { id: "pinterest", label: "Pinterest", color: "#E60023", bg: "rgba(230,0,35,0.15)", icon: "📌" },
  { id: "email", label: "Newsletter", color: "#6366F1", bg: "rgba(99,102,241,0.15)", icon: "📧" },
  { id: "blog", label: "Blog", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", icon: "✍" },
  { id: "podcast", label: "Podcast", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", icon: "🎙" },
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
  { id: "draft", label: "Draft", color: "#6B7280", bg: "rgba(107,114,128,0.2)" },
  { id: "review", label: "In Review", color: "#F59E0B", bg: "rgba(245,158,11,0.2)" },
  { id: "approved", label: "Approved", color: "#3B82F6", bg: "rgba(59,130,246,0.2)" },
  { id: "scheduled", label: "Scheduled", color: "#8B5CF6", bg: "rgba(139,92,246,0.2)" },
  { id: "published", label: "Published", color: "#10B981", bg: "rgba(16,185,129,0.2)" },
  { id: "paused", label: "Paused", color: "#EF4444", bg: "rgba(239,68,68,0.2)" },
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

export const PRIORITIES = [
  { id: "low", label: "Low", color: "#6B7280" },
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
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  x: 280,
  facebook: 63206,
  youtube: 5000,
  pinterest: 500,
  email: null,
  blog: null,
  podcast: null,
};

export const C = {
  bg: "#070B14",
  surface: "#0F172A",
  card: "#1A2236",
  cardHover: "#1E2A40",
  border: "#1E3A5F",
  borderLight: "#263D5C",
  text: "#F0F6FF",
  muted: "#64748B",
  accent: "#6366F1",
  accentLight: "rgba(99,102,241,0.15)",
  accentBright: "#818CF8",
};
