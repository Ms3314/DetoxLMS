import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { formatDuration } from "../focus/format";
import type { SessionRecord } from "../focus/log";
import { fetchRecords, pushRecords, unsyncedRecords } from "../profile/cloud";
import { profileStats } from "../profile/stats";

const hours = (ms: number) => `${(ms / 3_600_000).toFixed(1)}h`;

/** The signed-in user's hours, rank, streak and the last seven days. */
export default function ProfileView() {
  const { loading, user, username, signOut } = useAuth();
  const userId = user?.id ?? null;
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [importing, setImporting] = useState(false);
  const [now] = useState(() => Date.now());

  // Bumped after an import so the effect below fetches again.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchRecords(userId)
      .then((rows) => {
        if (cancelled) return;
        setRecords(rows);
        setPending(unsyncedRecords(userId).length);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your sessions.");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  if (loading) return <div className="view"><p className="empty-state">Loading…</p></div>;
  if (!user || !userId) return <Navigate to="/login" replace />;

  const importLocal = async () => {
    setImporting(true);
    try {
      await pushRecords(userId, unsyncedRecords(userId));
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't import your sessions.");
    } finally {
      setImporting(false);
    }
  };

  const stats = records ? profileStats(records, now) : null;
  const { current, next } = stats?.rank ?? {};
  const totalHours = (stats?.totalMs ?? 0) / 3_600_000;
  const progress = next && current ? (totalHours - current.hours) / (next.hours - current.hours) : 1;
  const maxDay = Math.max(1, ...(stats?.days.map((d) => d.ms) ?? [0]));

  return (
    <div className="view profile-view">
      <div className="view-head">
        <div>
          <p className="kicker">Profile</p>
          <h2 className="view-title">{username ?? user.email}</h2>
          {username && <p className="auth-hint">{user.email}</p>}
        </div>
        <button type="button" className="btn-ghost btn-small" onClick={() => void signOut()}>
          Log out
        </button>
      </div>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      {pending > 0 && (
        <div className="focus-card" role="status">
          <p>
            {pending} session{pending === 1 ? "" : "s"} on this device {pending === 1 ? "isn't" : "aren't"} in
            your account yet.
          </p>
          <button type="button" className="btn-accent btn-small" onClick={() => void importLocal()} disabled={importing}>
            {importing ? "Importing…" : "Import them"}
          </button>
        </div>
      )}

      {!stats ? (
        !error && <p className="empty-state">Loading your hours…</p>
      ) : (
        <>
          <div className="focus-stats">
            <div className="focus-stat">
              <span className="focus-stat-value">{hours(stats.totalMs)}</span>
              <span className="focus-stat-label">Total focus</span>
            </div>
            <div className="focus-stat">
              <span className="focus-stat-value">{formatDuration(stats.todayMs)}</span>
              <span className="focus-stat-label">Today</span>
            </div>
            <div className="focus-stat">
              <span className="focus-stat-value">{hours(stats.last7Ms)}</span>
              <span className="focus-stat-label">Last 7 days</span>
            </div>
            <div className="focus-stat">
              <span className="focus-stat-value">{hours(stats.last30Ms)}</span>
              <span className="focus-stat-label">Last 30 days</span>
            </div>
            <div className="focus-stat">
              <span className="focus-stat-value">
                {stats.streak} day{stats.streak === 1 ? "" : "s"}
              </span>
              <span className="focus-stat-label">Streak</span>
            </div>
            <div className="focus-stat">
              <span className="focus-stat-value">{stats.sessions}</span>
              <span className="focus-stat-label">Sessions</span>
            </div>
          </div>

          <section className="profile-rank" aria-label="Rank">
            <div className="progress-label">
              <span>{current?.name}</span>
              <span className="progress-pct">{next ? `Next: ${next.name} at ${next.hours}h` : "Top rank"}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }} />
            </div>
          </section>

          <section aria-label="Last 7 days">
            <p className="kicker">Last 7 days</p>
            <ul className="profile-bars">
              {stats.days.map((d) => (
                <li key={d.day} className="profile-bar">
                  <span className="profile-bar-value">{d.ms > 0 ? formatDuration(d.ms) : ""}</span>
                  <span className="profile-bar-track">
                    <span className="profile-bar-fill" style={{ height: `${(d.ms / maxDay) * 100}%` }} />
                  </span>
                  <span className="profile-bar-day">
                    {new Date(d.day).toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
