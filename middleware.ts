import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });
  const url = req.nextUrl.clone();
  const path = url.pathname;

  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[Middleware][Auth] getSession error:', error.message);
    }

    const isProtected =
      path === '/dashboard' || path.startsWith('/dashboard/') ||
      path === '/admin-dashboard' || path.startsWith('/admin-dashboard/') ||
      path.startsWith('/comprehension-ecrite/') ||
      path.startsWith('/comprehension-orale/');

    const isAuthPage = path === '/login' || path === '/auth' || path.startsWith('/auth/');

    // Do not block public pages for authenticated users; avoid loops

    // If already authenticated, avoid visiting auth pages (login/register/etc.)
    // Do not block the password update flow even if the user is already authenticated
    const isUpdatePasswordPage = path.startsWith('/auth/update-password');
    if (isAuthPage && session && !isUpdatePasswordPage) {
      const target = '/dashboard';
      if (path !== target) {
        url.pathname = target;
        return NextResponse.redirect(url);
      }
    }

    if (isProtected && !session) {
      console.log('[Middleware][Auth] No session for protected path, redirecting to /login', path);
      // Redirect to login with next param so the app can send users back after auth
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', path);
      return NextResponse.redirect(loginUrl);
    }

    // If admin area, enforce admin role
    if (session && (path === '/admin-dashboard' || path.startsWith('/admin-dashboard/'))) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        const role = (profile as any)?.role;
        if (role !== 'admin') {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/dashboard';
          redirectUrl.search = '';
          return NextResponse.redirect(redirectUrl);
        }
      } catch (e) {
        console.warn('[Middleware][Auth] Failed to verify admin role, redirecting to /dashboard');
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        redirectUrl.search = '';
        return NextResponse.redirect(redirectUrl);
      }
    }

    // If admin visits the user dashboard root, redirect them to the admin dashboard
    if (session && path === '/dashboard') {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        const role = (profile as any)?.role;
        if (role === 'admin') {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/admin-dashboard';
          redirectUrl.search = '';
          return NextResponse.redirect(redirectUrl);
        }
      } catch (e) {
        // On failure, do nothing; user can still land on /dashboard
      }
    }

    // Prevent caching on protected pages
    if (isProtected) {
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.headers.set('Pragma', 'no-cache');
    }

    return res;
  } catch (e: any) {
    console.error('[Middleware][Auth] Unhandled error:', e?.message || e);
    // In case of any failure, do not block the request
    return res;
  }
}

export const config = {
  matcher: [
    // Run on all routes EXCEPT Next.js internals, API routes, and favicon
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

