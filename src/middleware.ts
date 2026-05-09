import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

// Add paths that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // 1. Get session from cookies
  const cookie = req.cookies.get('session')?.value;
  let session = null;
  
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      console.error('Failed to decrypt session', e);
    }
  }

  // 2. Redirect to /login if the user is not authenticated
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 3. Redirect to /dashboard if the user is authenticated and trying to access login
  if (isPublicRoute && session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
