import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('Signup request received');
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        console.log('Creating user:', email);

        const supabase = createServerClient();

        // Create user with admin API to bypass email confirmation
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name: name || email.split('@')[0],
                full_name: name || email.split('@')[0],
            },
        });

        if (createError) {
            console.error('Error creating user:', createError);

            // If user already exists, try to sign them in
            if (createError.message?.includes('already exists') || createError.message?.includes('already been registered')) {
                return NextResponse.json(
                    { error: 'An account with this email already exists. Please sign in instead.' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: createError.message || 'Failed to create account' },
                { status: 400 }
            );
        }

        if (!userData?.user) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        console.log('User created successfully:', userData.user.email);

        // Now sign in the user to get a session
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.error('Error signing in after signup:', signInError);
            // User was created but couldn't sign in - still return success
            return NextResponse.json({
                success: true,
                message: 'Account created successfully. Please sign in.',
                user: {
                    id: userData.user.id,
                    email: userData.user.email,
                    name: name || email.split('@')[0],
                },
            });
        }

        // Return session data
        return NextResponse.json({
            success: true,
            user: {
                id: sessionData.user.id,
                email: sessionData.user.email,
                name: name || email.split('@')[0],
            },
            session: sessionData.session ? {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                expires_in: sessionData.session.expires_in,
            } : null,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
