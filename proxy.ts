
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  console.log("Proxy (Middleware) active on:", request.url);
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.png (public assets)
     * - auth/callback (auth route)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
