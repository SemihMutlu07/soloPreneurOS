import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// DEMO_BYPASS: Set to true to skip auth checks for demo/preview purposes
const DEMO_BYPASS = true;

export async function middleware(request: NextRequest) {
  // Skip all auth checks when demo bypass is enabled
  if (DEMO_BYPASS) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (request.nextUrl.pathname.startsWith("/hiring") || request.nextUrl.pathname.startsWith("/sales") || request.nextUrl.pathname.startsWith("/finance"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/hiring/:path*", "/sales/:path*", "/finance/:path*"],
};
