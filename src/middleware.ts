import { NextResponse } from "next/server";

export function middleware(req: any) {
  // Aqui você pode implementar proteção de rotas baseada em cookies/JWT do Supabase futuramente
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
}; 