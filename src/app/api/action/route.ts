import { NextResponse } from "next/server";
import { execSync } from "child_process";

const accounts = [
  "vhzhang2020@gmail.com",
  "vhzhang@andrew.cmu.edu",
  "isotropicstudios@gmail.com",
];

const ENV = { ...process.env, GOG_KEYRING_PASSWORD: "openclaw-jarvis" };

function run(cmd: string, timeout = 20000): string {
  return execSync(cmd, { env: ENV, timeout }).toString().trim();
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    let result = "";

    switch (action) {
      case "check-emails": {
        const lines: string[] = [];
        for (const acct of accounts) {
          try {
            const raw = run(`gog gmail list "in:inbox is:unread" -a ${acct} -j 2>/dev/null`);
            const data = JSON.parse(raw);
            const count = data.resultSizeEstimate || (data.threads || []).length || 0;
            lines.push(`${acct}: ${count} unread`);
          } catch {
            lines.push(`${acct}: failed to check`);
          }
        }
        result = lines.join("\n");
        break;
      }

      case "refresh-watches": {
        const lines: string[] = [];
        for (const acct of accounts) {
          try {
            run(`gog gmail watch start -a ${acct} 2>/dev/null`);
            lines.push(`✅ ${acct}`);
          } catch {
            lines.push(`❌ ${acct}`);
          }
        }
        result = lines.join("\n");
        break;
      }

      case "spam-cleanup": {
        const lines: string[] = [];
        const spamAccounts = ["vhzhang2020@gmail.com", "isotropicstudios@gmail.com"];

        for (const acct of spamAccounts) {
          try {
            // Mark promotions as read
            const promoRaw = run(
              `gog gmail list "category:promotions is:unread" -a ${acct} -j 2>/dev/null`
            );
            const promoData = JSON.parse(promoRaw);
            const promoThreads = promoData.threads || [];
            let markedRead = 0;
            for (const t of promoThreads.slice(0, 50)) {
              try {
                run(`gog gmail modify ${t.id} -a ${acct} --remove-labels UNREAD 2>/dev/null`);
                markedRead++;
              } catch { /* skip */ }
            }

            // Archive social/updates
            const socialRaw = run(
              `gog gmail list "(category:social OR category:updates) is:unread" -a ${acct} -j 2>/dev/null`
            );
            const socialData = JSON.parse(socialRaw);
            const socialThreads = socialData.threads || [];
            let archived = 0;
            for (const t of socialThreads.slice(0, 50)) {
              try {
                run(`gog gmail modify ${t.id} -a ${acct} --remove-labels UNREAD INBOX 2>/dev/null`);
                archived++;
              } catch { /* skip */ }
            }

            lines.push(`${acct}: ${markedRead} promos read, ${archived} social/updates archived`);
          } catch (e) {
            lines.push(`${acct}: error — ${String(e).slice(0, 80)}`);
          }
        }

        // Handle Anthropic receipts for all accounts
        for (const acct of accounts) {
          try {
            const anthRaw = run(
              `gog gmail list "from:anthropic.com subject:receipt" -a ${acct} -j 2>/dev/null`
            );
            const anthData = JSON.parse(anthRaw);
            const anthThreads = anthData.threads || [];
            let filed = 0;
            for (const t of anthThreads.slice(0, 20)) {
              try {
                run(`gog gmail modify ${t.id} -a ${acct} --remove-labels INBOX 2>/dev/null`);
                filed++;
              } catch { /* skip */ }
            }
            if (filed > 0) lines.push(`${acct}: ${filed} Anthropic receipts archived`);
          } catch { /* skip */ }
        }

        result = lines.length > 0 ? lines.join("\n") : "No spam found to clean up ✨";
        break;
      }

      default:
        result = "Unknown action";
    }

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
