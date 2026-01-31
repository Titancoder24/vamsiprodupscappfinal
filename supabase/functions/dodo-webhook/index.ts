// DodoPayments Webhook Handler for Supabase Edge Functions
// This handles payment events and updates user credits in the database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

// Credit amounts for each plan
const PLAN_CREDITS = {
    basic: 200,
    pro: 400,
};

// LIVE Credit amounts for packages
const PACKAGE_CREDITS: Record<string, number> = {
    'pdt_0NWfLXQfz6P34vDNgGT6J': 50,    // 50 credits pack (LIVE)
    'pdt_0NWfLZHVYcwnA37B60iio': 120,   // 120 credits pack (LIVE)
    'pdt_0NWfLbT49dqQm9bNqVVjS': 300,   // 300 credits pack (LIVE)
    'pdt_0NWfNy0Q3SrufzdKZlE2G': 750,   // 750 credits pack (LIVE)
    'pdt_0NWfO0TYn9murkxJ3FWbC': 1200,  // 1200 credits pack (LIVE)
    'pdt_0NWfO2IA7c8uoxbXKPkFP': 1999,  // 1999 credits pack (LIVE)
};

// LIVE Product to plan type mapping
const PRODUCT_PLANS: Record<string, 'basic' | 'pro'> = {
    'pdt_0NWfLOSWmnFywSwZldAHa': 'basic',  // Basic Plan (LIVE)
    'pdt_0NWfLU5OfjnVhmPz86wWZ': 'pro',    // Pro Plan (LIVE)
};

// Helper to find Supabase User ID by email
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
    if (!email) return null;
    try {
        console.log(`[Webhook] Looking up user by email: ${email}`);
        // In Edge Functions with service role, we use auth.admin to list users
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error(`[Webhook] User lookup error for ${email}:`, error);
            return null;
        }

        const user = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

        if (user) {
            console.log(`[Webhook] Found user ID: ${user.id} for email: ${email}`);
            return user.id;
        } else {
            console.warn(`[Webhook] No user found in Supabase for email: ${email}`);
            return null;
        }
    } catch (err) {
        console.error(`[Webhook] User lookup exception for ${email}:`, err);
        return null;
    }
}

function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Parse the webhook payload
        const payload = await req.json();

        console.log("[Webhook] Received event:", payload.type);
        console.log("[Webhook] Data:", JSON.stringify(payload.data, null, 2));

        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Handle different event types
        switch (payload.type) {
            case "subscription.active":
            case "subscription.created":
                await handleSubscriptionCreated(supabase, payload.data);
                break;

            case "subscription.renewed":
                await handleSubscriptionRenewed(supabase, payload.data);
                break;

            case "subscription.cancelled":
            case "subscription.expired":
                await handleSubscriptionCancelled(supabase, payload.data);
                break;

            case "payment.succeeded":
            case "payment.completed":
                await handlePaymentCompleted(supabase, payload.data);
                break;

            case "payment.failed":
                await handlePaymentFailed(supabase, payload.data);
                break;

            default:
                console.log("[Webhook] Unhandled event type:", payload.type);
        }

        return new Response(
            JSON.stringify({ success: true, event: payload.type }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );

    } catch (error) {
        console.error("[Webhook] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        );
    }
});

// Handle new subscription
async function handleSubscriptionCreated(supabase: any, data: any) {
    const { customer, product_id, subscription_id } = data;
    const customerEmail = customer?.email || data.customer_email;

    if (!customerEmail) {
        console.error("[Webhook] No customer email in subscription event");
        return;
    }

    // Find user by email
    const userId = await getUserIdByEmail(supabase, customerEmail);

    if (!userId || !isUUID(userId)) {
        console.error(`[Webhook] Valid Supabase user ID not found for ${customerEmail}. Found: ${userId}`);
        return;
    }

    // Determine plan type
    const planType = PRODUCT_PLANS[product_id] || 'basic';
    const monthlyCredits = PLAN_CREDITS[planType as keyof typeof PLAN_CREDITS] || 200;

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create or update subscription
    const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            price_inr: planType === 'pro' ? 699 : 399,
            monthly_credits: monthlyCredits,
            current_credits: monthlyCredits,
            dodo_subscription_id: subscription_id,
            dodo_customer_id: data.customer_id,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id'
        });

    if (subError) {
        console.error("[Webhook] Error creating subscription:", subError);
        return;
    }

    // Log transaction
    await supabase.from("credit_transactions").insert({
        user_id: userId,
        transaction_type: 'subscription_credit',
        credits: monthlyCredits,
        balance_after: monthlyCredits,
        description: `${planType === 'pro' ? 'Pro' : 'Basic'} Plan - ${monthlyCredits} credits`,
        dodo_payment_id: data.payment_id,
    });

    // Log payment history
    await supabase.from("payment_history").insert({
        user_id: userId,
        payment_type: 'subscription',
        amount_inr: planType === 'pro' ? 699 : 399,
        status: 'completed',
        dodo_payment_id: data.payment_id,
        plan_type: planType,
        payment_method: data.payment_method || 'upi',
    });

    console.log(`[Webhook] Subscription created for ${customerEmail}: ${planType} plan with ${monthlyCredits} credits`);
}

