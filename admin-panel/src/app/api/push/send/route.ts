import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Engagespot API credentials
const ENGAGESPOT_API_KEY = 'n6csieradej08ctf465vlhr';
const ENGAGESPOT_API_SECRET = 'karibass84a8lpb17aggnejcc454246j1hf36j2710ii36jc';
const ENGAGESPOT_API_URL = 'https://api.engagespot.co/v3/notifications';

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EngagespotNotification {
    notification: {
        title: string;
        message: string;
        icon?: string;
        url?: string;
    };
    recipients: string[];
    sendTo?: {
        allUsers?: boolean;
    };
}

export async function POST(request: NextRequest) {
    try {
        const { title, body, contentType, contentId, contentUrl } = await request.json();

        if (!title || !body) {
            return NextResponse.json(
                { error: 'Title and body are required' },
                { status: 400 }
            );
        }

        // Get all users to send notification using Supabase Admin API
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });

        if (usersError) {
            console.error('Error fetching users:', usersError);
            return NextResponse.json(
                { error: 'Failed to fetch users', details: usersError },
                { status: 500 }
            );
        }

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: 'No users found to send notification' },
                { status: 400 }
            );
        }

        // Prepare Engagespot notification payload
        const engagespotPayload: EngagespotNotification = {
            notification: {
                title,
                message: body,
                icon: 'https://prepassist.in/icon.png',
                url: contentUrl || undefined,
            },
            recipients: users.map(u => u.id),
        };

        // Send notification via Engagespot API
        const engagespotResponse = await fetch(ENGAGESPOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ENGAGESPOT-API-KEY': ENGAGESPOT_API_KEY,
                'X-ENGAGESPOT-API-SECRET': ENGAGESPOT_API_SECRET,
            },
            body: JSON.stringify(engagespotPayload),
        });

        const engagespotResult = await engagespotResponse.json();

        if (!engagespotResponse.ok) {
            console.error('Engagespot API error:', engagespotResult);
            return NextResponse.json(
                { error: 'Failed to send notification via Engagespot', details: engagespotResult },
                { status: 500 }
            );
        }

        // Also save to our notifications table for history
        await supabase
            .from('notifications')
            .insert({
                title,
                body,
                type: contentType || 'general',
                content_id: contentId || null,
                content_url: contentUrl || null,
                is_read: false,
                recipient_count: users.length,
                status: 'delivered',
                metadata: engagespotResult
            });

        return NextResponse.json({
            success: true,
            message: 'Notification sent via Engagespot!',
            engagespotResponse: engagespotResult,
        });

    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({
            notifications: data || [],
            message: 'Use POST to send a new notification via Engagespot'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
