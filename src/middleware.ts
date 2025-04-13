import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // No authentication logic, simply pass through all requests
  return NextResponse.next();
} 