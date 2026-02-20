import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await query("select 1");
    return NextResponse.json({ status: "ok", db: true });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/health",
      message: error?.message,
    });
    return NextResponse.json(
      { status: "error", db: false, error: "db_unreachable" },
      { status: 500 }
    );
  }
}
