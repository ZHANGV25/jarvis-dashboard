import { NextResponse } from "next/server";
import { execSync } from "child_process";

const ENV = { ...process.env, GOG_KEYRING_PASSWORD: "openclaw-jarvis" };

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    let result = "";

    switch (action) {
      case "check-emails":
        result = execSync(
          `gog gmail list "in:inbox is:unread" -a vhzhang2020@gmail.com -p 2>/dev/null | head -20`,
          { env: ENV, timeout: 20000 }
        ).toString();
        break;
      case "refresh-watches":
        for (const acct of [
          "vhzhang2020@gmail.com",
          "vhzhang@andrew.cmu.edu",
          "isotropicstudios@gmail.com",
        ]) {
          try {
            execSync(`gog gmail watch start -a ${acct} 2>/dev/null`, {
              env: ENV,
              timeout: 20000,
            });
          } catch { /* continue */ }
        }
        result = "Watch refresh triggered for all accounts";
        break;
      case "spam-cleanup":
        result = "Spam cleanup not yet automated — use openclaw cron";
        break;
      default:
        result = "Unknown action";
    }

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
