import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TO_EMAIL = "team@auth.prepassist.in";

interface BugReportPayload {
    description: string;
    user_email: string;
    user_name: string;
    platform: string;
    feature: string;
    stage: string;
    mcq_count: number;
    created_at: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    try {
        const payload: BugReportPayload = await req.json();

        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY not configured");
            return new Response(
                JSON.stringify({ error: "Email service not configured" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Format the email HTML
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">🐛 New Bug Report</h2>
        
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #374151;">Bug Description</h3>
          <p style="margin: 0; color: #4B5563; white-space: pre-wrap;">${payload.description}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">User Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.user_email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">User Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.user_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Platform</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.platform}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Feature</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.feature}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Current Stage</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.stage}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">MCQs Generated</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #111827;">${payload.mcq_count}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #6B7280;">Reported At</td>
            <td style="padding: 8px; color: #111827;">${new Date(payload.created_at).toLocaleString()}</td>
          </tr>
        </table>

        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
          This bug report was automatically sent from the UPSC Prep App.
        </p>
      </div>
    `;

        // Send email via Resend
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Bug Reports <bugs@auth.prepassist.in>",
                to: [TO_EMAIL],
                subject: `🐛 Bug Report: ${payload.feature} - ${payload.user_email}`,
                html: htmlContent,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Resend API error:", result);
            return new Response(
                JSON.stringify({ error: "Failed to send email", details: result }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        console.log("Bug report email sent successfully:", result);

        return new Response(
            JSON.stringify({ success: true, messageId: result.id }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Error sending bug report:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});
