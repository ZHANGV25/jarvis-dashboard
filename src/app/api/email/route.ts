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
    const results = await Promise.all(
      accounts.map(async (account) => {
        try {
          const raw = execSync(
            `gog gmail list "in:inbox is:unread" -a ${account} -j 2>/dev/null`,
            { env: ENV, timeout: 15000 }
          ).toString();
          const data = JSON.parse(raw);
          const threads = (data.threads || []).slice(0, 5);
          return {
            account,
            unreadCount: data.resultSizeEstimate || threads.length,
            recentThreads: threads.map((t: Record<string, unknown>) => ({
              id: t.id,
              snippet: t.snippet || "",
              subject:
                (
                  t.messages as Array<{
                    payload?: {
                      headers?: Array<{ name: string; value: string }>;
                    };
                  }>
                )?.[0]?.payload?.headers?.find(
                  (h: { name: string }) => h.name === "Subject"
                )?.value || (t.snippet as string)?.slice(0, 60) || "No subject",
              from:
                (
                  t.messages as Array<{
                    payload?: {
                      headers?: Array<{ name: string; value: string }>;
                    };
                  }>
                )?.[0]?.payload?.headers?.find(
                  (h: { name: string }) => h.name === "From"
                )?.value || "",
            })),
          };
        } catch {
          return { account, unreadCount: 0, recentThreads: [], error: "Failed to fetch" };
        }
      })
    );
    return NextResponse.json({ accounts: results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
