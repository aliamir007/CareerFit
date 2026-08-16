import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axiosInstance";
import { useAuth } from "../../contexts/AuthContext";
import { SkillChip } from "../candidate/SkillsList";
import { useToast } from "./Toast";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const candidateProfileId = user?.candidateProfileId;

  const loadUnreadCount = useCallback(async () => {
    if (!candidateProfileId) return;

    try {
      const res = await api.get(
        `/api/notifications/${candidateProfileId}/unread-count`,
      );
      setUnreadCount(res.data?.data?.unreadCount ?? 0);
    } catch {
      // The badge is secondary UI, so keep failures quiet and let open() show
      // a clearer error if the user actively asks for the panel.
    }
  }, [candidateProfileId]);

  const loadNotifications = useCallback(async () => {
    if (!candidateProfileId) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/api/notifications/${candidateProfileId}`);
      setNotifications(res.data?.data?.notifications ?? []);
      await loadUnreadCount();
    } catch (err) {
      setError(getErrorMessage(err, "Could not load notifications."));
    } finally {
      setLoading(false);
    }
  }, [candidateProfileId, loadUnreadCount]);

  useEffect(() => {
    if (!candidateProfileId) return;

    loadUnreadCount();
    const timer = window.setInterval(loadUnreadCount, 30000);

    return () => window.clearInterval(timer);
  }, [candidateProfileId, loadUnreadCount]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (user?.role !== "job seeker" || !candidateProfileId) {
    return null;
  }

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) return;

    try {
      await api.patch(`/api/notifications/${notification._id}/read`);
      setNotifications((current) =>
        current.map((entry) =>
          entry._id === notification._id ? { ...entry, isRead: true } : entry,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      toast(getErrorMessage(err, "Could not update that notification."), "error");
    }
  };

  const handleViewJob = (notification, event) => {
    event.stopPropagation();
    setOpen(false);
    navigate(`/candidate/jobs/${notification.jobId}`);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label="Open notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded border border-hairline text-muted transition-colors hover:border-ink hover:text-ink"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 1 1 12 0v5l1.5 2.5H4.5L6 13V8Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-brick px-1.5 py-0.5 text-center text-[11px] font-medium leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-12 z-50 w-[min(28rem,calc(100vw-2rem))] rounded border border-hairline bg-white shadow-lg">
          <header className="border-b border-hairline px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="display text-base">Notifications</h2>
                <p className="mt-0.5 text-xs text-muted">
                  New roles that match at least 50% of your skills.
                </p>
              </div>
              <span className="text-xs text-muted">
                {unreadCount} unread
              </span>
            </div>
          </header>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-sm text-muted">
                Loading notifications…
              </p>
            )}

            {!loading && error && (
              <p className="px-4 py-6 text-sm text-brick">{error}</p>
            )}

            {!loading && !error && notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted">
                No notifications yet.
              </p>
            )}

            {!loading &&
              !error &&
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-b border-hairline px-4 py-4 text-left transition-colors last:border-b-0 ${
                    notification.isRead ? "bg-white" : "bg-teal/5 hover:bg-teal/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label">{notification.companyName}</p>
                      <h3 className="mt-1 text-sm font-medium text-ink">
                        {notification.jobTitle}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="numeric text-sm text-ink">
                        {notification.matchScore}%
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="label">Matched skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(notification.matchedSkills ?? []).length === 0 ? (
                        <span className="text-xs text-muted">
                          No matched skills recorded.
                        </span>
                      ) : (
                        (notification.matchedSkills ?? []).map((skill) => (
                          <SkillChip key={`${notification._id}-${skill}`} tone="matched">
                            {skill}
                          </SkillChip>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="label">Missing skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(notification.missingSkills ?? []).length === 0 ? (
                        <span className="text-xs text-muted">
                          Nothing missing.
                        </span>
                      ) : (
                        (notification.missingSkills ?? []).map((skill) => (
                          <SkillChip key={`${notification._id}-missing-${skill}`} tone="missing">
                            {skill}
                          </SkillChip>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-hairline">
                    <button
                      onClick={(e) => handleViewJob(notification, e)}
                      className="w-full rounded bg-teal px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-teal-deep"
                    >
                      View Job
                    </button>
                  </div>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
