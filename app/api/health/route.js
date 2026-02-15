import { query } from "@/lib/db";

export async function GET() {
  try {
    await query("SELECT 1");
    return Response.json({ status: "ok", db: true });
  } catch (e) {
    return Response.json(
      { status: "error", db: false, error: String(e.message || e) },
      { status: 500 }
    );
  }
}
