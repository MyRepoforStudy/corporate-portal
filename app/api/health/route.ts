import { NextResponse } from "next/server";

// Liveness probe: process is up and able to respond. No external dependencies.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
