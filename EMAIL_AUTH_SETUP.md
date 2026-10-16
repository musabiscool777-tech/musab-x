# Enable email sign-in for Musab X

Both email/password and emailed one-time codes use Supabase Auth. No passwords are stored by Musab X. GitHub sign-in remains available while setup is pending.

1. Create a project at https://supabase.com/dashboard and open **Authentication → Providers → Email**. Enable Email and keep **Confirm email** enabled.
2. In Authentication URL settings, set the Site URL to `https://musab-x.musabiscool777.workers.dev`.
3. In **Authentication → Email Templates**, edit **Confirm signup** and **Magic Link** to include a visible code using `{{ .Token }}`. For example:

```html
<h2>Your Musab X verification code</h2>
<p>Enter this code in Musab X: <strong>{{ .Token }}</strong></p>
<p>If you did not request this, ignore this email.</p>
```

The app expects a 6–8 digit code, not a magic-link redirect. Signup confirmations use the Confirm signup template; code login and setting/resetting a password use Magic Link.

4. Configure an SMTP sender in Supabase Auth for delivery to your users. The default test sender has restricted recipients and strict rate limits; do not rely on it for public signup. Follow https://supabase.com/docs/guides/auth/auth-smtp.
5. Copy the project's HTTPS URL and **anon/publishable** API key from the Supabase project settings. Do not use the service_role/secret admin key.
6. In **Cloudflare → Workers & Pages → musab-x → Settings → Variables and Secrets**, add:

| Name | Type | Value |
| --- | --- | --- |
| SUPABASE_URL | Variable | `https://YOUR_PROJECT_REF.supabase.co` |
| SUPABASE_ANON_KEY | Secret | Project anon/publishable API key |

Save/deploy the settings. These are runtime settings, not frontend environment variables. Never paste passwords or secret keys into chat.

7. Deploy the latest GitHub code. The normal deploy command applies migration `0003_email_auth.sql`.
8. To keep the existing owner workspace, sign in with GitHub first and use **Account → Link email sign-in**. Verify the email by password or emailed code. This links the verified email identity to the current workspace without copying or changing its data or role. Then sign out and test both email/password and Email code.

Creating a separate email account while signed out creates a separate member workspace, even if its email matches a GitHub account. This prevents automatic linking or admin grants based only on matching email text. Already separate workspaces cannot be merged by this form.

The server enforces same-origin POSTs, local per-email/IP limits, verified provider identities, disabled-account checks, and session rotation. Password resets require an email code and revoke existing app sessions. The provider also enforces its own delivery, code expiry, and attempt limits.
