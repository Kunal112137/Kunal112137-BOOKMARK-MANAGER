import { NextResponse } from 'next/server'

// Server-side endpoint to check whether a given email is already registered
// Requires a Supabase service role key in `process.env.SUPABASE_SERVICE_ROLE_KEY`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body?.email || '').toString().trim()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Supabase URL or service role key' },
        { status: 500 }
      )
    }

    const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(
      email
    )}`

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Supabase admin error', details: text }, { status: res.status })
    }

    const data = await res.json()

    // data is expected to be an array of users; exists = length > 0
    const exists = Array.isArray(data) ? data.length > 0 : false

    return NextResponse.json({ exists })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ error: 'Use POST with JSON { email }' }, { status: 400 })
}
