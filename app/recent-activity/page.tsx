"use client";
import { useState } from "react";
import DashboardLayout from '../components/DashboardLayout';

type ActionType = "upload" | "delete" | "edit" | "view";

interface Activity {
  id: number;
  type: ActionType;
  description: string;
  user: string;
  date: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: "upload",
    description:
      'Uploaded a Letter of Intent for Project Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    user: "Jane Doe",
    date: "February 10, 2026",
  },
  {
    id: 2,
    type: "upload",
    description:
      'Uploaded a Letter of Intent for Project Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    user: "Jane Doe",
    date: "February 10, 2026",
  },
  {
    id: 3,
    type: "upload",
    description:
      'Uploaded a Letter of Intent for Project Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    user: "Jane Doe",
    date: "February 10, 2026",
  },
  {
    id: 4,
    type: "delete",
    description:
      'Deleted a Letter of Intent for Project Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    user: "Jane Doe",
    date: "February 10, 2026",
  },
  {
    id: 5,
    type: "upload",
    description:
      'Uploaded a Letter of Intent for Project Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    user: "Jane Doe",
    date: "February 9, 2026",
  },
  {
    id: 6,
    type: "edit",
    description:
      'Edited a Project Code "Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology"',
    user: "Jane Doe",
    date: "February 9, 2026",
  },
];

const ACTION_COLORS: Record<ActionType, { bg: string; icon: string }> = {
  upload: { bg: "#1a6b7a", icon: "↑" },
  delete: { bg: "#e05a4e", icon: "🗑" },
  edit: { bg: "#2ecc71", icon: "✎" },
  view: { bg: "#3498db", icon: "👁" },
};

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
    <line x1="5" y1="19" x2="19" y2="19"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

function ActionIcon({ type }: { type: ActionType }) {
  const color = ACTION_COLORS[type];
  return (
    <div style={{
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: color.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      {type === "upload" && <UploadIcon />}
      {type === "delete" && <DeleteIcon />}
      {type === "edit" && <EditIcon />}
    </div>
  );
}

function UserBadge({ name, type }: { name: string; type: ActionType }) {
  const badgeColor = type === "delete" ? "#ffe5e3" : "#e0f5f5";
  const textColor = type === "delete" ? "#c0392b" : "#1a6b7a";
  return (
    <span style={{
      display: "inline-block",
      background: badgeColor,
      color: textColor,
      fontSize: 11,
      fontWeight: 500,
      borderRadius: 999,
      padding: "2px 10px",
      marginTop: 4,
    }}>
      {name}
    </span>
  );
}

function groupByDate(activities: Activity[]): Record<string, Activity[]> {
  return activities.reduce((acc, act) => {
    if (!acc[act.date]) acc[act.date] = [];
    acc[act.date].push(act);
    return acc;
  }, {} as Record<string, Activity[]>);
}

export default function RecentActivity() {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [sort, setSort] = useState("Newest First");

  const filtered = ACTIVITIES.filter((a) => {
    const matchSearch = a.description.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All Actions" || a.type === actionFilter.toLowerCase();
    return matchSearch && matchAction;
  });

  const grouped = groupByDate(filtered);
  const dates = Object.keys(grouped);

  const totalActivities = 298;
  const todayCount = 59;
  const thisWeekCount = 112;

  return (
    <DashboardLayout activePath="/recent-activity">
    <div style={{
      fontFamily: "'Clear Sans', 'Segoe UI', system-ui, sans-serif",
      background: "#f4f6f8",
      minHeight: "100vh",
      padding: "32px",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a6b7a" }}>Recent Activity</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>User Activity History</p>
      </div>

      {/* View Toggle */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        gap: 8,
      }}>
        <span style={{ fontSize: 13, color: "#555", alignSelf: "center", marginRight: 8 }}>View:</span>
        {(["all", "my"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              border: activeTab === tab ? "none" : "1px solid #e2e8f0",
              background: activeTab === tab ? "#1a6b7a" : "#fff",
              color: activeTab === tab ? "#fff" : "#555",
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab === "all" ? "All Users' Activity" : "My Activities"}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Activities", value: totalActivities },
          { label: "Today", value: todayCount },
          { label: "This Week", value: thisWeekCount },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "20px 24px",
          }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1a6b7a" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
      }}>
        {/* Search */}
        <div style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "0 12px",
        }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search here"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              padding: "10px 8px",
              fontSize: 13,
              color: "#333",
              width: "100%",
              background: "transparent",
            }}
          />
        </div>

        {/* Action Filter */}
        <div style={{
          position: "relative",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              appearance: "none",
              border: "none",
              outline: "none",
              padding: "10px 36px 10px 14px",
              fontSize: 13,
              color: "#555",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <option>All Actions</option>
            <option>Upload</option>
            <option>Delete</option>
            <option>Edit</option>
          </select>
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <ChevronIcon />
          </div>
        </div>

        {/* Refresh */}
        <button style={{
          background: "#1a9abf",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          Refresh
        </button>

        {/* Sort */}
        <div style={{
          position: "relative",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              appearance: "none",
              border: "none",
              outline: "none",
              padding: "10px 36px 10px 14px",
              fontSize: 13,
              color: "#555",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <ChevronIcon />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "16px 20px",
      }}>
        {dates.length === 0 && (
          <div style={{ textAlign: "center", color: "#aaa", padding: "32px 0" }}>No activities found.</div>
        )}
        {dates.map((date, di) => (
          <div key={date}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#333",
              padding: "12px 0 8px",
              marginTop: di > 0 ? 8 : 0,
            }}>
              {date}
            </div>
            {grouped[date].map((activity, i) => (
              <div
                key={activity.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : "1px solid #f0f4f7",
                }}
              >
                <ActionIcon type={activity.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{activity.description}</div>
                  <UserBadge name={activity.user} type={activity.type} />
                </div>
                <button style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  color: "#555",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  <EyeIcon /> View
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}