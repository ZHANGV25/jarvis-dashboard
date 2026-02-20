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
    const results = accounts.map((account) => {
      try {
        const raw = execSync(
          `gog gmail watch status -a ${account} -j 2>/dev/null`,
          { env: ENV, timeout: 15000 }
        ).toString();
        const data = JSON.parse(raw);
        return { account, ...data };
      } catch {
        // Try plain output
        try {
          const plain = execSync(
            `gog gmail watch status -a ${account} 2>/dev/null`,
            { env: ENV, timeout: 15000 }
          ).toString().trim();
          return { account, status: plain };
        } catch {
          return { account, error: "Failed to fetch" };
        }
      }
    });
    return NextResponse.json({ watches: results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
