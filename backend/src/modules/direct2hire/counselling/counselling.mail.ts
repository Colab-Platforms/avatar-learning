import { resend, FROM_EMAIL, APP_NAME } from "@/utils/mailer.js";

export interface CounsellingScheduleEmailData {
  studentName: string;
  counsellorName: string;
  date: string;
  time: string;
  meetLink: string;
}

interface BuiltEmail {
  subject: string;
  html: string;
}

function infoCardHtml(data: CounsellingScheduleEmailData): string {
  const row = (label: string, value: string, isLast = false) => `
        <tr>
            <td style="padding: 12px 0; ${isLast ? '' : 'border-bottom: 1px solid #e2e8f0;'} vertical-align: top;">
                <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${label}</span>
                <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.4;">${value}</span>
            </td>
        </tr>`;

  return `
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; width: 100%; table-layout: fixed;">
            ${row("Counsellor", data.counsellorName)}
            ${row("Date", data.date)}
            ${row("Time", data.time)}
            ${row("Meeting Platform", "Google Meet")}
            <tr>
                <td style="padding: 12px 0 0; vertical-align: top; word-break: break-all; word-wrap: break-word; overflow-wrap: break-word;">
                    <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Meeting Link</span>
                    <a href="${data.meetLink}" style="display: block; color: #4f46e5; font-size: 13px; font-weight: 600; text-decoration: none; word-break: break-all; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.4;">${data.meetLink}</a>
                </td>
            </tr>
        </table>`;
}

function wrapEmailHtml(heading: string, intro: string, data: CounsellingScheduleEmailData): string {
  return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center" style="padding: 32px 16px;">
                    <!--[if mso]>
                    <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
                    <tr>
                    <td>
                    <![endif]-->
                    <div style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 4px solid #4f46e5; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); overflow: hidden; text-align: left;">
                        
                        <!-- Header Logo -->
                        <div style="padding: 24px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                            <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${APP_NAME}</span>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 32px 24px;">
                            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">${heading}</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 8px;">Hi ${data.studentName},</p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">${intro}</p>

                            ${infoCardHtml(data)}

                            <!-- Guidelines -->
                            <div style="margin-bottom: 28px;">
                                <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Preparation Guidelines:</p>
                                <ul style="color: #475569; font-size: 13.5px; line-height: 1.7; margin: 0; padding-left: 20px;">
                                    <li style="margin-bottom: 6px;">Please join the meeting 5-10 minutes before the scheduled time.</li>
                                    <li style="margin-bottom: 6px;">Keep your internet connection stable.</li>
                                    <li style="margin-bottom: 0;">Bring any questions related to your career, AI learning path, or Direct2Hire.</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-bottom: 28px;">
                                <a href="${data.meetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06);">
                                    Join Google Meet →
                                </a>
                            </div>

                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                            <!-- Footer support -->
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
                                If you cannot attend the session, please contact the ${APP_NAME} support team beforehand.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0; line-height: 1.6;">
                                Thank you,<br />
                                <span style="font-weight: 600; color: #64748b;">${APP_NAME} Team</span>
                            </p>
                        </div>

                    </div>
                    <!--[if mso]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
        </table>`;
}

export function buildCounsellingScheduledEmail(
  data: CounsellingScheduleEmailData,
): BuiltEmail {
  return {
    subject: "Your Direct2Hire Counselling Session has been Scheduled",
    html: wrapEmailHtml(
      "Counselling Session Scheduled",
      "Thank you for enrolling in Direct2Hire. Your counselling session has now been scheduled.",
      data,
    ),
  };
}

export function buildCounsellingUpdatedEmail(
  data: CounsellingScheduleEmailData,
): BuiltEmail {
  return {
    subject: "Your Direct2Hire Counselling Session has been Rescheduled",
    html: wrapEmailHtml(
      "Counselling Session Rescheduled",
      "Your Direct2Hire counselling session details have been updated. Please find the latest schedule below.",
      data,
    ),
  };
}

export async function sendCounsellingScheduleEmail(
  email: string,
  data: CounsellingScheduleEmailData,
  kind: "scheduled" | "updated",
) {
  const { subject, html } =
    kind === "scheduled"
      ? buildCounsellingScheduledEmail(data)
      : buildCounsellingUpdatedEmail(data);

  console.log(`[Resend] Sending counselling ${kind} email to: ${email}`);
  try {
    const { data: sendData, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error(
        `[Resend Error] Failed to send counselling ${kind} email to ${email}:`,
        error,
      );
      throw error;
    }

    console.log(
      `[Resend Success] Counselling ${kind} email sent! ID: ${sendData?.id}`,
    );
    return sendData;
  } catch (error: unknown) {
    console.error(
      `[Resend] Error sending counselling ${kind} email to ${email}:`,
      error,
    );
    throw error;
  }
}
