// lib/supabase/server.ts
// Server-side Supabase helper for Next.js (App Router)
// Usage in API routes / server components:
//   import { createServerSupabaseClientWrapper } from '@/lib/supabase/server'
//   const supabase = createServerSupabaseClientWrapper();

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * createServerSupabaseClientWrapper
 * - Trả về một Supabase server client dùng cho API routes / server components.
 * - Không dùng biến global; tạo client mới mỗi lần gọi.
 * - Sử dụng NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY (hoặc thay bằng env khác nếu bạn cấu hình khác).
 */
export function createServerSupabaseClientWrapper() {
  const cookieStore = cookies(); // Request cookies from Next.js (sync in most runtimes)

  return createServerClient(
    // Use server env vars (these must be configured in Vercel/your env)
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Integrate cookie handling so auth-helpers can read/write session cookies
      cookies: {
        getAll() {
          // Return cookies in the shape expected by supabase-ssr
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Try to set cookies (may throw in some server component contexts)
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore if set is not available in current context
            // (e.g., called from a pure Server Component). It's okay in many flows.
          }
        },
      },
    }
  );
}

// backward-compatible export if some files import "createClient"
export { createServerSupabaseClientWrapper as createClient };
