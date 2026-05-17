package com.gradproject.platform.modules.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import java.io.UnsupportedEncodingException;

@Service
public class OtpEmailService {

    private static final String EMAIL_SUBJECT = "Graduation Project Portal verification code";
    private static final String FROM_NAME = "Graduation Project Portal";

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String username;

    public OtpEmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:${MAIL_USERNAME:}}") String fromAddress,
            @Value("${spring.mail.username:}") String username
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.username = username;
    }

    public void sendOtpEmail(String recipientEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            String sender = resolveSenderAddress();

            if (sender != null && !sender.isBlank()) {
                message.setFrom(buildSenderAddress(sender));
            }

            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail, false));
            message.setSubject(EMAIL_SUBJECT, "UTF-8");
            message.setContent(buildAlternativeBody(otp));
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new MailPreparationException("Failed to prepare OTP email", exception);
        }
    }

    private String resolveSenderAddress() {
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress;
        }
        return username;
    }

    private InternetAddress buildSenderAddress(String sender) throws MessagingException, UnsupportedEncodingException {
        InternetAddress[] addresses = InternetAddress.parse(sender, false);
        InternetAddress senderAddress = addresses[0];

        if (senderAddress.getPersonal() == null || senderAddress.getPersonal().isBlank()) {
            senderAddress.setPersonal(FROM_NAME, "UTF-8");
        }

        return senderAddress;
    }

    private MimeMultipart buildAlternativeBody(String otp) throws MessagingException {
        MimeMultipart alternativeBody = new MimeMultipart("alternative");

        MimeBodyPart plainTextPart = new MimeBodyPart();
        plainTextPart.setText(buildPlainTextBody(otp), "UTF-8");
        alternativeBody.addBodyPart(plainTextPart);

        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(buildHtmlBody(otp), "text/html; charset=UTF-8");
        alternativeBody.addBodyPart(htmlPart);

        return alternativeBody;
    }

    private String buildPlainTextBody(String otp) {
        return String.join(
                System.lineSeparator(),
                "Hello,",
                "",
                "Your Graduation Project Portal verification code is:",
                "",
                otp,
                "",
                "This code will expire in 10 minutes.",
                "",
                "Do not share this code with anyone. Our team will never ask for your OTP.",
                "",
                "If you did not request this code, you can ignore this email.",
                "",
                "Graduation Project Portal",
                "Al-Balqa Applied University"
        );
    }

    private String buildHtmlBody(String otp) {
        String template = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Graduation Project Portal verification code</title>
                </head>
                <body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px;">
                      <div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:16px;">
                        Graduation Project Portal
                      </div>

                      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111827;">
                        Your verification code
                      </h1>

                      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                        Use the code below to continue securely.
                      </p>

                      <div style="margin:24px 0;padding:18px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;text-align:center;">
                        <div style="font-size:32px;letter-spacing:8px;font-weight:800;color:#111827;">
                          {{OTP_CODE}}
                        </div>
                      </div>

                      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
                        This code will expire in 10 minutes.
                      </p>

                      <p style="margin:0;padding:14px 16px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;font-size:13px;line-height:1.6;color:#713f12;">
                        Do not share this code with anyone. Our team will never ask for your OTP.
                      </p>

                      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

                      <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                        If you did not request this code, you can ignore this email.
                      </p>

                      <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">
                        Al-Balqa Applied University
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """;

        return template
                .replace("{{OTP_CODE}}", escapeHtml(otp));
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
}
