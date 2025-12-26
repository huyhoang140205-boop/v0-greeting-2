import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    const output = execSync("find . -type f | sort", { encoding: "utf8" });
    return new NextResponse(`<pre>${output}</pre>`, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
