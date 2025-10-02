import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client (service role) bypasses RLS for atomic operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : ''

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing bearer token' }, { status: 401 })
    }

    // Identify user from token
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    const userId = userRes.user.id

    // Check admin from profiles
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (profErr) {
      return NextResponse.json({ success: false, error: `Profiles read error: ${profErr.message}` }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: admin only' }, { status: 403 })
    }

    // Parse body
    const body = await request.json().catch(() => null) as { mediaId?: string; mediaUrl?: string }
    const mediaId = body?.mediaId?.trim()
    const mediaUrl = body?.mediaUrl?.trim()

    if (!mediaId || !mediaUrl) {
      return NextResponse.json({ success: false, error: 'mediaId and mediaUrl are required' }, { status: 400 })
    }

    // Delete DB row first
    const { error: dbErr } = await supabaseAdmin
      .from('question_media')
      .delete()
      .eq('id', mediaId)

    if (dbErr) {
      return NextResponse.json({ success: false, error: `DB delete error: ${dbErr.message}` }, { status: 500 })
    }

    // Derive storage path from public URL
    try {
      const url = new URL(mediaUrl)
      const parts = url.pathname.split('/')
      const bucketName = 'questions-media'
      const publicIdx = parts.indexOf('public')
      const bucketIdx = publicIdx >= 0 ? publicIdx + 1 : -1

      if (bucketIdx >= 0 && parts[bucketIdx] === bucketName) {
        const filePath = parts.slice(bucketIdx + 1).join('/')
        if (filePath) {
          await supabaseAdmin.storage.from(bucketName).remove([filePath])
        }
      }
    } catch (e) {
      // Non-blocking: log but do not fail the whole request
      console.error('Storage delete warning:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ delete-media API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    )
  }
}
