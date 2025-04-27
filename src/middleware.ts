import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Get user data from storage (cookies in middleware context)
  const userJson = request.cookies.get('user')?.value;
  const userRole = userJson ? JSON.parse(decodeURIComponent(userJson))?.role : null;
  
  // Check if path is admin-only
  const isAdminPath = pathname.includes('/dashboard/academic/') || 
                     pathname.includes('/dashboard/attendance/overview') ||
                     pathname.includes('/dashboard/courses/manage') ||
                     pathname.includes('/dashboard/schedules/manage') ||
                     pathname.includes('/dashboard/users/');
  
  // Check if path is lecturer-only
  const isLecturerPath = pathname.includes('/dashboard/lecturer/');
  
  // Check if path is assistant-only
  const isAssistantPath = pathname.includes('/dashboard/assistant/');
  
  // If path requires specific role, check authorization
  if (userRole) {
    // Handle role-based access
    if ((isAdminPath && userRole !== 'Admin') ||
        (isLecturerPath && userRole !== 'Dosen') ||
        (isAssistantPath && userRole !== 'Asisten Dosen')) {
      // Redirect unauthorized requests to dashboard
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  
  // Continue with request if authorized or no special auth needed
  return NextResponse.next();
} 