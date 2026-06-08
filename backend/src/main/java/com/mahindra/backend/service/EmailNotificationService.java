package com.mahindra.backend.service;

import org.springframework.stereotype.Service;

import com.mahindra.backend.config.AwsSesProperties;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

@Service
public class EmailNotificationService {

    private final AwsSesProperties properties;

    public EmailNotificationService(AwsSesProperties properties) {
        this.properties = properties;
    }

    public EmailDeliveryResult send(String recipientEmail, String subject, String body) {
        return send(recipientEmail, subject, body, null);
    }

    public EmailDeliveryResult send(String recipientEmail, String subject, String textBody, String htmlBody) {
        if (!properties.enabled()) {
            return EmailDeliveryResult.disabled("SES email is disabled");
        }
        if (isBlank(properties.fromEmail()) || isBlank(properties.accessKey()) || isBlank(properties.secretKey())) {
            return EmailDeliveryResult.failed("SES configuration is incomplete");
        }
        try (SesClient client = SesClient.builder()
                .region(Region.of(isBlank(properties.region()) ? "us-east-1" : properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())))
                .build()) {
            Body.Builder body = Body.builder()
                    .text(Content.builder().charset("UTF-8").data(textBody).build());
            if (!isBlank(htmlBody)) {
                body.html(Content.builder().charset("UTF-8").data(htmlBody).build());
            }
            var request = SendEmailRequest.builder()
                    .source(properties.fromEmail())
                    .destination(Destination.builder().toAddresses(recipientEmail).build())
                    .message(Message.builder()
                            .subject(Content.builder().charset("UTF-8").data(subject).build())
                            .body(body.build())
                            .build())
                    .build();
            var response = client.sendEmail(request);
            return EmailDeliveryResult.sent(response.messageId());
        } catch (Exception e) {
            return EmailDeliveryResult.failed(e.getMessage());
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record EmailDeliveryResult(String status, String messageId, String errorText) {
        static EmailDeliveryResult disabled(String reason) {
            return new EmailDeliveryResult("disabled", null, reason);
        }

        static EmailDeliveryResult sent(String messageId) {
            return new EmailDeliveryResult("sent", messageId, null);
        }

        static EmailDeliveryResult failed(String errorText) {
            return new EmailDeliveryResult("failed", null, errorText);
        }
    }
}
