"use client";

import { useState } from "react";
import { C } from "./constants";

const SECTIONS = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    color: "#6366F1",
    entries: [
      {
        q: "How do I log in?",
        a: "Go to the app URL and enter your username and password. Your account is created by an admin — reach out if you don't have one yet.",
      },
      {
        q: "What's the sidebar on the left?",
        a: "The sidebar is how you navigate the whole app. It's split into sections: Team, TCF Hub, Content & Marketing, Internal, and a bottom area with Bug Reports and (for admins) Leadership Hub. You can collapse any section by clicking its label, and collapse the entire sidebar using the ◀ button at the very bottom.",
      },
      {
        q: "Can I rearrange the nav items?",
        a: "Yes! Within each section (TCF Hub, Content & Marketing, Internal) you can drag items up or down using the ⠿ handle that appears to the left of each item when the sidebar is open.",
      },
      {
        q: "How do I view a teammate's workspace?",
        a: "In the Team section at the top of the sidebar, click any team member's name to view their workspace — their tasks, notes, and assigned posts.",
      },
    ],
  },
  {
    id: "my-workspace",
    icon: "🏠",
    title: "My Workspace",
    color: "#8B5CF6",
    entries: [
      {
        q: "What is My Workspace?",
        a: "Your Workspace is your personal home base. It shows your Daily Routines, My Tasks, My Notes, Assigned Posts, and more — all in one place. Click your name in the sidebar to go there.",
      },
      {
        q: "How do Daily Routines work?",
        a: "Daily Routines are recurring tasks tied to specific days of the week. The view defaults to today's routines. Use the day tabs (Mon–Sun) or 'All' to see other days. Check off a task and it stays checked for the rest of the week — it resets the following Monday.",
      },
      {
        q: "How do My Tasks work?",
        a: "My Tasks are one-off to-dos just for you. Add a task with the + button, check it off when done, and delete it when you no longer need it. These are personal — only you (and admins) can see them.",
      },
      {
        q: "How do My Notes work?",
        a: "Click 'New Note' to create a sticky-note on your board. Give it a title and content, then click Save. To edit, click the note. To delete, click the ✕ button. If you open a new note and hit cancel without typing anything, it will disappear automatically.",
      },
      {
        q: "What is 'Working On'?",
        a: "The Working On section (visible in Leadership Hub) lets admins post a short bullet list of what they're currently focused on — useful for team visibility without cluttering task lists.",
      },
    ],
  },
  {
    id: "content-marketing",
    icon: "📣",
    title: "Content & Marketing",
    color: "#EC4899",
    entries: [
      {
        q: "What is the Dashboard?",
        a: "The Dashboard gives you a high-level overview of content — upcoming posts, campaign status, goal tracking, and your idea board. It's a quick snapshot of where things stand.",
      },
      {
        q: "How does the Calendar work?",
        a: "The Calendar shows all scheduled posts on a monthly view. Drag a post from one date to another to reschedule it. Click any date to create a new post for that day. Click a post to edit it.",
      },
      {
        q: "What is the Pipeline?",
        a: "The Pipeline is a Kanban-style board with columns: Draft, Review, Scheduled, and Published. Drag posts between columns to update their status, or use the status dropdown inside a post.",
      },
      {
        q: "What is the List view?",
        a: "The List view shows all posts in a table format with filters for status, platform, assignee, and campaign. Great for quickly scanning or bulk-managing content.",
      },
      {
        q: "How do I create a post?",
        a: "Click the purple '+ Create Post' button in the top-right corner from anywhere in the app. Fill in the title, caption, platform, scheduled date, and any other details. You can assign it to a team member and attach it to a campaign.",
      },
      {
        q: "What are Campaigns?",
        a: "Campaigns group related posts together (e.g. 'Summer 2026 Launch'). Create a campaign from the Dashboard or by clicking '+ New Campaign' in the sidebar under Content & Marketing. Then assign posts to it when creating or editing.",
      },
      {
        q: "What is the Brand Repository?",
        a: "The Brand Repository (🎨) is a central library for brand assets, guidelines, colors, fonts, and templates. Use it to keep brand resources organized and accessible to the whole team.",
      },
      {
        q: "What is Quick Links?",
        a: "Quick Links (🔗) is a personal bookmark board. Add links to any tools, docs, or sites you visit frequently so you can reach them in one click.",
      },
      {
        q: "What is Assets?",
        a: "Assets (📦 under Content) is a media library for images, videos, and files used in content. You can assign assets to team members and track their usage.",
      },
      {
        q: "What is Networking?",
        a: "Networking (🤝) is a space to track outreach, partnerships, and relationship-building contacts relevant to TCF's growth and community.",
      },
    ],
  },
  {
    id: "tcf-hub",
    icon: "🏫",
    title: "TCF Hub",
    color: "#10B981",
    entries: [
      {
        q: "What is About TCF?",
        a: "About TCF is a reference page with core info about the coworking space — history, mission, values, and general details useful for new team members.",
      },
      {
        q: "What is Member Journey?",
        a: "Member Journey maps out the lifecycle of a TCF member — from first inquiry through onboarding, active membership, and renewal. Use it to align on how to support members at each stage.",
      },
      {
        q: "What is TCF Membership Info?",
        a: "This section contains the details of each membership tier, pricing, perks, and policies. Keep it updated so the whole team is aligned when talking to current or prospective members.",
      },
      {
        q: "What is Member Resources?",
        a: "Member Resources holds links, documents, and info that team members use when helping TCF members — things like FAQs, parking info, printing instructions, etc.",
      },
      {
        q: "What is Event Planning?",
        a: "Event Planning is where you track upcoming TCF events — add events, assign owners, track status (upcoming / in progress / completed), and store notes. Great for keeping the whole team on the same page about what's happening at TCF.",
      },
      {
        q: "What is Slack?",
        a: "The Slack section helps you plan and assign Slack communications to team members. You can map out who's posting what in which channel.",
      },
      {
        q: "What is Bulletin Board?",
        a: "The Bulletin Board is a shared team noticeboard. Post announcements, reminders, or shoutouts that everyone on the team can see.",
      },
      {
        q: "What is Reports?",
        a: "Reports gives admins and team members a view into key metrics — content activity, task completion, and other data over time.",
      },
    ],
  },
  {
    id: "internal",
    icon: "🔒",
    title: "Internal",
    color: "#F59E0B",
    entries: [
      {
        q: "What is the Internal section?",
        a: "Internal contains HR info (policies, onboarding, benefits), Important Contacts (vendors, contractors, utilities), and the PTO / Vacation form. It's for team-only reference material.",
      },
      {
        q: "What is Daily Ops & Systems?",
        a: "Daily Ops is your guide to running the space each day. It covers mail distribution, tours, parking, communication templates, and mailbox management. All team members can add and edit mailboxes. Reference guides (steps, notes) live here for each procedure.",
      },
      {
        q: "What is Locations?",
        a: "Locations stores info about each TCF physical location — address, hours, notes, and any location-specific details the team needs.",
      },
      {
        q: "What is Conf Rooms?",
        a: "Conf Rooms (🏢) lets you manage conference room availability and details — room names, capacity, amenities, and booking notes.",
      },
      {
        q: "What is TCF Circles?",
        a: "TCF Circles (⭕) is where you manage the member circle groups — interest-based or community groups that TCF organizes for its members.",
      },
      {
        q: "What is Inventory?",
        a: "Inventory (📦) tracks all supplies and purchases. Items are organized into cards: Regular Supply Orders, One-Time Purchases, ROHO Supplies, Events, Sweet Health, and Jelly Bellies. Click '+ Add Item' to add something. Click any item to edit it, change its status, move it to a different card, or duplicate it. You can also drag items between cards.",
      },
      {
        q: "How do I use Inventory?",
        a: "Add items with '+ Add Item' and choose the right card. Set the 'Needed When' (ASAP, Next Amazon Order, etc.) and the status (Not Started, Ordered, Received, etc.). Update the status directly from the list using the dropdown. Click an item to open full details, add notes, a URL, or duplicate it.",
      },
      {
        q: "What is Task Tracker?",
        a: "Task Tracker (✅) is a shared team task board — similar to My Tasks but visible to the whole team. Great for cross-team to-dos, project tasks, and anything that needs team visibility.",
      },
      {
        q: "What is Training?",
        a: "Training (🎓) holds onboarding and reference training materials for team members — guides, videos, or written procedures for how things work at TCF.",
      },
      {
        q: "What is ROHO Social Club?",
        a: "ROHO (🎉) is TCF's social club. This section helps manage ROHO-related programming, members, supplies, and communications.",
      },
    ],
  },
  {
    id: "bug-reports",
    icon: "🐛",
    title: "Bug Reports",
    color: "#EF4444",
    entries: [
      {
        q: "What is Bug Reports?",
        a: "Bug Reports is where you can submit issues or unexpected behavior you notice in the app. Describe what happened, what you expected, and any steps to reproduce it. This helps the team track and fix problems quickly.",
      },
      {
        q: "How do I submit a bug?",
        a: "Click 'Bug Reports' at the bottom of the sidebar. Click '+ New Report', fill in the details, and submit. Admins can see all reports and mark them as resolved.",
      },
    ],
  },
  {
    id: "leadership",
    icon: "🏛",
    title: "Leadership Hub (Admin Only)",
    color: "#6366F1",
    entries: [
      {
        q: "What is Leadership Hub?",
        a: "Leadership Hub is an admin-only area for managing team-level priorities and monitoring overall team health. It includes the Team Health Report, Working On cards for each admin, and other leadership tools.",
      },
      {
        q: "What is Team Health?",
        a: "Team Health shows a score and status (Active / At Risk / Inactive) for each team member based on their recent app activity — tasks added, tasks completed, and notes created. It helps admins spot when someone might need support or a check-in.",
      },
      {
        q: "What is Working On?",
        a: "Each admin has a Working On card where they can post a short bullet list of their current focus areas. This gives leadership a shared view of what everyone is working on at the top level.",
      },
      {
        q: "What are Settings and Team Management?",
        a: "In the sidebar at the bottom, admins have access to ⚙️ Settings (app configuration) and 👥 Team (add, edit, or remove team members and their roles). These are admin-only tools.",
      },
    ],
  },
  {
    id: "tips",
    icon: "💡",
    title: "Tips & Tricks",
    color: "#06B6D4",
    entries: [
      {
        q: "How do I collapse / expand sidebar sections?",
        a: "Click the section label (e.g. 'TCF Hub', 'Internal') to collapse or expand that group. This keeps the sidebar tidy if you only use certain sections.",
      },
      {
        q: "How do I collapse the whole sidebar?",
        a: "Click the ◀ button at the very bottom of the sidebar. The sidebar shrinks to just icons. Click ▶ to expand it again.",
      },
      {
        q: "How do notifications work?",
        a: "Click the 🔔 bell in the top-right corner. You'll see notifications when someone mentions you in a post note. A red dot on the bell means you have unread notifications. Click 'Mark all read' to clear them.",
      },
      {
        q: "How do I update my profile?",
        a: "Click 'Profile' (👤) in the sidebar under your name. You can update your display name, title, bio, and other details.",
      },
      {
        q: "The app looks different on my phone — is that normal?",
        a: "Yes! On mobile, the sidebar is hidden by default. Tap the ☰ hamburger button in the top-left to open the navigation menu. The app is fully functional on phones.",
      },
      {
        q: "Where do I go if I'm not sure where something is?",
        a: "Come back here! Or check the sidebar section labels — TCF Hub for member-facing info, Content & Marketing for posts and campaigns, Internal for day-to-day operations. If something's missing or broken, submit a Bug Report.",
      },
    ],
  },
];

