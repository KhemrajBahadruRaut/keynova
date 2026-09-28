This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Lead email configuration

The PHP backend stores every contact, home-valuation, and agent-search lead in
MySQL. To deliver inbox notifications locally, copy the backend
`C:\xampp\htdocs\keynova\.env.example` file to
`C:\xampp\htdocs\keynova\.env` and enter the sending mailbox's SMTP details:

```text
KEYNOVA_LEAD_RECIPIENTS=admin1@example.com,admin2@example.com,admin3@example.com,admin4@example.com
KEYNOVA_MANAGEMENT_EMAIL=management@keynovagrp.com
KEYNOVA_MAIL_FROM_ADDRESS=management@keynovagrp.com
KEYNOVA_MAIL_FROM_NAME=KeyNova Website
KEYNOVA_SMTP_HOST=smtp.example.com
KEYNOVA_SMTP_PORT=587
KEYNOVA_SMTP_ENCRYPTION=tls
KEYNOVA_SMTP_USERNAME=...
KEYNOVA_SMTP_PASSWORD=...
```

The backend loads this file itself, so no global XAMPP or Apache configuration
is required. The real `.env` is ignored by Git and blocked from HTTP access.
Production environment variables take precedence over values in the file.

The protected **Email Settings** page in the admin dashboard manages separate
recipient lists for the main Contact form and property-detail inquiries, with up
to five addresses in each list. The current admin password must be confirmed
before those lists can be viewed or changed. Until settings are saved there,
both lists fall back to `KEYNOVA_LEAD_RECIPIENTS`, emails in the backend
`admins` table, and `KEYNOVA_MANAGEMENT_EMAIL`.

Home-valuation leads continue to use the environment/admin/management list.
Agent-profile and agent-search activity goes directly to the email on that
agent's team record; if it is missing, the environment/admin/management list is
used as a fallback.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Agent profile URLs

Agent profiles use the existing team-member slug directly beneath the site
root. For example, `luisa-rodriguez` is available locally at
`http://localhost:3000/luisa-rodriguez` and on the Vercel deployment at
`https://keynova-ruby.vercel.app/luisa-rodriguez`. Previous
`/meet-the-team/<slug>` URLs permanently redirect to the shorter profile URL.

Clicking the photo on an agent profile opens that agent's property-search site
in a new tab. Locally, `http://localhost:3000/luisa-rodriguez` opens
`http://luisa-rodriguez.localhost:3000`; the proxy serves the existing
`/agent/luisa-rodriguez` page on that subdomain. In production, set
`NEXT_PUBLIC_ROOT_DOMAIN=keynovagrp.com` and connect `*.keynovagrp.com` to the
same Vercel deployment.

On Vercel's generated domain, the same photo opens
`https://keynova-ruby.vercel.app/agent/luisa-rodriguez` because generated
`.vercel.app` project domains do not support per-agent subdomains.

## Authentication configuration

Copy `.env.example` to `.env.local`, point both API URL variables at the PHP
backend, and replace `AUTH_SECRET` with a cryptographically random value of at
least 32 characters. For example:

```bash
openssl rand -base64 48
```

Admin login creates an encrypted JWT session in an HTTP-only cookie. Protected
admin API requests are proxied through Next.js, which verifies the session and
forwards the PHP bearer token without exposing either token to browser
JavaScript.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
