import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Readiness probe: process is up AND its dependencies (database) are reachable.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" });
  } catch (error) {
    console.error("Readiness check failed", error);
    return NextResponse.json({ status: "not ready" }, { status: 503 });
  }
}
