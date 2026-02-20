import { NextResponse } from "next/server";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const memoryDir = join(process.env.HOME || "/home/ubuntu", ".openclaw", "workspace", "memory");
    const logs: Array<{ date: string; content: string }> = [];

    if (existsSync(memoryDir)) {
      const files = readdirSync(memoryDir)
        .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse()
        .slice(0, 3);

      for (const f of files) {
        const content = readFileSync(join(memoryDir, f), "utf-8");
        logs.push({ date: f.replace(".md", ""), content: content.slice(0, 3000) });
      }
    }

    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
