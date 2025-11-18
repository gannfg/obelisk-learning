import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  try {
    // Clerk handles OAuth callbacks automatically through middleware
    // This route redirects to dashboard after successful authentication
    const { userId } = await auth();
    
    if (userId) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}/`);
  }
}

