package com.hackathonos.backend.mcp.oauth;

import org.springframework.web.util.HtmlUtils;

public class OAuthViews {

    private OAuthViews() {}

    public static String renderConsentPage(String clientName, String redirectUriHostname, String csrfToken) {
        String safeClientName = HtmlUtils.htmlEscape(clientName != null ? clientName : "Application");
        String safeHostname = HtmlUtils.htmlEscape(redirectUriHostname != null ? redirectUriHostname : "unknown");
        String safeCsrf = HtmlUtils.htmlEscape(csrfToken != null ? csrfToken : "");

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authorize Access | Brackit</title>
              <style>
                :root {
                  --bg: #0A0A0B;
                  --card-bg: #141416;
                  --border: rgba(255, 255, 255, 0.1);
                  --text: #F5F5F7;
                  --text-sub: #A1A1A6;
                  --primary: #7C3AED;
                  --primary-hover: #6D28D9;
                  --danger-hover: rgba(239, 68, 68, 0.15);
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  background-color: var(--bg);
                  color: var(--text);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .card {
                  background: var(--card-bg);
                  border: 1px solid var(--border);
                  border-radius: 16px;
                  max-width: 460px;
                  width: 90%;
                  padding: 32px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .badge {
                  display: inline-block;
                  padding: 4px 10px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  background: rgba(124, 58, 237, 0.15);
                  color: #A78BFA;
                  margin-bottom: 16px;
                }
                h1 {
                  font-size: 20px;
                  font-weight: 600;
                  margin: 0 0 12px 0;
                  line-height: 1.4;
                }
                p {
                  font-size: 14px;
                  color: var(--text-sub);
                  line-height: 1.6;
                  margin: 0 0 20px 0;
                }
                .scopes {
                  background: rgba(255, 255, 255, 0.03);
                  border: 1px solid var(--border);
                  border-radius: 12px;
                  padding: 16px;
                  margin-bottom: 24px;
                }
                .scope-item {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  font-size: 13px;
                  margin-bottom: 8px;
                }
                .scope-item:last-child {
                  margin-bottom: 0;
                }
                .scope-icon {
                  color: #10B981;
                }
                .domain-tag {
                  font-family: monospace;
                  color: #E2E8F0;
                  background: rgba(255,255,255,0.06);
                  padding: 2px 6px;
                  border-radius: 4px;
                }
                .buttons {
                  display: flex;
                  gap: 12px;
                }
                button {
                  flex: 1;
                  padding: 12px 18px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.15s ease;
                  border: none;
                }
                .btn-allow {
                  background: var(--primary);
                  color: #FFFFFF;
                }
                .btn-allow:hover {
                  background: var(--primary-hover);
                }
                .btn-deny {
                  background: transparent;
                  color: var(--text-sub);
                  border: 1px solid var(--border);
                }
                .btn-deny:hover {
                  background: var(--danger-hover);
                  color: #EF4444;
                  border-color: rgba(239, 68, 68, 0.3);
                }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">Brackit MCP Authorization</span>
                <h1><strong>{{CLIENT_NAME}}</strong> wants to access your Brackit account</h1>
                <p>Redirecting to: <span class="domain-tag">{{HOSTNAME}}</span></p>
                <div class="scopes">
                  <div class="scope-item"><span class="scope-icon">&#10003;</span> Read your hackathon rooms & teams</div>
                  <div class="scope-item"><span class="scope-icon">&#10003;</span> Read project context & step briefs</div>
                  <div class="scope-item"><span class="scope-icon">&#10003;</span> Save and validate plan documents</div>
                </div>
                <form method="POST" action="/oauth/authorize/decision">
                  <input type="hidden" name="_csrf" value="{{CSRF}}" />
                  <div class="buttons">
                    <button type="submit" name="decision" value="deny" class="btn-deny">Deny</button>
                    <button type="submit" name="decision" value="allow" class="btn-allow">Allow</button>
                  </div>
                </form>
              </div>
            </body>
            </html>
            """
            .replace("{{CLIENT_NAME}}", safeClientName)
            .replace("{{HOSTNAME}}", safeHostname)
            .replace("{{CSRF}}", safeCsrf);
    }

    public static String renderUpgradePage(String upgradeUrl) {
        String safeUrl = HtmlUtils.htmlEscape(upgradeUrl != null ? upgradeUrl : "/pricing");

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Upgrade Required | Brackit MCP</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #0A0A0B;
                  color: #F5F5F7;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .card {
                  background: #141416;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 16px;
                  max-width: 460px;
                  width: 90%;
                  padding: 32px;
                  text-align: center;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .icon {
                  font-size: 40px;
                  margin-bottom: 16px;
                }
                h1 {
                  font-size: 22px;
                  margin: 0 0 12px 0;
                }
                p {
                  font-size: 14px;
                  color: #A1A1A6;
                  line-height: 1.6;
                  margin-bottom: 24px;
                }
                .btn {
                  display: inline-block;
                  background: #7C3AED;
                  color: #FFFFFF;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  transition: background 0.15s ease;
                }
                .btn:hover {
                  background: #6D28D9;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">&#9889;</div>
                <h1>Brackit MCP requires a Pro plan</h1>
                <p>Model Context Protocol integration is available for Pro and Max subscribers. Upgrade your account to connect Claude with your Brackit workspace.</p>
                <a href="{{UPGRADE_URL}}" class="btn">Upgrade to Pro</a>
              </div>
            </body>
            </html>
            """
            .replace("{{UPGRADE_URL}}", safeUrl);
    }

    public static String renderErrorPage(String title, String description) {
        String safeTitle = HtmlUtils.htmlEscape(title != null ? title : "OAuth Error");
        String safeDesc = HtmlUtils.htmlEscape(description != null ? description : "An error occurred.");

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>{{TITLE}} | Brackit</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #0A0A0B;
                  color: #F5F5F7;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .card {
                  background: #141416;
                  border: 1px solid rgba(239, 68, 68, 0.3);
                  border-radius: 16px;
                  max-width: 460px;
                  width: 90%;
                  padding: 32px;
                  text-align: center;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                h1 {
                  font-size: 20px;
                  color: #EF4444;
                  margin: 0 0 12px 0;
                }
                p {
                  font-size: 14px;
                  color: #A1A1A6;
                  line-height: 1.6;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>{{TITLE}}</h1>
                <p>{{DESCRIPTION}}</p>
              </div>
            </body>
            </html>
            """
            .replace("{{TITLE}}", safeTitle)
            .replace("{{DESCRIPTION}}", safeDesc);
    }
}
