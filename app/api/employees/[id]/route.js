import { NextResponse } from "next/server"

let employees = []

export async function PATCH(req, { params }) {
  const { id } = params
  const body = await req.json()

  employees = employees.map(e =>
    e.id === id ? { ...e, ...body } : e
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req, { params }) {
  const { id } = params

  employees = employees.filter(e => e.id !== id)

  return NextResponse.json({ ok: true })
}
