import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/offline']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public pages through
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Check for the JWT cookie set by lib/api.ts → setToken()
  const token = request.cookies.get('pal360_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox|api).*)',
  ],
}
