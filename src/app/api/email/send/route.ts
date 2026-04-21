import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY 未配置" },
        { status: 500 }
      );
    }

    await sendWelcomeEmail("771483148@qq.com", "用户");
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
