import { NextResponse } from "next/server";
import { execSync } from "child_process";

const accounts = [
  "vhzhang2020@gmail.com",
  "vhzhang@andrew.cmu.edu",
  "isotropicstudios@gmail.com",
];

const ENV = { ...process.env, GOG_KEYRING_PASSWORD: "openclaw-jarvis" };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allEvents: Array<Record<string, unknown>> = [];
    for (const account of accounts) {
      try {
        const raw = execSync(
          `gog calendar list -a ${account} -j --days 2 2>/dev/null`,
          { env: ENV, timeout: 15000 }
        ).toString();
        const data = JSON.parse(raw);
        const events = Array.isArray(data) ? data : data.events || data.items || [];
        for (const e of events) {
          allEvents.push({ ...e, account });
        }
      } catch {
        // skip failed account
      }
    }
    // Sort by start time
    allEvents.sort((a, b) => {
      const aTime = String((a.start as Record<string, string>)?.dateTime || (a.start as Record<string, string>)?.date || "");
      const bTime = String((b.start as Record<string, string>)?.dateTime || (b.start as Record<string, string>)?.date || "");
      return aTime.localeCompare(bTime);
    });
    return NextResponse.json({ events: allEvents });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
