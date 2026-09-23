This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Lead email configuration

The PHP backend stores every contact, home-valuation, and agent-search lead in MySQL. To also deliver inbox notifications, configure these environment variables for the PHP/Apache process:

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

Home-valuation and general-contact leads go to every address in `KEYNOVA_LEAD_RECIPIENTS`, every email in the backend `admins` table, and the management address. Agent-profile and agent-search activity goes directly to the email on that agent's team record; if it is missing, the admin/management list is used as a fallback.

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

## Agent subdomains

Agent profile homepages are resolved from the existing team-member slug. In
local development, a profile such as `john-smith` is available at
`http://john-smith.localhost:3000`. No local DNS entry is required in modern
browsers.

For production, set `NEXT_PUBLIC_ROOT_DOMAIN=keynovagrp.com`, attach both
`keynovagrp.com` and `*.keynovagrp.com` to the same deployment, and create one
wildcard DNS record for `*.keynovagrp.com`. The Vercel deployment remains
available at `https://keynova-ruby.vercel.app`; agent profile URLs use the custom
domain. Do not create a project or DNS record per agent. The application proxy
rewrites only the subdomain homepage; the apex site and all existing routes
continue to use their normal routing.

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