function AccordionEntry({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "12px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "600", color: C.text, lineHeight: "1.4" }}>{q}</span>
        <span style={{
          fontSize: "11px", color: C.muted, flexShrink: 0,
          display: "inline-block",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.15s",
        }}>▶</span>
      </button>
      {open && (
        <div style={{ paddingBottom: "16px", paddingRight: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: C.muted, lineHeight: "1.7" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpGuideView() {
  const [activeSection, setActiveSection] = useState(null);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const filteredSections = SECTIONS.map((sec) => ({
    ...sec,
    entries: sec.entries.filter(
      (e) => !query || e.q.toLowerCase().includes(query) || e.a.toLowerCase().includes(query)
    ),
  })).filter((sec) => !query || sec.entries.length > 0);

  return (
    <div style={{ padding: "28px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: "800", color: C.text }}>📖 Help & How-To Guide</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted, lineHeight: "1.6" }}>
          Everything you need to know about using TCF Studio. Click a section below or search for a topic.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "28px" }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveSection(null); }}
          placeholder="Search help topics…"
          style={{
            width: "100%", padding: "11px 16px",
            border: `1px solid ${C.border}`, borderRadius: "10px",
            background: C.inputBg, color: C.text, fontSize: "14px",
            outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Section cards — only show when not searching */}
      {!query && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "32px" }}>
          {SECTIONS.map((sec) => {
            const r = parseInt(sec.color.slice(1, 3), 16);
            const g = parseInt(sec.color.slice(3, 5), 16);
            const b = parseInt(sec.color.slice(5, 7), 16);
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(isActive ? null : sec.id)}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: `2px solid ${isActive ? sec.color : `rgba(${r},${g},${b},0.25)`}`,
                  background: isActive ? `rgba(${r},${g},${b},0.1)` : C.card,
                  color: isActive ? sec.color : C.text,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  boxShadow: isActive ? `0 0 0 3px rgba(${r},${g},${b},0.15)` : "none",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{sec.icon}</div>
                <div style={{ fontSize: "13px", fontWeight: "700", lineHeight: "1.3" }}>{sec.title}</div>
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>{sec.entries.length} topics</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {filteredSections
        .filter((sec) => !activeSection || sec.id === activeSection || !!query)
        .map((sec) => {
          const r = parseInt(sec.color.slice(1, 3), 16);
          const g = parseInt(sec.color.slice(3, 5), 16);
          const b = parseInt(sec.color.slice(5, 7), 16);
          return (
            <div
              key={sec.id}
              style={{
                marginBottom: "24px",
                background: C.card,
                borderRadius: "16px",
                border: `2px solid rgba(${r},${g},${b},0.25)`,
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "18px 22px",
                background: `rgba(${r},${g},${b},0.07)`,
                borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
              }}>
                <div style={{ width: "4px", height: "32px", borderRadius: "3px", background: sec.color, flexShrink: 0 }} />
                <span style={{ fontSize: "22px" }}>{sec.icon}</span>
                <span style={{ fontSize: "16px", fontWeight: "800", color: C.text }}>{sec.title}</span>
                <span style={{
                  fontSize: "11px", color: sec.color,
                  padding: "2px 10px", borderRadius: "20px",
                  background: `rgba(${r},${g},${b},0.15)`,
                  fontWeight: "700", marginLeft: "auto",
                }}>
                  {sec.entries.length} topic{sec.entries.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Q&A entries */}
              <div style={{ padding: "0 22px" }}>
                {sec.entries.map((entry, i) => (
                  <AccordionEntry key={i} q={entry.q} a={entry.a} />
                ))}
              </div>
            </div>
          );
        })}

      {/* Empty search state */}
      {query && filteredSections.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
          <div style={{ fontSize: "15px", fontWeight: "600", color: C.text, marginBottom: "6px" }}>No results for "{search}"</div>
          <div style={{ fontSize: "13px" }}>Try different keywords, or browse the sections above.</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "32px", padding: "20px 24px", background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, textAlign: "center" }}>
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>💬</div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>Still have questions or found something broken?</div>
        <div style={{ fontSize: "13px", color: C.muted }}>Use the <strong>🐛 Bug Reports</strong> link in the sidebar to let the team know. The more detail you include, the faster it gets fixed!</div>
      </div>
    </div>
  );
}
