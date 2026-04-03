import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// UPDATE employee
export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();

  await query(
    `
    update employees
    set active = $1
    where id = $2
    `,
    [body.active, id]
  );

  return NextResponse.json({ ok: true });
}

// DELETE employee
export async function DELETE(req, { params }) {
  const { id } = params;

  await query(
    `delete from employees where id = $1`,
    [id]
  );

  return NextResponse.json({ ok: true });
}
