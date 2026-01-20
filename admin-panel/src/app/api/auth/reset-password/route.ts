import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('Reset password request received');
        const { password, accessToken } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'New password is required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // If access token is provided, set the session first
        if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: '', // Will be generated
            });

            if (sessionError) {
                console.error('Session error:', sessionError);
                return NextResponse.json(
                    { error: 'Invalid or expired reset token' },
                    { status: 401 }
                );
            }
        }

        // Update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json(
                { error: updateError.message || 'Failed to update password' },
                { status: 400 }
            );
        }

        console.log('Password reset successful');
        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
