import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get system crontab
    let userCron = "";
    try {
      userCron = execSync("crontab -l 2>/dev/null").toString();
    } catch {
      userCron = "No crontab";
    }

    // Get openclaw cron jobs
    let openclawCrons: Array<Record<string, unknown>> = [];
    const cronDir = join(process.env.HOME || "/home/ubuntu", ".openclaw", "cron");
    if (existsSync(cronDir)) {
      const files = readdirSync(cronDir).filter(f => f.endsWith(".json"));
      for (const f of files) {
        try {
          const data = JSON.parse(readFileSync(join(cronDir, f), "utf-8"));
          openclawCrons.push({ file: f, ...data });
        } catch {
          openclawCrons.push({ file: f, error: "parse error" });
        }
      }
    }

    // Get systemd timers
    let timers = "";
    try {
      timers = execSync("systemctl list-timers --no-pager 2>/dev/null").toString();
    } catch {
      timers = "unavailable";
    }

    return NextResponse.json({
      userCron,
      openclawCrons,
      timers,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