// Handle subscription renewal
async function handleSubscriptionRenewed(supabase: any, data: any) {
    const { subscription_id } = data;

    // Find subscription
    const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("dodo_subscription_id", subscription_id)
        .single();

    if (error || !subscription) {
        console.error("[Webhook] Subscription not found for renewal:", subscription_id);
        return;
    }

    const planType = subscription.plan_type;
    const monthlyCredits = PLAN_CREDITS[planType as keyof typeof PLAN_CREDITS] || 200;

    // Calculate new expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Add monthly credits
    const newCredits = (subscription.current_credits || 0) + monthlyCredits;

    // Update subscription
    await supabase
        .from("user_subscriptions")
        .update({
            current_credits: newCredits,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
        user_id: subscription.user_id,
        transaction_type: 'subscription_credit',
        credits: monthlyCredits,
        balance_after: newCredits,
        description: `Subscription Renewal - ${monthlyCredits} credits`,
        dodo_payment_id: data.payment_id,
    });

    console.log(`[Webhook] Subscription renewed: ${monthlyCredits} credits added`);
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(supabase: any, data: any) {
    const { subscription_id } = data;

    await supabase
        .from("user_subscriptions")
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription_id);

    console.log(`[Webhook] Subscription cancelled: ${subscription_id}`);
}

// Handle one-time payment (credit purchase)
async function handlePaymentCompleted(supabase: any, data: any) {
    const { customer, product_id, payment_id } = data;
    const customerEmail = customer?.email || data.customer_email;

    // Check if this is a credit package purchase
    const creditsAmount = PACKAGE_CREDITS[product_id];

    if (!creditsAmount) {
        // Not a credit package, might be a subscription payment (handled separately)
        console.log("[Webhook] Payment completed for non-credit product:", product_id);
        return;
    }

    // Find user by email
    const userId = await getUserIdByEmail(supabase, customerEmail);

    if (!userId || !isUUID(userId)) {
        console.error(`[Webhook] Valid Supabase user ID not found for payment ${payment_id} (${customerEmail})`);
        return;
    }

    // Get existing subscription or create a base one
    const { data: existingSub } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

    const currentCredits = existingSub?.current_credits || 0;
    const newBalance = currentCredits + creditsAmount;

    if (existingSub) {
        await supabase
            .from("user_subscriptions")
            .update({
                current_credits: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existingSub.id);
    } else {
        await supabase
            .from("user_subscriptions")
            .insert({
                user_id: userId,
                plan_type: 'free',
                status: 'active',
                current_credits: creditsAmount,
                dodo_customer_id: data.customer_id,
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
    }

    // Log transaction
    await supabase.from("credit_transactions").insert({
        user_id: userId,
        transaction_type: 'purchase',
        credits: creditsAmount,
        balance_after: newBalance,
        description: `Purchased ${creditsAmount} credits`,
        dodo_payment_id: payment_id,
    });

    // Log payment history
    const priceMap: Record<number, number> = { 50: 99, 120: 199, 300: 399, 750: 999, 1200: 1499, 1999: 1999 };
    await supabase.from("payment_history").insert({
        user_id: userId,
        payment_type: 'credits',
        amount_inr: priceMap[creditsAmount] || (data.total_amount ? data.total_amount / 100 : 0),
        status: 'completed',
        dodo_payment_id: payment_id,
        credits_purchased: creditsAmount,
        payment_method: data.payment_method || 'upi',
    });

    console.log(`[Webhook] Credit purchase completed: ${creditsAmount} credits for ${customerEmail}`);
}

// Handle failed payment
async function handlePaymentFailed(supabase: any, data: any) {
    const { customer, payment_id, product_id } = data;
    const customerEmail = customer?.email || data.customer_email;

    const userId = await getUserIdByEmail(supabase, customerEmail);

    // Log failed payment
    await supabase.from("payment_history").insert({
        user_id: userId || data.customer_id || customerEmail,
        payment_type: PRODUCT_PLANS[product_id] ? 'subscription' : 'credits',
        amount_inr: 0,
        status: 'failed',
        dodo_payment_id: payment_id,
        metadata: { error: data.failure_reason },
    });

    console.log(`[Webhook] Payment failed for ${customerEmail}: ${data.failure_reason}`);
}
