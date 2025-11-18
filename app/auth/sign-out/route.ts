import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Clerk handles sign-out through the UserButton component
    // This route is kept for compatibility but redirects to home
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('Sign out error:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/`);
  }
}

