package com.gradproject.platform.modules.user;

import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Part;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OtpEmailServiceTest {

    @Test
    void sendOtpEmailBuildsSimpleTransactionalMessageWithPlainTextFallback() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(message);

        OtpEmailService service = new OtpEmailService(mailSender, "noreply@bau.edu.jo", "");

        service.sendOtpEmail("student@bau.edu.jo", "123456");
        message.saveChanges();

        verify(mailSender).send(message);

        assertThat(message.getSubject()).isEqualTo("Graduation Project Portal verification code");
        assertThat(message.getContentType()).containsIgnoringCase("multipart/alternative");
        assertThat(message.getRecipients(Message.RecipientType.TO))
                .extracting(address -> ((InternetAddress) address).getAddress())
                .containsExactly("student@bau.edu.jo");
        assertThat(message.getFrom())
                .extracting(address -> ((InternetAddress) address).getAddress())
                .containsExactly("noreply@bau.edu.jo");
        assertThat(message.getFrom())
                .extracting(address -> ((InternetAddress) address).getPersonal())
                .containsExactly("Graduation Project Portal");

        String plainText = findBodyPart(message, "text/plain");
        String html = findBodyPart(message, "text/html");

        assertThat(plainText).contains(
                "Your Graduation Project Portal verification code is:",
                "123456",
                "This code will expire in 10 minutes.",
                "Do not share this code with anyone. Our team will never ask for your OTP.",
                "Al-Balqa Applied University"
        );
        assertThat(html).contains(
                "Graduation Project Portal",
                "Your verification code",
                "123456",
                "This code will expire in 10 minutes.",
                "Do not share this code with anyone. Our team will never ask for your OTP."
        );
        assertThat(html).doesNotContain(
                "{{",
                "<img",
                "cid:",
                "background-image",
                "linear-gradient",
                "Your One-Time Password (OTP)",
                "UNIVERSITY_LOGO"
        );
    }

    private static String findBodyPart(Part part, String mimeType) throws Exception {
        if (part.isMimeType(mimeType)) {
            return part.getContent().toString();
        }

        if (part.isMimeType("multipart/*")) {
            MimeMultipart multipart = (MimeMultipart) part.getContent();

            for (int index = 0; index < multipart.getCount(); index++) {
                BodyPart bodyPart = multipart.getBodyPart(index);
                String body = findBodyPart(bodyPart, mimeType);
                if (body != null) {
                    return body;
                }
            }
        }

        return null;
    }
}
