# Rule: Email

> Applied by: coder agent. Read before any email sending, template creation, or transactional flow.

Stack: **Resend** + **React Email** (already scaffolded in `src/lib/email/`).

---

## 1. When to send emails

| Trigger | Email type | Priority |
|---|---|---|
| User signs up | Welcome + verify email | Transactional (immediate) |
| Password reset requested | Reset link | Transactional (immediate) |
| Subscription upgraded | Receipt + confirmation | Transactional (immediate) |
| Subscription cancelled | Cancellation confirmation | Transactional (immediate) |
| Payment failed | Dunning email | Transactional (immediate) |
| Weekly summary | Digest | Batch (scheduled cron) |
| Re-engagement (30d inactive) | Nudge | Marketing (opt-in only) |

Never send marketing emails to users who haven't explicitly opted in.

---

## 2. Sending from Server Actions / Route Handlers

```ts
// src/lib/email/send.ts
import "server-only"
import { Resend } from "resend"
import { getServerEnv } from "@/lib/env"

let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend) return _resend
  const { RESEND_API_KEY } = getServerEnv()
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured")
  _resend = new Resend(RESEND_API_KEY)
  return _resend
}

export async function sendEmail(params: {
  to: string
  subject: string
  react: React.ReactElement
}): Promise<void> {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    react: params.react,
  })

  if (error) throw new Error(`Email send failed: ${error.message}`)
}
```

---

## 3. React Email template pattern

```tsx
// src/lib/email/templates/welcome.tsx
import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Section, Text
} from "@react-email/components"

interface Props { name: string; ctaUrl: string }

export function WelcomeEmail({ name, ctaUrl }: Props): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {process.env.NEXT_PUBLIC_APP_NAME}!</Preview>
      <Body style={{ fontFamily: "sans-serif", background: "#fff" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading>Welcome, {name}!</Heading>
          <Text>Your account is ready. Click below to get started.</Text>
          <Section>
            <Button href={ctaUrl} style={{ background: "#000", color: "#fff", padding: "12px 24px", borderRadius: 6 }}>
              Go to dashboard →
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## 4. Rate limiting outbound emails

Never fire emails in a tight loop (e.g. bulk import). Use a queue pattern:

```ts
// For bulk sends — add to a queue, process via cron
// src/app/api/cron/send-digests/route.ts
import { after } from "next/server"

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch users due for digest — process in batches of 50
  // Use after() so the response returns immediately
  after(async () => {
    const batch = await getUsersForDigest()
    for (const user of batch) {
      await sendEmail({ to: user.email, subject: "Your weekly digest", react: <DigestEmail user={user} /> })
      await new Promise(r => setTimeout(r, 100)) // 100ms between sends
    }
  })

  return Response.json({ ok: true })
}
```

---

## 5. Rules

- `RESEND_FROM_EMAIL` must be a verified domain in Resend — never send from gmail/yahoo
- Always validate recipient email before sending (Zod `.email()`)
- Unsubscribe links are required for marketing emails — use Resend's list management
- Never log email bodies — they may contain PII
- Preview emails locally: `pnpm email:preview` (add script to package.json)
- Test with real addresses on staging — Resend's sandbox mode catches issues early
