import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('Forgot password request received');
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        console.log('Sending password reset email to:', email);

        const supabase = createServerClient();

        // Get the redirect URL from request or use default
        const origin = request.headers.get('origin') || 'http://localhost:8081';
        const redirectTo = `${origin}/reset-password`;

        // Send password reset email using Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });

        if (error) {
            console.error('Error sending reset email:', error);
            // Don't reveal if email exists or not for security
            return NextResponse.json(
                { message: 'If an account exists with this email, a password reset link has been sent.' },
                { status: 200 }
            );
        }

        console.log('Password reset email sent successfully to:', email);
        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
