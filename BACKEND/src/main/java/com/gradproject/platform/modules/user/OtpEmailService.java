package com.gradproject.platform.modules.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.File;

@Service
public class OtpEmailService {

    private static final String UNIVERSITY_LOGO_CONTENT_ID = "university-logo";

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String username;
    private final String universityLogoUrl;
    private final String universityLogoPath;

    public OtpEmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:${MAIL_USERNAME:}}") String fromAddress,
            @Value("${spring.mail.username:}") String username,
            @Value("${app.mail.university-logo-url:${UNIVERSITY_LOGO_URL:}}") String universityLogoUrl,
            @Value("${app.mail.university-logo-path:${UNIVERSITY_LOGO_PATH:}}") String universityLogoPath
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.username = username;
        this.universityLogoUrl = universityLogoUrl;
        this.universityLogoPath = universityLogoPath;
    }

    public void sendOtpEmail(String recipientEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            String sender = resolveSenderAddress();

            if (sender != null && !sender.isBlank()) {
                helper.setFrom(sender);
            }

            helper.setTo(recipientEmail);
            helper.setSubject("Your One-Time Password (OTP)");
            helper.setText(buildPlainTextBody(recipientEmail, otp), buildHtmlBody(recipientEmail, otp));
            addUniversityLogo(helper);
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new MailPreparationException("Failed to prepare OTP email", exception);
        }
    }

    private String resolveSenderAddress() {
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress;
        }
        return username;
    }

    private String buildPlainTextBody(String recipientEmail, String otp) {
        return String.join(
                System.lineSeparator(),
                "AL-BALQA APPLIED UNIVERSITY",
                "Graduation Project Portal",
                "",
                "Your One-Time Password (OTP)",
                "Use the verification code below to continue securely.",
                "",
                "OTP: " + otp,
                "",
                "Requested for: " + recipientEmail,
                "This code will expire in 10 minutes.",
                "",
                "Do not share this code with anyone. Our team will never ask for your OTP.",
                "",
                "If you did not request this code, please ignore this email.",
                "Copyright 2026 AL-BALQA Applied University. All rights reserved."
        );
    }

    private String buildHtmlBody(String recipientEmail, String otp) {
        String template = """
                <!DOCTYPE html>
                <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="color-scheme" content="light only">
                  <meta name="supported-color-schemes" content="light only">
                  <title>Your One-Time Password (OTP)</title>
                </head>
                  <body style="margin:0; padding:0; background-color:#0f172a; background-image:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family:Inter, 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; color:#0f172a;">
                  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
                    Your Graduation Project Portal verification code is {{OTP_CODE}}. This code expires in 10 minutes.
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#0f172a; background-image:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%; max-width:640px; border-collapse:collapse;">
                          <tr>
                            <td style="padding-bottom:18px; text-align:center;">
                              <span style="display:inline-block; font-size:12px; line-height:18px; letter-spacing:2px; text-transform:uppercase; color:#cbd5e1; font-weight:700;">
                                Secure University Verification
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="border-radius:28px; overflow:hidden; background-color:#ffffff; box-shadow:0 18px 48px rgba(15, 23, 42, 0.30);">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                                <tr>
                                  <td style="padding:0; background-color:#0f172a; background-image:linear-gradient(135deg, #0f172a 0%, #1e293b 72%, #312e81 100%);">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                                      <tr>
                                        <td style="padding:28px 28px 26px 28px;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                                            <tr>
                                              <td valign="middle" style="width:72px; padding:0;">
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                                                  <tr>
                                                    <td style="width:64px; height:64px; border-radius:18px; background-color:rgba(255,255,255,0.08); text-align:center; vertical-align:middle;">
                                                      <img src="{{UNIVERSITY_LOGO_URL}}" alt="AL-BALQA Applied University Logo" width="46" height="46" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none; width:46px; height:46px; object-fit:contain;">
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                              <td style="width:14px; font-size:0; line-height:0;">&nbsp;</td>
                                              <td valign="middle" style="text-align:left;">
                                                <div style="font-size:12px; line-height:18px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase; color:#ffffff;">
                                                  AL-BALQA APPLIED UNIVERSITY
                                                </div>
                                                <div style="font-size:24px; line-height:30px; font-weight:800; color:#a78bfa; padding-top:4px;">
                                                  Graduation Project Portal
                                                </div>
                                              </td>
                                              <td style="width:14px; font-size:0; line-height:0;">&nbsp;</td>
                                              <td valign="middle" style="width:60px; text-align:right;">
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
                                                  <tr>
                                                    <td style="width:48px; height:48px; border-radius:24px; background-color:#4f46e5; text-align:center; vertical-align:middle; color:#ffffff; font-size:22px; line-height:48px; font-weight:700;">
                                                      &#10003;
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:34px 32px 36px 32px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                                      <tr>
                                        <td style="text-align:center; padding-bottom:8px;">
                                          <div style="font-size:13px; line-height:20px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; color:#7c3aed;">
                                            Account Security Verification
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="text-align:center; padding-bottom:10px;">
                                          <div style="font-size:30px; line-height:38px; font-weight:800; color:#0f172a;">
                                            Your One-Time Password (OTP)
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="text-align:center; padding-bottom:10px;">
                                          <div style="font-size:16px; line-height:25px; font-weight:500; color:#64748b;">
                                            Use the verification code below to continue securely.
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="text-align:center; padding-bottom:24px;">
                                          <div style="font-size:14px; line-height:22px; font-weight:600; color:#475569;">
                                            Requested for <span style="color:#4338ca; font-weight:800;">{{USER_EMAIL}}</span>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding-bottom:24px;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
                                            <tr>
                                              <td align="center" valign="middle" style="padding:18px 28px; border-radius:18px; background-color:#f8fafc; border:1px solid #d9d6fe; box-shadow:inset 0 1px 0 rgba(255,255,255,0.90);">
                                                <div style="font-size:34px; line-height:38px; font-weight:900; letter-spacing:10px; color:#5b21b6; text-align:center;">
                                                  {{OTP_CODE}}
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="text-align:center; padding-bottom:22px;">
                                          <div style="display:inline-block; padding:10px 16px; border-radius:999px; background-color:#eef2ff; color:#4338ca; font-size:14px; line-height:20px; font-weight:700;">
                                            This code will expire in 10 minutes.
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding-bottom:24px;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#f5f3ff; border:1px solid #ddd6fe; border-radius:18px;">
                                            <tr>
                                              <td style="padding:18px 20px; text-align:left;">
                                                <div style="font-size:13px; line-height:20px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; color:#6d28d9; padding-bottom:6px;">
                                                  Security Notice
                                                </div>
                                                <div style="font-size:14px; line-height:23px; font-weight:600; color:#4c1d95;">
                                                  Do not share this code with anyone. Our team will never ask for your OTP.
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding-top:4px; border-top:1px solid #e2e8f0; text-align:center;">
                                          <div style="font-size:14px; line-height:24px; color:#64748b; padding-top:22px; font-weight:500;">
                                            If you did not request this code, please ignore this email.
                                          </div>
                                          <div style="font-size:12px; line-height:20px; color:#94a3b8; padding-top:12px; font-weight:600;">
                                            &copy; 2026 AL-BALQA Applied University. All rights reserved.
                                          </div>
                                          
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;

        return template
                .replace("{{OTP_CODE}}", escapeHtml(otp))
                .replace("{{USER_EMAIL}}", escapeHtml(recipientEmail))
                .replace("{{UNIVERSITY_LOGO_URL}}", escapeHtmlAttribute(resolveUniversityLogoSource()));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeHtmlAttribute(String value) {
        return escapeHtml(value);
    }

    private String resolveUniversityLogoSource() {
        if (hasLocalUniversityLogo()) {
            return "cid:" + UNIVERSITY_LOGO_CONTENT_ID;
        }

        if (universityLogoUrl != null && !universityLogoUrl.isBlank()) {
            return universityLogoUrl;
        }

        return "";
    }

    private void addUniversityLogo(MimeMessageHelper helper) throws MessagingException {
        if (!hasLocalUniversityLogo()) {
            return;
        }

        helper.addInline(
                UNIVERSITY_LOGO_CONTENT_ID,
                new FileSystemResource(new File(universityLogoPath))
        );
    }

    private boolean hasLocalUniversityLogo() {
        return universityLogoPath != null
                && !universityLogoPath.isBlank()
                && new File(universityLogoPath).isFile();
    }
}
