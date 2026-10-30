import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/editor') || request.nextUrl.searchParams.get('preview')==='draft') {
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
    response.headers.set('Cache-Control','private, no-store');
  }
  return response;
}
export const config = { matcher:['/admin/:path*','/api/editor/:path*','/','/events','/om-os','/galleri','/spil-hos-os','/kunst','/kontakt'] };
