interface EmailRequest {
  to: string;
  subject: string;
  from_user: string;
  message: string;
  type: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: EmailRequest = await req.json();
    const { to, subject, from_user, message, type } = payload;

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; border-radius: 8px; }
      .header { background: linear-gradient(135deg, #ff4081, #c60055); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
      .message { background: #fafafa; padding: 15px; border-left: 4px solid #ff4081; margin: 15px 0; border-radius: 4px; }
      .footer { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Toppers Academy Notification</h2>
      </div>
      <div class="content">
        <h3>${subject}</h3>
        <p>Hello,</p>
        <p>You have a new notification from <strong>${from_user}</strong>:</p>
        <div class="message">${message.substring(0, 200)}</div>
        <p>Log in to Toppers Academy to view the full message.</p>
        <p style="color: #999; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
      </div>
      <div class="footer">
        <p>Toppers Academy &copy; 2024</p>
      </div>
    </div>
  </body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Toppers Academy <noreply@toppers-academy.com>",
        to: to,
        subject: subject,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Email send failed:", await emailResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, message_id: result.id }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});