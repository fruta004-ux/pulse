import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddleware } from '@/lib/supabase-middleware';

// 허용된 이메일 목록 (환경변수에서 로드, 쉼표 구분)
function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// 인증 체크가 필요 없는 경로
const PUBLIC_PATHS = ['/login', '/auth/callback'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, api, _next 등은 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = await createSupabaseMiddleware(request);

  // 세션 갱신 (쿠키 refresh)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 퍼블릭 경로에 이미 로그인한 사용자가 접근하면 대시보드로 리다이렉트
  if (isPublicPath(pathname)) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 비로그인 → 로그인 페이지로
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 이메일 화이트리스트 체크
  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0) {
    const userEmail = (user.email ?? '').toLowerCase();
    if (!allowedEmails.includes(userEmail)) {
      // 허용되지 않은 이메일 → 로그아웃 후 로그인 페이지로
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
