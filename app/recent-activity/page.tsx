"use client";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from '../components/DashboardLayout';

type ActionType = "upload" | "delete" | "edit" | "create" | "login" | "logout" | "download" | "update";

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

interface Activity {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  details?: string;
  timestamp: string;
  user: UserInfo;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
}

const ACTION_COLORS: Record<string, { bg: string }> = {
  upload: { bg: "#1a6b7a" },
  create: { bg: "#1a6b7a" },
  delete: { bg: "#e05a4e" },
  edit: { bg: "#2ecc71" },
  update: { bg: "#2ecc71" },
  login: { bg: "#3498db" },
  logout: { bg: "#95a5a6" },
  download: { bg: "#9b59b6" },
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

const LoginIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7"/>
    <line x1="5" y1="19" x2="19" y2="19"/>
  </svg>
);

const CreateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
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

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

function ActionIcon({ action }: { action: string }) {
  const actionLower = action.toLowerCase();
  const color = ACTION_COLORS[actionLower] || { bg: "#1a6b7a" };

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
      {(actionLower === "upload") && <UploadIcon />}
      {(actionLower === "delete") && <DeleteIcon />}
      {(actionLower === "edit" || actionLower === "update") && <EditIcon />}
      {(actionLower === "login" || actionLower === "logout") && <LoginIcon />}
      {(actionLower === "download") && <DownloadIcon />}
      {(actionLower === "create") && <CreateIcon />}
    </div>
  );
}

