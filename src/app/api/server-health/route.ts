import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 10000 }).toString().trim();
  } catch {
    return "unavailable";
  }
}

export async function GET() {
  try {
    const uptime = run("uptime -p");
    const loadAvg = run("cat /proc/loadavg").split(" ").slice(0, 3).join(", ");
    
    const memRaw = run("free -h");
    const memLines = memRaw.split("\n");
    const memParts = memLines[1]?.split(/\s+/) || [];
    const memory = {
      total: memParts[1] || "?",
      used: memParts[2] || "?",
      available: memParts[6] || "?",
    };

    const diskRaw = run("df -h /");
    const diskParts = diskRaw.split("\n")[1]?.split(/\s+/) || [];
    const disk = {
      total: diskParts[1] || "?",
      used: diskParts[2] || "?",
      available: diskParts[3] || "?",
      usePercent: diskParts[4] || "?",
    };

    let tailscale = "unavailable";
    try {
      tailscale = run("tailscale status --json 2>/dev/null");
      tailscale = JSON.parse(tailscale);
    } catch {
      tailscale = run("tailscale status 2>/dev/null || echo 'not running'");
    }

    const cpuCount = run("nproc");

    return NextResponse.json({
      uptime,
      loadAvg,
      cpuCount,
      memory,
      disk,
      tailscale,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
