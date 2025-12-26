import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function POST(req: Request) {
  try {
    const { id, email, full_name, role, avatar_url } = await req.json()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'missing user id' },
        { status: 400 }
      )
    }

    // 👉 ưu tiên avatar từ frontend, không có thì dùng DiceBear
    const finalAvatar =
      avatar_url && avatar_url.trim() !== ''
        ? avatar_url
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          email,
          full_name,
          role,
          avatar_url: finalAvatar,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) {
      console.error('upsert-profile error:', error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, profile: data })
  } catch (err: any) {
    console.error('upsert-profile exception:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
