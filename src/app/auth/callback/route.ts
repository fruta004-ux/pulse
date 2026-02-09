import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 성공 → 대시보드로
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // 실패 → 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
