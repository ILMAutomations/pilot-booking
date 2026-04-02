import { NextResponse } from "next/server"

let employees = []

export async function GET(req) {
  return NextResponse.json(employees)
}

export async function POST(req) {
  const body = await req.json()

  const newEmployee = {
    id: Date.now().toString(),
    name: body.name,
    active: true,
  }

  employees.push(newEmployee)

  return NextResponse.json(newEmployee)
}
