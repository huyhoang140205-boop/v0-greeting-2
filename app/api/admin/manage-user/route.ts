// /app/api/admin/manage-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ===== Tạo user =====
    if (action === 'create') {
      const { email, full_name, role, avatar_url } = body
      if (!email || !full_name || !role)
        return NextResponse.json({ ok: false, error: 'Thiếu thông tin user' }, { status: 400 })

      // Tạo password tạm thời
      const tempPassword = Math.random().toString(36).slice(-10)

      // Tạo user Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_redirect_to: 'https://your-app.vercel.app/login',
        user_metadata: { full_name, role },
      })

      if (authError) return NextResponse.json({ ok: false, error: authError.message }, { status: 500 })

      // Chọn avatar
      const finalAvatar =
        avatar_url && avatar_url.trim() !== ''
          ? avatar_url
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`

      // Upsert vào profiles giống signup
      const { data, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name,
          role,
          avatar_url: finalAvatar,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        // Xóa Auth nếu insert thất bại
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 })
      }

      // Gửi email mật khẩu tạm thời
      try {
        await sgMail.send({
          to: email,
          from: 'no-reply@your-app.com',
          subject: 'Thông tin đăng nhập tài khoản',
          html: `
            <p>Xin chào ${full_name},</p>
            <p>Tài khoản của bạn đã được tạo thành công.</p>
            <p>Email: <strong>${email}</strong></p>
            <p>Mật khẩu tạm thời: <strong>${tempPassword}</strong></p>
            <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập: <a href="https://your-app.vercel.app/login">Đăng nhập</a></p>
          `,
        })
      } catch (mailErr: any) {
        console.error('Gửi email thất bại:', mailErr.message)
      }

      return NextResponse.json({ ok: true, profile: data })
    }

    // ===== Xóa user =====
    if (action === 'delete') {
      const { id } = body
      if (!id) return NextResponse.json({ ok: false, error: 'Thiếu id user' }, { status: 400 })

      // Chỉ xóa trong profiles + Auth, không xóa dữ liệu khác
      await supabaseAdmin.from('profiles').delete().eq('id', id)
      await supabaseAdmin.auth.admin.deleteUser(id)

      return NextResponse.json({ ok: true })
    }

    // ===== Update role =====
    if (action === 'updateRole') {
      const { id, role } = body
      if (!id || !role) return NextResponse.json({ ok: false, error: 'Thiếu thông tin' }, { status: 400 })

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert({ id, role, updated_at: new Date().toISOString() })
        .select()
        .single()

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true, profile: data })
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('manage-user POST exception:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, users: data ?? [] })
  } catch (err: any) {
    console.error('manage-user GET exception:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
