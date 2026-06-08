package com.mahindra.backend.service;

import java.util.LinkedHashMap;
import java.util.Map;

public final class EmailNotificationTemplate {

    private static final String PRIMARY = "#5F0229";
    private static final String PRIMARY_DARK = "#4A011F";
    private static final String PRIMARY_LIGHT = "#A3334D";
    private static final String ERROR_RED = "#FB485B";
    private static final String BACKGROUND = "#F7F7F7";
    private static final String BORDER = "#E8E8E8";
    private static final String DIVIDER = "#F2F3F5";
    private static final String TEXT = "#2C2C2C";
    private static final String MUTED = "#7C7C7C";

    private EmailNotificationTemplate() {
    }

    public static EmailContent branded(String title, String body, String linkPath, Map<String, String> context) {
        Map<String, String> safeContext = context != null ? context : Map.of();
        String text = buildText(title, body, linkPath, safeContext);
        String html = buildHtml(title, body, linkPath, safeContext);
        return new EmailContent(text, html);
    }

    public static Map<String, String> context(String... pairs) {
        Map<String, String> context = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            if (!isBlank(pairs[i]) && !isBlank(pairs[i + 1])) {
                context.put(pairs[i], pairs[i + 1]);
            }
        }
        return context;
    }

    private static String buildText(String title, String body, String linkPath, Map<String, String> context) {
        StringBuilder out = new StringBuilder();
        out.append("CollabX\n\n");
        out.append(nullToEmpty(title)).append("\n\n");
        out.append(nullToEmpty(body)).append("\n");
        if (!context.isEmpty()) {
            out.append("\n");
            context.forEach((key, value) -> out.append(key).append(": ").append(value).append("\n"));
        }
        if (!isBlank(linkPath)) {
            out.append("\nOpen in CollabX: ").append(linkPath);
        }
        return out.toString();
    }

    private static String buildHtml(String title, String body, String linkPath, Map<String, String> context) {
        StringBuilder contextRows = new StringBuilder();
        context.forEach((key, value) -> contextRows.append("""
                <tr>
                  <td style="padding:9px 0;color:%s;font-size:13px;font-weight:700;">%s</td>
                  <td style="padding:9px 0;color:%s;font-size:13px;text-align:right;">%s</td>
                </tr>
                """.formatted(MUTED, escapeHtml(key), TEXT, escapeHtml(value))));

        String contextBlock = contextRows.isEmpty() ? "" : """
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-top:1px solid %s;border-bottom:1px solid %s;">
                  %s
                </table>
                """.formatted(DIVIDER, DIVIDER, contextRows);

        String cta = isBlank(linkPath) ? "" : """
                <a href="%s" style="display:inline-block;margin-top:28px;background:%s;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:800;padding:13px 18px;border-radius:5px;">Open in CollabX</a>
                """.formatted(escapeAttribute(linkPath), PRIMARY);

        String imagePlaceholder = """
                <tr>
                  <td style="padding:22px 26px 0;background:#FFFFFF;">
                    <div style="height:150px;border:1px dashed %s;border-radius:8px;background:%s;color:%s;font-size:13px;font-weight:700;text-align:center;line-height:150px;">
                      <img src="https://media.assettype.com/outlookbusiness/2025-07-16/73paew2l/1735023651171.jpg?w=801&auto=format%%2Ccompress&fit=max&format=webp&dpr=1.0">
                    </div>
                  </td>
                </tr>
                """.formatted(BORDER, BACKGROUND, MUTED);

        return """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:%s;font-family:Montserrat,Roboto,Arial,Helvetica,sans-serif;color:%s;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:%s;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid %s;border-radius:8px;overflow:hidden;">
                            <tr>
                              <td style="background:%s;background-image:linear-gradient(135deg,%s 0%%,%s 100%%);padding:20px 26px;color:#FFFFFF;border-bottom:4px solid %s;">
                                <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#FFFFFF;">CollabX</div>
                                <div style="font-size:24px;font-weight:700;line-height:1.25;margin-top:8px;color:#FFFFFF;">%s</div>
                              </td>
                            </tr>
                            %s
                            <tr>
                              <td style="padding:28px 26px 30px;">
                                <p style="margin:0;color:%s;font-size:15px;line-height:1.65;">%s</p>
                                %s
                                %s
                                <p style="margin:28px 0 0;color:%s;font-size:12px;line-height:1.5;">You received this because your CollabX notification preferences allow this update.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                        BACKGROUND,
                        TEXT,
                        BACKGROUND,
                        BORDER,
                        PRIMARY_DARK,
                        PRIMARY,
                        PRIMARY_LIGHT,
                        ERROR_RED,
                        escapeHtml(title),
                        imagePlaceholder,
                        TEXT,
                        escapeHtml(body),
                        contextBlock,
                        cta,
                        MUTED);
    }

    private static String escapeHtml(String value) {
        return nullToEmpty(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String escapeAttribute(String value) {
        return escapeHtml(value).replace("\n", "");
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record EmailContent(String text, String html) {
    }
}
