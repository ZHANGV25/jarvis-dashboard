"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
    />
  );
}

function Header({ lastRefresh }: { lastRefresh: Date | null }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">J</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Jarvis Dashboard
            </h1>
            <p className="text-xs text-zinc-500">
              {lastRefresh
                ? `Updated ${lastRefresh.toLocaleTimeString()}`
                : "Loading..."}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDark(!dark)}
          className="text-zinc-500"
        >
          {dark ? "☀️" : "🌙"}
        </Button>
      </div>
    </header>
  );
}

function EmailPanel() {
  const { data, loading } = useFetch<Any>("/api/email");
  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>📧</span> Email Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : (
          <div className="space-y-4">
            {data?.accounts?.map((a: Any) => (
              <div key={a.account} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500 truncate max-w-[180px]">
                    {a.account}
                  </span>
                  <Badge
                    variant={a.unreadCount > 0 ? "default" : "secondary"}
                    className={
                      a.unreadCount > 10
                        ? "bg-red-500 text-white"
                        : a.unreadCount > 0
                        ? "bg-amber-500 text-white"
                        : ""
                    }
                  >
                    {a.unreadCount} unread
                  </Badge>
                </div>
                {a.recentThreads?.slice(0, 2).map((t: Any) => (
                  <div
                    key={t.id}
                    className="text-xs text-zinc-600 dark:text-zinc-400 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700 truncate"
                  >
                    {t.subject || t.snippet?.slice(0, 60)}
                  </div>
                ))}
                {a.error && (
                  <span className="text-xs text-red-500">{a.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarPanel() {
  const { data, loading } = useFetch<Any>("/api/calendar");
  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>📅</span> Calendar (48h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : data?.events?.length === 0 ? (
          <p className="text-xs text-zinc-400">No upcoming events</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {data?.events?.map((e: Any, i: number) => {
                const start = e.start?.dateTime || e.start?.date || "";
                const time = start
                  ? new Date(start).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "TBD";
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-zinc-400 font-mono whitespace-nowrap min-w-[80px]">
                      {time}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {e.summary || "Untitled"}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function ServerHealthPanel() {
  const { data, loading } = useFetch<Any>("/api/server-health");
  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>🖥️</span> Server Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : (
          <div className="space-y-3 text-xs">
            <Row label="Uptime" value={data?.uptime || "?"} />
            <Row label="Load" value={data?.loadAvg || "?"} mono />
            <Row label="CPUs" value={data?.cpuCount || "?"} />
            <Row
              label="Memory"
              value={`${data?.memory?.used || "?"} / ${data?.memory?.total || "?"}`}
              mono
            />
            <Row
              label="Disk"
              value={`${data?.disk?.used || "?"} / ${data?.disk?.total || "?"} (${data?.disk?.usePercent || "?"})`}
              mono
            />
            <div className="pt-1">
              <span className="text-zinc-500">Tailscale: </span>
              {typeof data?.tailscale === "object" ? (
                <span className="text-green-600 font-mono">
                  <StatusDot color="bg-green-500" /> Connected
                </span>
              ) : (
                <span className="text-zinc-400 font-mono">
                  {String(data?.tailscale || "unknown").slice(0, 50)}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span
        className={`text-zinc-800 dark:text-zinc-200 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function CronPanel() {
  const { data, loading } = useFetch<Any>("/api/cron");
  return (
    <Card className="col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>⚙️</span> Automation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : (
          <div className="space-y-3">
            {data?.openclawCrons?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  OpenClaw Cron Jobs
                </p>
                <div className="space-y-1.5">
                  {data.openclawCrons.map((c: Any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot
                          color={
                            c.enabled === false
                              ? "bg-zinc-300"
                              : "bg-green-500"
                          }
                        />
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {c.schedule || c.cron || "?"}
                        </span>
                        <span className="text-zinc-500 truncate max-w-[300px]">
                          {c.description || c.prompt?.slice(0, 60) || c.file}
                        </span>
                      </div>
                      {c.nextRun && (
                        <span className="text-zinc-400 font-mono">
                          next: {new Date(c.nextRun).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data?.userCron && data.userCron !== "No crontab" && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  System Crontab
                </p>
                <pre className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 overflow-x-auto text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {data.userCron}
                </pre>
              </div>
            )}
            {data?.openclawCrons?.length === 0 &&
              (!data?.userCron || data.userCron === "No crontab") && (
                <p className="text-xs text-zinc-400">No cron jobs found</p>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GmailWatchPanel() {
  const { data, loading } = useFetch<Any>("/api/gmail-watch");
  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>👁️</span> Gmail Push Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : (
          <div className="space-y-2">
            {data?.watches?.map((w: Any) => {
              const exp = w.expiration
                ? new Date(Number(w.expiration))
                : null;
              const isExpired = exp ? exp < new Date() : false;
              const isExpiringSoon =
                exp
                  ? exp.getTime() - Date.now() < 24 * 60 * 60 * 1000
                  : false;
              return (
                <div
                  key={w.account}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-zinc-500 truncate max-w-[160px]">
                    {w.account}
                  </span>
                  {w.error ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Error
                    </Badge>
                  ) : exp ? (
                    <Badge
                      className={`text-[10px] ${
                        isExpired
                          ? "bg-red-500 text-white"
                          : isExpiringSoon
                          ? "bg-amber-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {isExpired
                        ? "Expired"
                        : exp.toLocaleDateString()}
                    </Badge>
                  ) : (
                    <span className="text-zinc-400">
                      {w.status?.slice(0, 30) || "Unknown"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runAction = async (action: string) => {
    setRunning(true);
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
    setRunning(false);
  };

  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs"
            disabled={running}
            onClick={() => runAction("check-emails")}
          >
            📬 Check Emails
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs"
            disabled={running}
            onClick={() => runAction("refresh-watches")}
          >
            🔄 Refresh Gmail Watches
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs"
            disabled={running}
            onClick={() => runAction("spam-cleanup")}
          >
            🧹 Run Spam Cleanup
          </Button>
        </div>
        {status && (
          <pre className="mt-3 text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2 overflow-x-auto text-zinc-600 dark:text-zinc-400 max-h-[120px] whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLogPanel() {
  const { data, loading } = useFetch<Any>("/api/activity-log");
  return (
    <Card className="col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>📋</span> Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton />
        ) : data?.logs?.length === 0 ? (
          <p className="text-xs text-zinc-400">No recent logs</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {data?.logs?.map((log: Any) => (
                <div key={log.date}>
                  <p className="text-xs font-medium text-zinc-500 mb-1">
                    {log.date}
                  </p>
                  <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                    {log.content.slice(0, 800)}
                    {log.content.length > 800 ? "..." : ""}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function QuorumPanel() {
  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>🔍</span> Quorum Intel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-400">
          No competitor/market watch data yet. Configure Quorum intel automation to populate this panel.
        </p>
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
    </div>
  );
}

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
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EmailPanel />
          <CalendarPanel />
          <ServerHealthPanel />
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
