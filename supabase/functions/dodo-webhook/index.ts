// DodoPayments Webhook Handler for Supabase Edge Functions
// This handles payment events and updates user credits in the database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

// LIVE Credit amounts for packages
const PACKAGE_CREDITS: Record<string, number> = {
    'pdt_0NWfLXQfz6P34vDNgGT6J': 50,    // 50 credits pack (LIVE)
    'pdt_0NWfLZHVYcwnA37B60iio': 120,   // 120 credits pack (LIVE)
    'pdt_0NWfLbT49dqQm9bNqVVjS': 300,   // 300 credits pack (LIVE)
    'pdt_0NWfNy0Q3SrufzdKZlE2G': 750,   // 750 credits pack (LIVE)
    'pdt_0NWfO0TYn9murkxJ3FWbC': 1200,  // 1200 credits pack (LIVE)
    'pdt_0NWfO2IA7c8uoxbXKPkFP': 1999,  // 1999 credits pack (LIVE)
    'pdt_0NXVmuekVgYecsGGsW7li': 10,           // 10 credits test pack (₹5)
};

// LIVE Product to plan type mapping
const PRODUCT_PLANS: Record<string, 'basic' | 'pro'> = {
    'pdt_0NWfLOSWmnFywSwZldAHa': 'basic',  // Basic Plan (LIVE)
    'pdt_0NWfLU5OfjnVhmPz86wWZ': 'pro',    // Pro Plan (LIVE)
};

const PLAN_CREDITS = {
    basic: 200,
    pro: 400,
};

// Helper to find Supabase User ID by email using the user_lookup view
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
    if (!email) return null;
    try {
        console.log(`[Webhook] Looking up user for email: ${email}`);
        const { data, error } = await supabase
            .from('user_lookup')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (error) {
            console.error(`[Webhook] User lookup error for ${email}:`, error);
            return null;
        }

        console.log(`[Webhook] User lookup result for ${email}: ${data?.id || 'NOT FOUND'}`);
        return data?.id || null;
    } catch (err) {
        console.error(`[Webhook] User lookup exception for ${email}:`, err);
        return null;
    }
}