function UserBadge({ name, action }: { name: string; action: string }) {
  const badgeColor = action.toLowerCase() === "delete" ? "#ffe5e3" : "#e0f5f5";
  const textColor = action.toLowerCase() === "delete" ? "#c0392b" : "#1a6b7a";
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

function formatActivityDescription(activity: Activity): string {
  const action = (activity.action || 'unknown').toLowerCase();
  const resourceType = (activity.resourceType || 'item').replace(/_/g, ' ').toLowerCase();
  const title = activity.resourceTitle || 'item';

  switch (action) {
    case 'login':
      return 'Logged into the system';
    case 'logout':
      return 'Logged out of the system';
    case 'create':
      return `Created a new ${resourceType}: "${title}"`;
    case 'update':
      return `Updated ${resourceType}: "${title}"`;
    case 'delete':
      return `Deleted ${resourceType}: "${title}"`;
    case 'upload':
      return `Uploaded a document: "${title}"`;
    case 'download':
      return `Downloaded a document: "${title}"`;
    default:
      if (resourceType === 'auth' || resourceType === 'item') {
        return `${action.charAt(0).toUpperCase() + action.slice(1)} action performed`;
      }
      return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resourceType}: "${title}"`;
  }
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function groupByDate(activities: Activity[]): Record<string, Activity[]> {
  return activities.reduce((acc, act) => {
    const dateKey = formatDate(act.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(act);
    return acc;
  }, {} as Record<string, Activity[]>);
}

// View Icon
const ViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Parse details JSON safely
function parseDetails(details?: string): Record<string, unknown> {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}

// Format resource type for display
function formatResourceType(resourceType: string): string {
  return resourceType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function RecentActivity() {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [sort, setSort] = useState("Newest First");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<Activity | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Filter by current user if "My Activities" tab is selected
      if (activeTab === "my" && currentUserId) {
        params.append("userId", currentUserId);
      }

      // Add action filter
      if (actionFilter !== "All Actions") {
        params.append("action", actionFilter.toUpperCase());
      }

      // Add search
      if (search) {
        params.append("search", search);
      }

      console.log('[Recent Activity] Fetching from:', `/api/user-logs?${params.toString()}`);
      const res = await fetch(`/api/user-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[Recent Activity] API Response:', data);
        let logs = data.logs || [];

        // Sort
        if (sort === "Oldest First") {
          logs = logs.reverse();
        }

        setActivities(logs);
        setStats(data.stats || { total: 0, today: 0, thisWeek: 0 });
      } else {
        console.error('[Recent Activity] API Error:', res.status, res.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, actionFilter, search, sort, currentUserId]);

  useEffect(() => {
    // Get current user from localStorage
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUserId(user.id);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const grouped = groupByDate(activities);
  const dates = Object.keys(grouped);

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
          { label: "Total Activities", value: stats.total },
          { label: "Today", value: stats.today },
          { label: "This Week", value: stats.thisWeek },
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
            placeholder="Search activities..."
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
            <option>Login</option>
            <option>Create</option>
            <option>Update</option>
            <option>Delete</option>
            <option>Upload</option>
            <option>Download</option>
          </select>
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <ChevronIcon />
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchActivities}
          disabled={loading}
          style={{
            background: "#1a9abf",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <RefreshIcon />
          {loading ? "Loading..." : "Refresh"}
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
        {loading && activities.length === 0 && (
          <div style={{ textAlign: "center", color: "#aaa", padding: "32px 0" }}>Loading activities...</div>
        )}
        {!loading && dates.length === 0 && (
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
                <ActionIcon action={activity.action} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>
                    {formatActivityDescription(activity)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <UserBadge name={activity.user.fullName} action={activity.action} />
                    <span style={{ fontSize: 11, color: "#999" }}>
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(activity)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    background: "#f0f4f7",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    color: "#555",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a6b7a";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "#1a6b7a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f0f4f7";
                    e.currentTarget.style.color = "#555";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <ViewIcon />
                  View
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Activity Details Modal */}
      {viewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
          onClick={() => setViewModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ActionIcon action={viewModal.action} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#333" }}>
                    Activity Details
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                    {formatDate(viewModal.timestamp)} at {formatTime(viewModal.timestamp)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: "#999",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px" }}>
              {/* Action Summary */}
              <div style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
              }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333", lineHeight: 1.5 }}>
                  {formatActivityDescription(viewModal)}
                </p>
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gap: 16 }}>
                {/* Action Type */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>Action Type</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: ACTION_COLORS[viewModal.action.toLowerCase()]?.bg || "#1a6b7a",
                    color: "#fff",
                    textTransform: "capitalize",
                  }}>
                    {viewModal.action.toLowerCase()}
                  </span>
                </div>

                {/* Resource Type */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>Resource Type</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
                    {formatResourceType(viewModal.resourceType)}
                  </span>
                </div>

                {/* Resource Title */}
                {viewModal.resourceTitle && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, color: "#666" }}>Resource Name</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#333", textAlign: "right", maxWidth: "60%" }}>
                      {viewModal.resourceTitle}
                    </span>
                  </div>
                )}

                {/* Resource ID */}
                {viewModal.resourceId && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#666" }}>Resource ID</span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#888", background: "#f0f4f7", padding: "2px 8px", borderRadius: 4 }}>
                      {viewModal.resourceId.slice(0, 8)}...
                    </span>
                  </div>
                )}

                {/* Performed By */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>Performed By</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {viewModal.user.profileImageUrl ? (
                      <img
                        src={viewModal.user.profileImageUrl}
                        alt={viewModal.user.fullName}
                        style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#1a6b7a",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {viewModal.user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
                      {viewModal.user.fullName}
                    </span>
                  </div>
                </div>

                {/* User Role */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>User Role</span>
                  <span style={{ fontSize: 13, color: "#333", textTransform: "capitalize" }}>
                    {viewModal.user.role.toLowerCase()}
                  </span>
                </div>

                {/* User Email */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>Email</span>
                  <span style={{ fontSize: 13, color: "#1a6b7a" }}>
                    {viewModal.user.email}
                  </span>
                </div>

                {/* Additional Details */}
                {viewModal.details && Object.keys(parseDetails(viewModal.details)).length > 0 && (
                  <>
                    <div style={{ borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: -8 }}>
                      Additional Details
                    </div>
                    {Object.entries(parseDetails(viewModal.details)).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: 13, color: "#666", textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                        </span>
                        <span style={{ fontSize: 13, color: "#333", textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setViewModal(null)}
                style={{
                  padding: "10px 24px",
                  background: "#1a6b7a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
