import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ BỎ QUA TOÀN BỘ API (QUAN TRỌNG)
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // ✅ Chỉ xử lý session cho PAGE
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)  ❗❗❗
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