serve(async (req: any) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Parse the webhook payload
        const payload = await req.json();
        const { type, data } = payload;

        console.log(`[Webhook] PAYLOAD TYPE: ${type}`);
        console.log(`[Webhook] PAYLOAD DATA:`, JSON.stringify(data, null, 2));

        // Create Supabase client with service role key for full DB access
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ===================== DEBUG LOGGING =====================
        try {
            await supabase.from('webhook_logs').insert({
                event_type: type,
                payload: payload
            });
        } catch (logError) {
            console.error("[Webhook] Failed to write to debug log:", logError);
        }

        // ===================== IDEMPOTENCY CHECK =====================
        if (type.includes('payment') && data.payment_id) {
            const { data: existing } = await supabase
                .from('payment_history')
                .select('id')
                .eq('dodo_payment_id', data.payment_id)
                .maybeSingle();

            if (existing) {
                console.log(`[Webhook] Payment ${data.payment_id} already processed. Skipping.`);
                return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { status: 200 });
            }
        }

        // Handle different event types
        switch (type) {
            case "subscription.active":
            case "subscription.created":
                await handleSubscriptionCreated(supabase, data);
                break;

            case "subscription.renewed":
                await handleSubscriptionRenewed(supabase, data);
                break;

            case "subscription.cancelled":
            case "subscription.expired":
                await handleSubscriptionCancelled(supabase, data);
                break;

            case "payment.succeeded":
            case "payment.completed":
                // If it's a subscription payment, it might be the initial one or a renewal
                // Initial is handled by subscription.created, renewal by subscription.renewed
                // We only handle one-time credit purchases here
                if (!data.subscription_id) {
                    await handlePaymentCompleted(supabase, data);
                } else {
                    console.log(`[Webhook] Skipping payment event for subscription (handled by subscription events)`);
                }
                break;

            case "payment.failed":
                await handlePaymentFailed(supabase, data);
                break;

            default:
                console.log("[Webhook] Unhandled event type:", type);
        }

        return new Response(
            JSON.stringify({ success: true, event: type }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        console.error("[Webhook] Global Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

// Handle new subscription
async function handleSubscriptionCreated(supabase: any, data: any) {
    let { product_id, subscription_id, payment_id } = data;
    const customerEmail = data.customer?.email || data.customer_email;

    // Robustly find product_id if not at top level
    if (!product_id && data.product_cart && Array.isArray(data.product_cart) && data.product_cart.length > 0) {
        product_id = data.product_cart[0].product_id;
        console.log(`[Webhook] Extracted product_id ${product_id} from product_cart (Sub)`);
    }

    if (!customerEmail) {
        console.error("[Webhook] No customer email in subscription event");
        return;
    }

    const userId = await getUserIdByEmail(supabase, customerEmail);
    if (!userId) {
        console.error(`[Webhook] User not found for email: ${customerEmail}`);
        return;
    }

    const planType = PRODUCT_PLANS[product_id] || 'basic';
    const credits = PLAN_CREDITS[planType as keyof typeof PLAN_CREDITS];

    console.log(`[Webhook] Provisioning ${planType} plan for ${customerEmail}`);

    // Update or create subscription using atomic RPC if possible, otherwise manual update
    const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            price_inr: planType === 'pro' ? 699 : 399,
            monthly_credits: credits,
            current_credits: credits,
            dodo_subscription_id: subscription_id,
            dodo_customer_id: data.customer_id,
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (subError) {
        console.error("[Webhook] Failed to create subscription:", subError);
        return;
    }

    // Unified atomic RPC call for Provisioning + History + Audit
    const { error: rpcError } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: Math.round(credits),
        p_transaction_type: 'subscription_credit',
        p_payment_id: payment_id || `sub_${subscription_id}`,
        p_description: `${planType.toUpperCase()} Plan subscription started`,
        p_amount_inr: Math.round(planType === 'pro' ? 699 : 399),
        p_payment_method: data.payment_method || 'unknown'
    });

    if (rpcError) console.error(`[Webhook] RPC Error in sub created:`, rpcError);
}

// Handle renewal
async function handleSubscriptionRenewed(supabase: any, data: any) {
    const { subscription_id, payment_id } = data;

    const { data: sub, error: fetchErr } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan_type")
        .eq("dodo_subscription_id", subscription_id)
        .maybeSingle();

    if (fetchErr || !sub) {
        console.error(`[Webhook] Subscription ${subscription_id} not found for renewal`);
        return;
    }

    const credits = PLAN_CREDITS[sub.plan_type as keyof typeof PLAN_CREDITS] || 200;

    console.log(`[Webhook] Renewing subscription for user ${sub.user_id}`);

    // Update expiry
    await supabase
        .from("user_subscriptions")
        .update({
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("dodo_subscription_id", subscription_id);

    // Use atomic RPC for renewal
    const { error: rpcError } = await supabase.rpc('add_credits', {
        p_user_id: sub.user_id,
        p_credits: Math.round(credits),
        p_transaction_type: 'subscription_credit',
        p_payment_id: payment_id,
        p_description: 'Monthly subscription renewal credits',
        p_amount_inr: Math.round(sub.plan_type === 'pro' ? 699 : 399),
        p_payment_method: data.payment_method || 'unknown'
    });

    if (rpcError) console.error(`[Webhook] RPC Error in renewal:`, rpcError);
}

// Handle cancellation
async function handleSubscriptionCancelled(supabase: any, data: any) {
    const { subscription_id } = data;
    await supabase
        .from("user_subscriptions")
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("dodo_subscription_id", subscription_id);

    console.log(`[Webhook] Subscription ${subscription_id} cancelled.`);
}

// Handle one-time purchase
async function handlePaymentCompleted(supabase: any, data: any) {
    let { product_id, payment_id, total_amount } = data;
    const customerEmail = data.customer?.email || data.customer_email;

    // Robustly find product_id if not at top level (Dodo often puts it in product_cart)
    if (!product_id && data.product_cart && Array.isArray(data.product_cart) && data.product_cart.length > 0) {
        product_id = data.product_cart[0].product_id;
        console.log(`[Webhook] Extracted product_id ${product_id} from product_cart`);
    }

    const credits = PACKAGE_CREDITS[product_id];

    if (!credits) {
        console.log(`[Webhook] Payment completed for non-credit product: ${product_id || 'UNKNOWN'}`);
        return;
    }

    const userId = await getUserIdByEmail(supabase, customerEmail);
    if (!userId) {
        console.error(`[Webhook] User not found for payment ${payment_id} (${customerEmail})`);
        return;
    }

    const amountInr = total_amount ? Math.round(total_amount / 100) : 0;
    console.log(`[Webhook] Adding ${credits} credits to user ${userId} for payment ${payment_id} (Amount: ${amountInr})`);

    // Unified atomic RPC call for purchase
    const { data: result, error: rpcError } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: Math.round(credits),
        p_transaction_type: 'purchase',
        p_payment_id: payment_id,
        p_description: `Purchased ${credits} credits pack`,
        p_amount_inr: amountInr,
        p_payment_method: data.payment_method || 'unknown'
    });

    if (rpcError) {
        console.error("[Webhook] RPC error adding credits:", rpcError);
        return;
    }

    console.log(`[Webhook] Successfully added credits for payment ${payment_id}`);
}

// Handle failure
async function handlePaymentFailed(supabase: any, data: any) {
    const { payment_id, product_id, failure_reason } = data;
    const customerEmail = data.customer?.email || data.customer_email;
    const userId = await getUserIdByEmail(supabase, customerEmail);

    console.log(`[Webhook] Payment FAILED: ${payment_id} (${failure_reason})`);

    await supabase.from("payment_history").insert({
        user_id: userId || '00000000-0000-0000-0000-000000000000', // System user or anonymous
        payment_type: PRODUCT_PLANS[product_id] ? 'subscription' : 'credits',
        amount_inr: 0,
        status: 'failed',
        dodo_payment_id: payment_id,
        metadata: { error: failure_reason, email: customerEmail }
    });
}
