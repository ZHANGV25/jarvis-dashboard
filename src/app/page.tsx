"use client";

import { useEffect, useState, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function useFetch<T>(url: string, interval = 60000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    refetch();
    const id = setInterval(refetch, interval);
    return () => clearInterval(id);
  }, [refetch, interval]);

  return { data, loading, error, refetch };
}

/* ─── Shared Components ─── */

function Shimmer() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-2/3" />
    </div>
  );
}

function Panel({
  icon,
  title,
  span = 1,
  children,
}: {
  icon: string;
  title: string;
  span?: number;
  children: React.ReactNode;
}) {
  const spanClass =
    span === 2
      ? "md:col-span-2"
      : span === 3
      ? "md:col-span-3"
      : "";
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 p-5 ${spanClass} hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-lg">{icon}</span>
        <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={`text-[13px] font-medium ${
          color || "text-zinc-800 dark:text-zinc-200"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function Badge({
  children,
  color = "zinc",
}: {
  children: React.ReactNode;
  color?: "green" | "amber" | "red" | "zinc" | "blue";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

/* ─── Header ─── */

function Header({ lastRefresh }: { lastRefresh: Date | null }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800">
      <div className="max-w-[1400px] mx-auto px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">J</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Jarvis
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono">
              {lastRefresh
                ? `Updated ${lastRefresh.toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit",
                    timeZone: "America/New_York"
                  })} EST`
                : "Connecting..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDark(!dark)}
          className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <span className="text-sm">{dark ? "☀️" : "🌙"}</span>
        </button>
      </div>
    </header>
  );
}

/* ─── Email Panel ─── */

function EmailPanel() {
  const { data, loading } = useFetch<Any>("/api/email");
  return (
    <Panel icon="📧" title="Email">
      {loading && !data ? (
        <Shimmer />
      ) : (
        <div className="space-y-3">
          {data?.accounts?.map((a: Any) => (
            <div
              key={a.account}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {a.account.split("@")[0]}
                  <span className="text-zinc-400 font-normal">@{a.account.split("@")[1]}</span>
                </p>
                {a.error && (
                  <p className="text-[11px] text-red-400 mt-0.5">{a.error}</p>
                )}
                {!a.error && a.recentThreads?.[0] && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[220px]">
                    {a.recentThreads[0].subject}
                  </p>
                )}
              </div>
              <Badge
                color={
                  a.unreadCount > 10
                    ? "red"
                    : a.unreadCount > 0
                    ? "amber"
                    : "green"
                }
              >
                {a.unreadCount}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ─── Calendar Panel ─── */

function CalendarPanel() {
  const { data, loading } = useFetch<Any>("/api/calendar");
  return (
    <Panel icon="📅" title="Calendar">
      {loading && !data ? (
        <Shimmer />
      ) : data?.events?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
          <span className="text-2xl mb-2">🎉</span>
          <p className="text-[13px]">Nothing scheduled</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
          {data?.events?.map((e: Any, i: number) => {
            const start = e.start?.dateTime || e.start?.date || "";
            const time = start
              ? new Date(start).toLocaleString(undefined, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/New_York"
                })
              : "TBD";
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
              >
                <span className="text-[12px] font-mono text-zinc-400 whitespace-nowrap min-w-[85px]">
                  {time} EST
                </span>
                <span className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate">
                  {e.summary || "Untitled"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ─── Server Health Panel ─── */

function ServerHealthPanel() {
  const { data, loading } = useFetch<Any>("/api/server-health");

  const diskPercent = data?.disk?.usePercent
    ? parseInt(data.disk.usePercent)
    : 0;
  const diskColor =
    diskPercent > 90 ? "text-red-500" : diskPercent > 70 ? "text-amber-500" : undefined;

  return (
    <Panel icon="🖥️" title="Server">
      {loading && !data ? (
        <Shimmer />
      ) : (
        <div className="space-y-0.5">
          <Stat label="Uptime" value={data?.uptime?.replace("up ", "") || "?"} />
          <Stat label="Load" value={data?.loadAvg || "?"} mono />
          <Stat label="CPUs" value={data?.cpuCount || "?"} />
          <Stat
            label="Memory"
            value={`${data?.memory?.used || "?"} / ${data?.memory?.total || "?"}`}
            mono
          />
          <Stat
            label="Disk"
            value={`${data?.disk?.used || "?"} / ${data?.disk?.total || "?"} (${data?.disk?.usePercent || "?"})`}
            mono
            color={diskColor}
          />
          <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  typeof data?.tailscale === "object"
                    ? "bg-emerald-500"
                    : "bg-zinc-300"
                }`}
              />
              <span className="text-[13px] text-zinc-500">
                Tailscale{" "}
                {typeof data?.tailscale === "object" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                ) : (
                  <span className="text-zinc-400">Offline</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ─── Automation Panel ─── */

function CronPanel() {
  const { data, loading } = useFetch<Any>("/api/cron");
  return (
    <Panel icon="⚙️" title="Automations" span={2}>
      {loading && !data ? (
        <Shimmer />
      ) : data?.openclawCrons?.length === 0 &&
        (!data?.userCron || data.userCron === "No crontab") ? (
        <p className="text-[13px] text-zinc-400">No automations configured</p>
      ) : (
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {data?.openclawCrons?.map((c: Any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    c.enabled === false ? "bg-zinc-300" : "bg-emerald-500"
                  }`}
                />
                <span className="text-[12px] font-mono text-zinc-400 flex-shrink-0">
                  {c.schedule || c.cron || "—"}
                </span>
                <span className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate">
                  {c.description || c.name || c.prompt?.slice(0, 50) || c.file}
                </span>
              </div>
              {c.nextRun && (
                <span className="text-[11px] text-zinc-400 font-mono flex-shrink-0 ml-3">
                  {new Date(c.nextRun).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/New_York"
                  })} EST
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ─── Gmail Push Panel ─── */

function GmailWatchPanel() {
  const { data, loading } = useFetch<Any>("/api/gmail-watch");
  return (
    <Panel icon="👁️" title="Gmail Push">
      {loading && !data ? (
        <Shimmer />
      ) : (
        <div className="space-y-2">
          {data?.watches?.map((w: Any) => {
            const exp = w.expiration ? new Date(Number(w.expiration)) : null;
            const isExpired = exp ? exp < new Date() : false;
            const isExpiringSoon =
              exp ? exp.getTime() - Date.now() < 24 * 60 * 60 * 1000 : false;

            return (
              <div
                key={w.account}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
              >
                <span className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate">
                  {w.account.split("@")[0]}
                </span>
                {w.error ? (
                  <Badge color="red">Error</Badge>
                ) : exp ? (
                  <Badge
                    color={
                      isExpired ? "red" : isExpiringSoon ? "amber" : "green"
                    }
                  >
                    {isExpired
                      ? "Expired"
                      : `Expires ${exp.toLocaleDateString([], { month: "short", day: "numeric" })}`}
                  </Badge>
                ) : (
                  <Badge color="zinc">
                    {w.status?.slice(0, 20) || "Unknown"}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ─── Quick Actions Panel ─── */

function QuickActionsPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const runAction = async (action: string) => {
    setRunning(action);
    setStatus(null);
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      setStatus(d.result || d.error || "Done");
    } catch (e) {
      setStatus(String(e));
    }
    setRunning(null);
  };

  const actions = [
    { id: "check-emails", icon: "📬", label: "Check Emails" },
    { id: "refresh-watches", icon: "🔄", label: "Refresh Watches" },
    { id: "spam-cleanup", icon: "🧹", label: "Spam Cleanup" },
  ];

  return (
    <Panel icon="⚡" title="Quick Actions">
      <div className="space-y-2">
        {actions.map((a) => (
          <button
            key={a.id}
            disabled={running !== null}
            onClick={() => runAction(a.id)}
            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {running === a.id ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>{a.icon}</span>
            )}
            {a.label}
          </button>
        ))}
      </div>
      {status && (
        <pre className="mt-3 text-[12px] font-mono bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 overflow-x-auto text-zinc-600 dark:text-zinc-400 max-h-[140px] whitespace-pre-wrap leading-relaxed">
          {status}
        </pre>
      )}
    </Panel>
  );
}

/* ─── Token Usage Panel ─── */

function TokenUsagePanel() {
  const { data, loading } = useFetch<Any>("/api/token-usage");
  const [showCost, setShowCost] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "daily" | "models" | "types">("overview");
  
  if (loading && !data) {
    return (
      <Panel icon="🔢" title="Token Usage" span={2}>
        <Shimmer />
      </Panel>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  
  const TabButton = ({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${
        active 
          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Panel icon="🔢" title="Token Usage" span={2}>
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TabButton id="overview" label="Overview" active={selectedTab === "overview"} onClick={() => setSelectedTab("overview")} />
            <TabButton id="daily" label="Daily" active={selectedTab === "daily"} onClick={() => setSelectedTab("daily")} />
            <TabButton id="models" label="Models" active={selectedTab === "models"} onClick={() => setSelectedTab("models")} />
            <TabButton id="types" label="Types" active={selectedTab === "types"} onClick={() => setSelectedTab("types")} />
          </div>
          <button
            onClick={() => setShowCost(!showCost)}
            className="px-3 py-1.5 text-[12px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {showCost ? "$ Cost" : "# Tokens"}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[280px] overflow-y-auto">
          {selectedTab === "overview" && (
            <div className="space-y-2">
              <Stat 
                label="Total Tokens" 
                value={formatNumber(data?.totals?.totalTokens || 0)} 
                mono 
              />
              <Stat 
                label="Input Tokens" 
                value={formatNumber(data?.totals?.inputTokens || 0)} 
                mono 
              />
              <Stat 
                label="Output Tokens" 
                value={formatNumber(data?.totals?.outputTokens || 0)} 
                mono 
              />
              <Stat 
                label="Total Cost" 
                value={formatCost(data?.totals?.cost || 0)} 
                mono 
                color="text-emerald-600 dark:text-emerald-400"
              />
              <Stat 
                label="Sessions" 
                value={formatNumber(data?.totals?.sessions || 0)} 
              />
            </div>
          )}

          {selectedTab === "daily" && (
            <div className="space-y-1.5">
              {data?.byDate?.slice(0, 10).map((day: Any) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { 
                        month: "short", 
                        day: "numeric",
                        weekday: "short",
                        timeZone: "America/New_York"
                      })} EST
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {day.sessions} sessions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-mono text-zinc-700 dark:text-zinc-300">
                      {showCost ? formatCost(day.cost) : formatNumber(day.totalTokens)}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {showCost ? `${formatNumber(day.totalTokens)} tokens` : formatCost(day.cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "models" && (
            <div className="space-y-1.5">
              {Object.entries(data?.byModel || {})
                .sort(([,a], [,b]) => (b as any).totalTokens - (a as any).totalTokens)
                .map(([model, stats]: [string, any]) => (
                <div
                  key={model}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      {model}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {stats.sessions} sessions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-mono text-zinc-700 dark:text-zinc-300">
                      {showCost ? formatCost(stats.cost) : formatNumber(stats.inputTokens + stats.outputTokens)}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {showCost ? `${formatNumber(stats.inputTokens + stats.outputTokens)} tokens` : formatCost(stats.cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "types" && (
            <div className="space-y-1.5">
              {Object.entries(data?.byType || {})
                .sort(([,a], [,b]) => (b as any).totalTokens - (a as any).totalTokens)
                .map(([type, stats]: [string, any]) => (
                <div
                  key={type}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      {type}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {stats.sessions} sessions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-mono text-zinc-700 dark:text-zinc-300">
                      {showCost ? formatCost(stats.cost) : formatNumber(stats.inputTokens + stats.outputTokens)}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {showCost ? `${formatNumber(stats.inputTokens + stats.outputTokens)} tokens` : formatCost(stats.cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ─── Activity Log Panel ─── */

function ActivityLogPanel() {
  const { data, loading } = useFetch<Any>("/api/activity-log");
  return (
    <Panel icon="📋" title="Activity Log" span={2}>
      {loading && !data ? (
        <Shimmer />
      ) : data?.logs?.length === 0 ? (
        <p className="text-[13px] text-zinc-400">No recent activity</p>
      ) : (
        <div className="space-y-4 max-h-[260px] overflow-y-auto">
          {data?.logs?.map((log: Any) => (
            <div key={log.date}>
              <p className="text-[12px] font-semibold text-zinc-500 mb-1.5">
                {log.date}
              </p>
              <pre className="text-[12px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {log.content.slice(0, 600)}
                {log.content.length > 600 ? "\n..." : ""}
              </pre>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ─── Quorum Panel ─── */

function QuorumPanel() {
  return (
    <Panel icon="🔍" title="Quorum Intel">
      <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
        <span className="text-2xl mb-2">🔮</span>
        <p className="text-[13px]">Market watch coming soon</p>
      </div>
    </Panel>
  );
}

/* ─── Main Dashboard ─── */

export default function Dashboard() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefresh(new Date());
    const id = setInterval(() => setLastRefresh(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen">
      <Header lastRefresh={lastRefresh} />
      <main className="max-w-[1400px] mx-auto px-5 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EmailPanel />
          <CalendarPanel />
          <ServerHealthPanel />
          <TokenUsagePanel />
          <CronPanel />
          <GmailWatchPanel />
          <QuickActionsPanel />
          <QuorumPanel />
          <ActivityLogPanel />
        </div>
      </main>
    </div>
  );
}
