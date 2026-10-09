# KeyNova API documentation

Source review date: October 9, 2026.

This reference documents the Next.js project in `D:\office\GR8\keynova` and its companion PHP backend in `C:\xampp\htdocs\keynova`. Contracts were checked against local route handlers, PHP endpoints, validation helpers, and frontend callers. Examples use fictional records and placeholder credentials. A deployed backend may differ from these local files.

## Contents

- [Base URLs and configuration](#base-urls-and-configuration)
- [Request and response conventions](#request-and-response-conventions)
- [Authentication](#authentication)
- [Next.js endpoints](#nextjs-endpoints)
- [Properties and document access](#properties-and-document-access)
- [Visitor accounts](#visitor-accounts)
- [Contact and home valuation leads](#contact-and-home-valuation-leads)
- [Team members](#team-members)
- [Testimonials](#testimonials)
- [Website content](#website-content)
- [Email settings](#email-settings)
- [Additional backend endpoints](#additional-backend-endpoints)
- [Upload limits and errors](#upload-limits-and-errors)
- [Request examples](#request-examples)
- [Source files](#source-files)

## Base URLs and configuration

There are two services. Public data and visitor requests generally go directly to PHP. Admin requests use the Next.js API, which forwards them to PHP with server-managed credentials.

| Service | Local example | Purpose |
| --- | --- | --- |
| Next.js (`SITE`) | `http://localhost:3000` | Admin authentication, admin proxy, testimonials proxy, team thumbnails |
| PHP (`BACKEND`) | `http://localhost/keynova` | Properties, visitors, leads, team, content, settings, testimonials |

The PHP API paths do **not** have an `/api` prefix. For example:

```text
Public list:  http://localhost/keynova/property/get_properties.php
Admin list:  http://localhost:3000/api/admin/property/get_properties.php?destination=all
```

Next.js configuration, from `.env.example`:

```dotenv
NEXT_PUBLIC_API_BASE=http://localhost/keynova
API_BASE_URL=http://localhost/keynova
AUTH_SECRET=replace-with-at-least-32-random-characters
NEXT_PUBLIC_ROOT_DOMAIN=keynovagrp.com
```

`NEXT_PUBLIC_API_BASE` is used by browser callers and public data helpers. Server-side proxies use `API_BASE_URL`, falling back to `NEXT_PUBLIC_API_BASE`. `AUTH_SECRET` must contain at least 32 characters. The root domain controls agent site URLs; it does not change endpoint paths.

## Request and response conventions

- Send JSON requests with `Content-Type: application/json` and preferably `Accept: application/json`.
- Send uploads as `multipart/form-data`. Let `FormData` or the HTTP client generate the boundary.
- Mutations use `POST`, including updates and deletions. The app does not expose REST-style `PATCH` or `DELETE` routes for these operations.
- Check both the HTTP status and the JSON `status`. Several legacy PHP handlers report an error with HTTP `200`.
- IDs in validated PHP responses are generally integers. Direct PHP admin login can return a string ID; Next.js session responses use a string ID.
- Database timestamps generally use `YYYY-MM-DD HH:mm:ss`; visitor token expiration fields use ISO 8601. Do not assume all timestamp fields have the same timezone or format.
- Image fields generally contain filenames. Resolve them against `BACKEND/uploads/<filename>`. Some content images and existing team photos can instead be URLs or site paths.
- No pagination query parameters are implemented for the documented lists. Valuation and testimonial lists return at most 500 records; visitor profile collections return at most 100 each.
- PHP handles `OPTIONS` preflight globally. Its CORS configuration allows `Content-Type` and `Authorization`. The additional mail-access header is intended for server-to-server calls through the Next.js proxy.

Typical list response:

```json
{
  "status": "success",
  "data": []
}
```

Typical error:

```json
{
  "status": "error",
  "message": "Enter a valid email address."
}
```

Some errors also include `errors` (field errors), `code`, or `retry_after` (seconds). Response fields such as `id`, `visitor`, `access_token`, and `notification_sent` may appear at the top level instead of inside `data`.

For lead endpoints, `notification_sent: false` means the lead was saved but its email notification was not sent. A successful response should not be resubmitted just because notification delivery failed.

## Authentication

### Admin session

1. `POST SITE/api/auth/login` with an admin email and password.
2. Preserve the `keynova_admin_session` cookie.
3. Call `SITE/api/admin/<PHP endpoint path>` with that cookie.
4. `POST SITE/api/auth/logout` to clear the session.

The cookie contains an encrypted JWT, expires after eight hours, and is HTTP-only with `SameSite=Strict`; it is secure in production. Next.js decrypts it and sends `Authorization: Bearer <backend admin token>` to PHP. The login response does not expose that token to browser JavaScript.

Next.js mutations reject an `Origin` header that differs from the request URL's origin. Requests without an `Origin` header, such as typical command-line clients, can use the cookie flow.

Direct server-to-server PHP authentication is also available through `POST BACKEND/admin/admin_login.php`, with the same `{ "email": "...", "password": "..." }` body. Success returns:

```json
{
  "status": "success",
  "message": "Login successful",
  "token": "<64-character backend admin token>",
  "admin": { "id": "1", "email": "admin@example.com" }
}
```

Use that token as a bearer credential for direct PHP admin calls. A new login replaces the admin's stored backend token, so earlier sessions for that admin may stop working. Next.js logout clears cookies; it does not revoke the stored PHP admin token.

### Visitor session

Visitors verify an email code and, if needed, finish setting up a password. Existing visitors can also sign in with email/password. Successful authentication returns an `access_token`, valid for 30 days, and an `expires_at` timestamp.

```http
Authorization: Bearer <visitor access_token>
```

Visitor tokens are separate from admin tokens and are sent directly to the PHP backend. PHP stores their hashes. The frontend stores visitor access through `lib/property-access.ts`; the shared profile cookie alone does not authenticate PHP requests.

## Next.js endpoints

All paths in this section are relative to `SITE`.

| Method | Path | Authentication | Request | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | JSON `email`, `password` | `200`, sets admin cookie |
| GET | `/api/auth/session` | Admin cookie | None | `200`, authenticated admin |
| POST | `/api/auth/logout` | No session required | No body required | `200`, clears admin and mail-access cookies |
| GET / POST | `/api/admin/<allowed-path>` | Admin cookie | Depends on PHP endpoint | PHP response passed through |
| POST | `/api/admin/mail-settings/unlock` | Admin cookie | JSON `password` | `200`, sets mail-access cookie |
| POST | `/api/admin/mail-settings/lock` | No session required | No body required | `200`, clears mail-access cookie |
| GET | `/api/testimonials` | Public | None | `200`, approved testimonials |
| POST | `/api/testimonials` | Public | Testimonial JSON described below | `201`, pending review |
| GET | `/api/team-thumbnail/{filename}` | Public | Filename in URL | `200`, WebP image |

### Login and session responses

Login accepts a valid email and a nonempty password of at most 128 characters. The declared request length must not exceed 4,096 bytes.

```json
{
  "status": "success",
  "admin": { "id": "1", "email": "admin@example.com" }
}
```

`GET /api/auth/session` returns:

```json
{
  "authenticated": true,
  "admin": { "id": "1", "email": "admin@example.com", "role": "admin" }
}
```

An absent or invalid session produces HTTP `401` with `{ "authenticated": false }`. Login returns `400` for invalid input, `401` for rejected credentials, `403` for an invalid origin, `413` for an excessive declared length, and `502` when the authentication service cannot be reached or processed.

Logout and mail-settings lock return `{ "status": "success" }`.

### Admin proxy allowlist

Only these PHP paths can be reached through `/api/admin/`:

| Method used by the app | Allowed PHP path |
| --- | --- |
| GET | `property/get_properties.php` |
| GET | `property/get_property.php` |
| GET | `property/get_doc_requests.php` |
| GET | `contact/get_contacts.php` |
| POST | `property/create_property.php` |
| POST | `property/update_property.php` |
| POST | `property/upload_property_document_chunk.php` |
| POST | `property/delete_property.php` |
| POST | `property/delete_property_image.php` |
| POST | `property/delete_property_document.php` |
| GET | `team/get_admin_members.php` |
| POST | `team/create_member.php` |
| POST | `team/update_member.php` |
| POST | `team/delete_member.php` |
| GET | `content/get_admin_content.php` |
| POST | `content/update_content.php` |
| POST | `content/upload_image.php` |
| GET | `valuation/get_requests.php` |
| POST | `valuation/update_request_status.php` |
| GET | `testimonials/get_admin_testimonials.php` |
| POST | `testimonials/update_testimonial_status.php` |
| GET | `settings/get_mail_settings.php` |
| POST | `settings/update_mail_settings.php` |

The proxy exports `GET` and `POST`; the backend supplies endpoint-specific method checks. It forwards query strings, request content type, and body, and returns the backend status and body with `Cache-Control: no-store`.

An absent session returns `401` and `Your session has expired.` An unlisted path returns `404`. An excessive declared body length returns `413`. Backend network/timeout failures return `502`. An `Unauthorized` or `Invalid token` backend JSON error clears the admin session and becomes `401`.

### Team thumbnails

`GET /api/team-thumbnail/{filename}` only accepts filenames matching `team_` + 32 lowercase hexadecimal characters + `.jpg`, `.png`, or `.webp`. It reads the backend upload and returns a WebP thumbnail up to 750 pixels wide without enlargement. Success is cached for one hour.

Invalid filenames and missing images return `404`; an unconfigured API base returns `503`; images above 4 MiB return `413`; source or processing failures return `502`. GIF team photos cannot use this thumbnail endpoint.

## Properties and document access

PHP paths below are relative to `BACKEND`. Admin paths below are relative to `SITE`.

### List properties

`GET /property/get_properties.php`

| Query | Required | Values / behavior |
| --- | --- | --- |
| `destination` | No | `listing` (default), `off_market`, or `all` |
| `agent_slug` | No | Lowercase agent slug, up to 63 characters; agent must be active to match |

`listing` and `off_market` lists are public. `destination=all` requires an admin bearer token, normally supplied through `/api/admin/property/get_properties.php?destination=all`.

When `agent_slug` is provided, the query always selects that agent's listing-published properties, even if `destination=off_market` is also supplied. `destination=all` still requires admin authentication.

Returns `{ "status": "success", "data": [PropertySummary] }`, newest creation first. Invalid destination or slug returns `422`.

Example public summary:

```json
{
  "id": 12,
  "agent_id": 3,
  "title": "Example Residence",
  "address": "100 Example Street, Boston, MA",
  "price": "$2,450,000",
  "building_size": "14,614 SF",
  "units": "4",
  "year_built": "2005",
  "created_at": "2026-10-01 10:00:00",
  "lat": 42.36,
  "lng": -71.06,
  "show_on_listing": true,
  "show_off_market": false,
  "agent_slug": "example-agent",
  "agent_name": "Alex Example",
  "cover_image": "prop_12_img_example.jpg"
}
```

`agent_id`, coordinates, `agent_slug`, and `cover_image` can be null. The public summary excludes description, highlights, detailed agent contact fields, and attachment lists. Admin `destination=all` includes the property table's columns and joined agent fields in addition to the cover image.

### Get full property details

`GET /property/get_property.php?id=12&source=listing`

Requires a visitor or admin bearer token. The admin dashboard uses `/api/admin/property/get_property.php?id=12`.

- `id`: required positive integer.
- `source`: optional activity source; accepted values are `listing`, `exclusive`, `grandliving`, `agent`, `related`, and `profile`. Missing or unrecognized sources become `listing`.

Returns `{ "status": "success", "data": PropertyDetail }`. Detail contains property columns, joined `agent_slug`, `agent_name`, `agent_title`, `agent_phone`, `agent_email`, and `agent_photo`, plus:

```json
{
  "description": "Property description",
  "highlights": "First highlight\nSecond highlight",
  "images": ["prop_12_img_example.jpg"],
  "documents": [
    { "name": "Offering memorandum.pdf", "file": "doc_12_example.pdf" }
  ]
}
```

The raw backend `highlights` field is text; the frontend normalizes it to an array. Additional fields from `p.*` depend on the backend database schema. Visitor detail requests record a visit. Invalid IDs return `422`, absent/expired credentials return `401`, and missing properties return `404`.

### Create or update a property

- `POST /api/admin/property/create_property.php` — `201`, returns `status`, `message`, and new integer `id`.
- `POST /api/admin/property/update_property.php` — `200`, returns `status` and `message`.

Both use multipart form data and require the admin cookie. Direct PHP paths accept an admin bearer token.

| Field | Required | Contract |
| --- | --- | --- |
| `id` | Update only | Positive property ID |
| `title` | Yes | 3–120 characters |
| `address` | Yes | 8–250 characters |
| `price` | Yes | Positive price text, e.g. `$2,450,000` or `2450000.00`; maximum 100 characters |
| `agent_id` | No | Existing team member ID; blank clears the relation |
| `building_size` | No | Positive size, optionally with `SF`/square-foot suffix; maximum 100 characters |
| `units` | No | Positive whole number as text; maximum 50 characters |
| `year_built` | No | Four-digit year from 1600 through the backend's current year + 1 |
| `description` | No | Up to 5,000 characters |
| `highlights` | No | Text up to 3,000 characters; UI sends newline-separated highlights |
| `lat` | No | Numeric latitude from -90 to 90 |
| `lng` | No | Numeric longitude from -180 to 180 |
| `show_on_listing` | At least one publication flag | String `1` enables; anything else disables |
| `show_off_market` | At least one publication flag | String `1` enables; anything else disables |
| `images[]` | No | JPG, JPEG, PNG, WebP, or GIF files |
| `documents[]` | No | PDF, DOC, or DOCX files; larger files should use chunk upload |

At least one publication flag must be enabled. Agent display/contact fields are populated from the selected team member; do not submit copied agent fields as the authoritative values.

Update is a full form submission: include the required fields and publication flags again. Omitted optional values are cleared/defaulted rather than treated as a partial patch. New attachments are appended; existing ones use the deletion endpoints below. Unsupported or failed image/document attachments can be skipped while the property mutation still succeeds; verify attachments by fetching the property afterward.

Validation errors return `422`, sometimes with an `errors` map. Updating a missing property returns `404`.

### Upload a document in chunks

`POST /api/admin/property/upload_property_document_chunk.php`

Send multipart data sequentially for each chunk:

| Field | Contract |
| --- | --- |
| `property_id` | Existing property ID |
| `upload_id` | Stable identifier for all chunks of one file; 36 characters matching hexadecimal digits and hyphens, e.g. a UUID |
| `original_name` | Original filename, up to 255 bytes; PDF, DOC, or DOCX extension |
| `total_size` | Entire file size in bytes; 1–10 MiB |
| `chunk_index` | Zero-based index |
| `chunk_count` | 1–10 |
| `chunk` | File/blob, 1 byte to 2 MiB per chunk |

The frontend uses 1.5 MiB chunks. Submit the final chunk only after the preceding chunks are stored; it triggers assembly and document registration.

Intermediate success (`200`):

```json
{ "status": "success", "message": "Document chunk uploaded.", "complete": false }
```

Final success (`200`):

```json
{
  "status": "success",
  "message": "Document uploaded.",
  "complete": true,
  "document": { "name": "Offering memorandum.pdf", "file": "doc_12_example.pdf" }
}
```

Invalid chunk data returns `400`, a missing property returns `404`, and missing chunks at assembly return `409`. Stale `.part` files older than one hour are cleaned during uploads.

### Delete a property or attachment

| POST path on `SITE` | JSON body | Success |
| --- | --- | --- |
| `/api/admin/property/delete_property.php` | `{ "id": 12 }` | `{ "status": "success", "message": "Property deleted" }` |
| `/api/admin/property/delete_property_image.php` | `{ "property_id": 12, "filename": "prop_12_img_example.jpg" }` | `{ "status": "success" }` |
| `/api/admin/property/delete_property_document.php` | `{ "property_id": 12, "filename": "doc_12_example.pdf" }` | `{ "status": "success" }` |

These legacy handlers use HTTP `200` for many input/database errors. Inspect JSON `status`. Property deletion also deletes associated attachment records, document requests, and property inquiries; it does not explicitly remove attachment files from disk. Individual attachment deletion removes the corresponding file.

### Verify visitor access to properties

1. `POST BACKEND/property/request_document.php`:

   ```json
   {
     "property_id": 12,
     "name": "Jordan Example",
     "email": "jordan@example.com",
     "phone": "6175550123",
     "source": "listing"
   }
   ```

   All fields except `source` are required. Name is up to 150 bytes, email up to 254 bytes, and phone must contain exactly ten digits; common phone punctuation is accepted. Success is `200` with `status` and a verification-email message. A six-digit code expires after 15 minutes. A repeated pending request replaces its code. A missing property returns `404`; mail failure returns `502`.

2. `POST BACKEND/property/verify_document_code.php`:

   ```json
   { "property_id": 12, "email": "jordan@example.com", "code": "123456" }
   ```

   Existing visitors with a password receive `200` with `status`, `message`, `access_token`, `expires_at`, and `visitor`.

   Visitors who need a password receive:

   ```json
   {
     "status": "success",
     "message": "Email verified. Create a password to finish your profile.",
     "requires_profile_setup": true,
     "setup_token": "<64-character setup token>",
     "setup_expires_at": "2026-10-09T12:15:00+00:00",
     "visitor": { "name": "Jordan Example", "email": "jordan@example.com", "phone": "6175550123" }
   }
   ```

   Finish through `user/complete_visitor_profile.php` below before requesting property details. Setup tokens last 15 minutes. No pending request returns `404`, an expired code returns `410`, and a wrong/malformed code returns `422`.

3. Use the returned visitor token for details and downloads. The session grants access across properties; it is not limited to the original property.

`POST BACKEND/property/access_session.php` accepts `{ "token": "<visitor token>", "property_id": 12 }` and validates the session/property. It returns `200` with `status`, `visitor`, and `expires_at`; invalid sessions return `401`, and missing properties return `404`. This supporting endpoint is not called by the current frontend.

### Download a property document

`POST BACKEND/property/download_document.php`

Requires a visitor token. Accepts JSON or a form submission:

```json
{
  "property_id": 12,
  "document_file": "doc_12_example.pdf",
  "source": "listing"
}
```

Send the token in `Authorization: Bearer ...`, or as a `token` body/form field when posting a browser download form. `document_file` is the stored `file` value returned by property detail, not its display name.

Success returns binary content with `Content-Disposition: attachment` and a PDF/DOC/DOCX content type. The download is recorded. Errors return JSON: `401` for an invalid session, `422` for invalid input, and `404` for an unknown document/property combination or missing disk file. An admin token alone does not authenticate this download handler.

### Admin property access activity

`GET SITE/api/admin/property/get_doc_requests.php`

Returns `200`:

```json
{ "status": "success", "data": [], "visitors": [], "downloads": [] }
```

- `data`: requests with `id`, `property_id`, `name`, `email`, `phone`, `source`, `requested_at`, `verified_at`, `status`, `property_title`, `property_agent_name`.
- `visitors`: `id`, `name`, `email`, `phone`, `entry_property_id`, `entry_source`, `created_at`, `entry_property_title`, `entry_agent_name`.
- `downloads`: `id`, `access_session_id`, `visitor_id`, `property_id`, `document_filename`, `document_name`, `source`, `downloaded_at`, `property_title`, `property_agent_name`.

## Visitor accounts

All paths are relative to `BACKEND`. Protected endpoints require the visitor bearer token.

| Method | Path | Authentication | Input | Success |
| --- | --- | --- | --- | --- |
| POST | `/user/complete_visitor_profile.php` | Setup token in body | `setup_token`, `password`, `password_confirmation` | `201`, visitor session |
| POST | `/user/visitor_login.php` | Public | `email`, `password` | `200`, visitor session |
| GET | `/user/visitor_profile.php` | Visitor | None | `200`, profile in `data` |
| POST | `/user/visitor_logout.php` | Visitor | No body required | `200`, signed out |
| POST | `/user/update_visitor_profile.php` | Visitor | `name`, `phone` | `200`, updated `visitor` |
| POST | `/user/upload_profile_image.php` | Visitor | Multipart `image` | `200`, updated `visitor` |
| POST | `/user/toggle_saved_home.php` | Visitor | `property_id`, boolean `save` | `200`, `saved_property_ids` |
| POST | `/user/request_visitor_email_change.php` | Visitor | `email` | `200`, code sent |
| POST | `/user/verify_visitor_email_change.php` | Visitor | Six-digit string `code` | `200`, updated `visitor` |
| POST | `/user/change_visitor_password.php` | Visitor | `current_password`, `new_password` | `200`, password updated |

### Visitor session response

Profile completion and login return:

```json
{
  "status": "success",
  "message": "Signed in successfully.",
  "access_token": "<64-character visitor token>",
  "expires_at": "2026-11-08T12:00:00+00:00",
  "visitor": {
    "name": "Jordan Example",
    "email": "jordan@example.com",
    "phone": "6175550123",
    "profile_image": null
  }
}
```

The message differs for profile completion. Setup passwords must match and be 10–128 characters after trimming. An expired/consumed setup token returns `410`. Login accepts a password of 1–128 characters after trimming, returns `401` for incorrect credentials, and can return `429` for an account temporarily locked after repeated failures.

### Visitor profile

`GET /user/visitor_profile.php` returns:

```json
{
  "status": "success",
  "data": {
    "visitor": { "name": "Jordan Example", "email": "jordan@example.com", "phone": "6175550123", "profile_image": null },
    "has_password": true,
    "email_verified_at": "2026-10-09 12:00:00",
    "member_since": "2026-10-09 12:00:00",
    "last_login_at": "2026-10-09 12:00:00",
    "session_expires_at": "2026-11-08T12:00:00+00:00",
    "saved_homes": [],
    "history": [],
    "inquiries": []
  }
}
```

`last_login_at` and `profile_image` can be null. Collection items:

| Collection | Fields |
| --- | --- |
| `saved_homes` | `id` (property ID), `saved_at`, `title`, `address`, `price`, `cover_image` |
| `history` | `id` (property ID), `source`, `first_visited_at`, `last_visited_at`, `title`, `address`, `price`, `cover_image` |
| `inquiries` | `id` (inquiry ID), `property_id`, `message`, `created_at`, `title`, `address`, `price`, `cover_image`, `recipient_name`, `recipient_email` |

Each collection contains up to 100 records in most-recent-first order. `property_id` and cover images can be null. Inquiries include property inquiries linked to this visitor or matching their verified email.

### Profile changes and saved homes

Profile update requires `name` (2–150 characters) and `phone` (7–40 characters containing exactly ten digits). Success returns `status`, `message`, and `visitor`; it updates the visitor's existing access sessions.

Profile image upload accepts JPG, PNG, and WebP, at most 5 MiB. Dimensions must be at most 8,000 pixels on either axis and 40 million pixels overall. It replaces the prior uploaded image and returns the updated `visitor`.

Saved-home requests use a real JSON boolean:

```json
{ "property_id": 12, "save": true }
```

Use `false` to remove a saved home. The response contains `status`, `message`, and an integer array `saved_property_ids`. A missing property returns `404`.

### Email and password changes

Request an email change with `{ "email": "new-address@example.com" }`, then verify with `{ "code": "123456" }`. The code expires after 15 minutes. Requests are limited to one per minute (`429`). The same current email returns `422`, an email already in use returns `409`, and delivery failure returns `502`. Verification returns `404` when no change is pending, `410` for expiry, and `422` for a wrong code.

Change password with:

```json
{ "current_password": "<current password>", "new_password": "<new password of 10–128 characters>" }
```

The current password must match when the account already has one. The new password must differ from the current password. Success revokes other visitor sessions while retaining the current session. Logout revokes the current visitor session.

## Contact and home valuation leads

### Main contact / agent contact

`POST BACKEND/contact/submit_contact.php` — public, JSON, `201`.

| Field | Required | Contract |
| --- | --- | --- |
| `first_name` | Yes | Name text, up to 100 characters |
| `last_name` | Yes | Name text, up to 100 characters |
| `email` | Yes | Valid email, up to 254 characters |
| `subject` | Yes | Up to 255 characters |
| `help_with` | Yes | One of the choices below |
| `phone` | Yes | Exactly ten digits, without formatting |
| `message` | Yes | At least ten words, up to 5,000 characters |
| `consent` | Yes | JSON boolean `true` |
| `agent_slug` | No | Active agent slug; up to 160 characters, lowercase words separated by hyphens |

Name fields accept letters, spaces, hyphens, and apostrophes. `help_with` choices: `Buying a home`, `Selling a home`, `Renting`, `Investment properties`, `General inquiry`.

```json
{
  "first_name": "Jordan",
  "last_name": "Example",
  "email": "jordan@example.com",
  "subject": "Buying a home",
  "help_with": "Buying a home",
  "phone": "6175550123",
  "message": "I would like to discuss purchasing a home in Boston this month.",
  "consent": true
}
```

Success contains `status`, `message: "Your message has been sent."`, integer `id`, and boolean `notification_sent`. An `agent_slug` routes notification to that agent's email, with the default lead-recipient list as fallback. Without an agent, the main-contact recipient list is used.

### Property inquiry

`POST BACKEND/property/contact_inquiry.php` — public; optional visitor bearer token, JSON, `201`.

```json
{
  "property_id": 12,
  "name": "Jordan Example",
  "email": "jordan@example.com",
  "phone": "6175550123",
  "message": "Please send me more information about this property and its current availability.",
  "consent": true
}
```

All fields are required. Name is up to 255 characters and follows the name rules above; email is up to 254 characters, phone is exactly ten unformatted digits, and message has at least ten words and at most 5,000 characters. The property must exist.

An optional valid visitor bearer token links the inquiry to the visitor. Success contains `status`, `message: "Your property inquiry has been submitted."`, `id`, and `notification_sent`. Email uses the property-inquiry recipient list.

### Admin contact list

`GET SITE/api/admin/contact/get_contacts.php` — admin cookie, `200`.

Returns `data` containing `id`, `property_id`, `agent_id`, `agent_name`, `source`, `name`, `email`, `subject`, `help_with`, `phone`, `message`, `consented_at`, `created_at`, and `property_title`. Sources are `general`, `agent`, or `property`. Optional relations, subject, help selection, and consent timestamps can be null. Sorted newest first.

### Submit a home valuation

`POST BACKEND/valuation/submit_valuation.php` — public, JSON, `201`.

```json
{
  "address": "100 Example Street, Boston, MA",
  "zip": "02108",
  "property_type": "Single Family",
  "bedrooms": "3",
  "bathrooms": "2",
  "name": "Jordan Example",
  "email": "jordan@example.com",
  "phone": "6175550123",
  "consent": true
}
```

All fields are required. All except `consent` must be nonempty strings. Maximum lengths: `address` 255, `zip` 20, `property_type` 100, `bedrooms`/`bathrooms` 20 each, `name` 150, `email` 254, `phone` 40. Email must be valid and phone must contain ten digits; common punctuation is accepted. `consent` must be boolean `true`.

`property_type`, `bedrooms`, and `bathrooms` are text values; the backend does not enforce the editable UI option lists as enums. Success returns `status`, `message`, `id`, and `notification_sent`; the new request starts with status `new`.

### Admin valuation endpoints

| Method | Path on `SITE` | Input / response |
| --- | --- | --- |
| GET | `/api/admin/valuation/get_requests.php` | Up to 500 latest requests in `data` |
| POST | `/api/admin/valuation/update_request_status.php` | JSON `{ "id": 12, "status": "contacted" }`; `200`, `status` and `message` |

Allowed request statuses: `new`, `contacted`, `completed`, `archived`. List items contain `id`, all submitted string fields, boolean `consent_given`, `status`, `created_at`, and `updated_at`. Invalid status/ID returns `422`; an unknown request returns `404`.

## Team members

### Read team members

| GET path | Authentication | Response |
| --- | --- | --- |
| `BACKEND/team/get_members.php` | Public | Active members in `data` |
| `BACKEND/team/get_member.php?slug=example-agent` | Public | One active member in `data` |
| `SITE/api/admin/team/get_admin_members.php` | Admin cookie | All members, including inactive, in `data` |

Lists sort by `sort_order`, then `id`, ascending. A member has:

```json
{
  "id": 3,
  "slug": "example-agent",
  "name": "Alex Example",
  "role": "Real Estate Agent",
  "photo": "team_0123456789abcdef0123456789abcdef.jpg",
  "bio": "Agent biography",
  "email": "alex@example.com",
  "phone": "6175550123",
  "sort_order": 0,
  "is_active": true,
  "created_at": "2026-10-01 10:00:00",
  "updated_at": "2026-10-01 10:00:00"
}
```

Photo, email, and phone can be null. Detail lookup expects a canonical slug; a noncanonical form can return `404`. Invalid/reserved slugs return `422`; missing or inactive members return `404`.

### Create and update a member

- `POST SITE/api/admin/team/create_member.php` — multipart, `201`, returns new `id`.
- `POST SITE/api/admin/team/update_member.php` — multipart, `200`.

| Field | Required | Contract |
| --- | --- | --- |
| `id` | Update only | Positive member ID |
| `name` | Yes | Name rules above; up to 150 characters |
| `role` | Yes | Up to 180 characters |
| `slug` | No | Omission derives it from name; normalized, unique, up to 63 characters, not a reserved route |
| `bio` | No | Up to 20,000 characters |
| `email` | No | Valid email, up to 254 bytes; blank becomes null |
| `phone` | No | Exactly ten unformatted digits; blank becomes null |
| `sort_order` | No | Integer text 0–9999; default `0` |
| `is_active` | No | `1`, `true`, `on`, or `yes` enables; default `1`; other values disable |
| `photo` | Create: yes; update: no | JPG, PNG, WebP, or GIF, up to 4 MiB |

Update submits the full member form and preserves the existing photo if a replacement is omitted. Reserved slug names are listed in `team/team_helpers.php`. Duplicate slugs return `409`; invalid fields return `422`; updating an unknown member returns `404`.

`POST SITE/api/admin/team/delete_member.php` accepts JSON `{ "id": 3 }` and returns `200` with `status` and `message`. Missing members return `404`. Property agent relations are configured to become null when a team member is deleted.

## Testimonials

The frontend uses `SITE/api/testimonials`; direct PHP equivalents are `GET BACKEND/testimonials/get_testimonials.php` and `POST BACKEND/testimonials/submit_testimonial.php`.

### Read approved testimonials

`GET SITE/api/testimonials` returns `200` and at most 500 approved items in `data`. Items contain integer `id`, `name`, `client_type`, integer `rating`, `quote`, and `created_at`. Email and moderation fields are excluded. Sorted by review/creation time descending. The Next.js GET handler does not forward query parameters.

### Submit a testimonial

`POST SITE/api/testimonials` — public, JSON, up to 12 KiB.

```json
{
  "name": "Jordan Example",
  "email": "jordan@example.com",
  "client_type": "Buyer",
  "rating": 5,
  "quote": "The team helped us find a wonderful home and guided us through every step.",
  "consent": true,
  "website": ""
}
```

Name: 2–150 characters. Email: valid, up to 254 characters. Quote: 30–2,000 characters. Rating: integer 1–5. `client_type`: `Buyer`, `Seller`, `Buyer & Seller`, `Investor`, or `Other`. Consent must be boolean `true`.

`website` is an optional honeypot field; keep it empty. A nonempty value is silently accepted without storing the testimonial. Normal success is `201` with `status` and a review message. Submissions are saved as `pending`; they become public after approval. Another submission with the same email within ten minutes returns `429`.

### Admin moderation

| Method | Path on `SITE` | Contract |
| --- | --- | --- |
| GET | `/api/admin/testimonials/get_admin_testimonials.php` | Up to 500 items in `data`; includes email and moderation fields |
| POST | `/api/admin/testimonials/update_testimonial_status.php` | JSON `{ "id": 7, "status": "approved" }` |

Admin items add `email`, `status` (`pending`, `approved`, `declined`), `consented_at`, nullable `reviewed_at`, and `updated_at`. Review accepts only `approved` or `declined`, returns `200` with `status` and `message`, and records reviewer/time. An invalid ID/status returns `422`; a missing testimonial returns `404`.

## Website content

Allowed `page_key` values: `buywithus`, `listwithus`, `homevaluation`, `homehero`, `homepagecards`.

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | `BACKEND/content/get_content.php` | Query `page_key` | `200`, record or null in `data` |
| GET | `SITE/api/admin/content/get_admin_content.php` | Query `page_key` | `200`, record or null in `data` |
| POST | `SITE/api/admin/content/update_content.php` | JSON `page_key`, complete `content` object | `200`, saved record in `data` |
| POST | `SITE/api/admin/content/upload_image.php` | Multipart `page_key`, `image` | `201`, `{ "image": "<filename>" }` in `data` |

All `SITE/api/admin` paths require the admin cookie. A saved record has:

```json
{
  "page_key": "homehero",
  "content": {
    "slides": [{ "image": "/example-hero.jpg", "alt": "Example home", "location": "Boston, MA" }]
  },
  "updated_at": "2026-10-09 12:00:00"
}
```

`data: null` means there is no saved override; the frontend uses defaults. Invalid page keys/content return `422`. Content update has a maximum JSON size of 250,000 bytes and replaces the complete content object. Removed uploaded image references may be deleted from disk.

Images accept HTTP(S) URLs, site-relative image paths beginning with a single `/`, or generated `page_content_...` filenames, optionally prefixed with `uploads/`. Image uploads accept JPG, PNG, WebP, and GIF up to 4 MiB. Uploading an image does not publish it; submit its returned filename in a content update.

### `homehero` schema

```json
{
  "slides": [
    { "image": "/example-hero.jpg", "alt": "Example home", "location": "Boston, MA" }
  ]
}
```

Requires 1–8 slides. Each requires `image` (up to 2,048 characters), `alt` (250), and `location` (120).

### `homepagecards` schema

```json
{
  "cards": [
    { "id": "buy", "image": "/buy.jpg" },
    { "id": "list", "image": "/list.jpg" },
    { "id": "valuation", "image": "/valuation.jpg" },
    { "id": "contact", "image": "/contact.jpg" }
  ]
}
```

Requires exactly four cards with these IDs in this order. Every image is required and has the same 2,048-character/path validation.

### `buywithus` and `listwithus` schema

Top-level required strings: `eyebrow` (80), `contactTitle` (150), `contactText` (500), `contactButtonLabel` (80), `contactButtonHref` (255). The contact link must be a site-relative path beginning with `/`.

Requires exactly six `steps`, in order, with integer `id` values 1–6. Each step has:

| Field | Maximum / rule |
| --- | --- |
| `id` | Integer corresponding to its position |
| `navLabel` | Required string, 80 characters |
| `icon` | `search`, `user`, `home`, `dollar-sign`, `truck`, `clipboard-list`, `handshake`, or `file-edit` |
| `stepLabel` | Required string, 80 characters |
| `title` | Required string, 180 characters |
| `image` | Required validated image reference, 2,048 characters |
| `body` | Required string, 30,000 characters |

Use the complete default objects in `lib/page-content.ts` as templates when no override exists.

### `homevaluation` schema

All fields below are required; string lengths are maxima.

| Fields | Contract |
| --- | --- |
| `image` | Validated image reference, 2,048 characters |
| `imageAlt` | 250 characters |
| `title`, `successTitle` | 180 characters each |
| `addressPlaceholder`, `zipPlaceholder`, `propertyTypeLabel`, `bedroomsLabel`, `bathroomsLabel`, `namePlaceholder`, `emailPlaceholder`, `phonePlaceholder`, `submitButtonLabel`, `privacyPolicyLabel` | 100 characters each |
| `propertyTypePlaceholder` | 120 characters |
| `propertyTypes` | 1–20 unique nonempty strings, up to 100 characters each |
| `roomOptions` | 1–10 unique nonempty strings, up to 20 characters each |
| `consentText`, `privacyText`, `footerDisclosure` | 3,000 characters each |
| `privacyPolicyHref` | Up to 2,048 characters; `#`, site path, or HTTP(S) URL |
| `successText` | 1,000 characters |

Option duplicates are checked without case sensitivity. A complete frontend template is in `lib/home-valuation-content.ts`.

## Email settings

These settings require both an admin session and a separate password confirmation.

1. `POST SITE/api/admin/mail-settings/unlock` with `{ "password": "<current admin password>" }`.
2. Preserve the `keynova_mail_settings_access` HTTP-only cookie, valid for at most ten minutes.
3. Read or update recipient settings through the endpoints below.
4. `POST SITE/api/admin/mail-settings/lock` clears that cookie.

Unlock success: `{ "status": "success", "message": "Email settings unlocked." }`. The body must have a declared length of at most 2,048 bytes. A wrong password returns `401`; repeated incorrect confirmations can return `429` with `retry_after` seconds and a 15-minute lockout. Lock clears the local cookie and does not explicitly revoke an issued backend mail-access token.

### Read recipients

`GET SITE/api/admin/settings/get_mail_settings.php`:

```json
{
  "status": "success",
  "data": {
    "contact_recipients": ["contact@example.com"],
    "property_recipients": ["property@example.com"]
  }
}
```

### Update recipients

`POST SITE/api/admin/settings/update_mail_settings.php` with:

```json
{
  "contact_recipients": ["contact@example.com"],
  "property_recipients": ["property@example.com", "management@example.com"]
}
```

Both arrays are required and must contain 1–5 valid, distinct email addresses. Addresses are trimmed/lowercased; each has at most 254 bytes. Maximum declared request length is 16 KiB. Success is `200` with `status`, `message: "Email recipients updated."`, and the saved arrays in `data`.

Locked/expired mail access returns `403`:

```json
{
  "status": "error",
  "code": "verification_required",
  "message": "Enter your admin password to access email settings."
}
```

The expiry message can differ. Before recipient settings are saved, the backend falls back to its environment/admin/management recipient configuration. These endpoints configure recipients, not SMTP credentials.

For direct server-to-server PHP usage, `POST BACKEND/settings/unlock_mail_settings.php` requires the admin bearer token and returns `access_token` plus `expires_in: 600`. Send both `Authorization: Bearer <admin token>` and `X-KeyNova-Mail-Access: Bearer <mail token>` to the PHP settings endpoints. The Next.js proxy adds these headers automatically from its cookies.

## Additional backend endpoints

These exist in the companion backend but are not part of the current Next.js UI's main API flow.

### Agent search actions

`POST BACKEND/agent/actions.php` — JSON, at most 32 KiB. This uses a separate agent-search account and token, scoped to an active agent. Its token is not interchangeable with a `/user/` visitor token. Agent-search tokens last 30 days.

| `action` | Authentication | Additional fields | Success |
| --- | --- | --- | --- |
| `register` | Public | `agent_slug`, `name`, `email`, `phone`, `password`, `consent: true` | `201`, `token`, `user`, empty `saved_property_ids`, `notification_sent` |
| `login` | Public | `agent_slug`, `email`, `password` | `200`, `token`, `user`, `saved_property_ids`, `notification_sent` |
| `session` | Agent-search bearer token | None | `200`, `user`, `agent_slug`, `saved_property_ids` |
| `search` | Agent-search bearer token | Optional `query` | `201`, `notification_sent`; records activity |
| `save` | Agent-search bearer token | `property_id`, boolean `save` | `200`, `saved_property_ids`, `notification_sent` |

Registration limits: `agent_slug` 63 characters, `name` 150, `email` 254, `phone` 40, and password 8–128. Its phone validation accepts permitted phone characters with a total length of 7–40; it does not enforce the main visitor API's ten-digit rule. `query` is up to 255 characters and defaults to `All available homes`. Response `user` contains name and email.

Saving is restricted to listing-published properties belonging to the account's agent. Duplicate registration returns `409`, incorrect login returns `401`, unavailable properties return `404`, and unsupported actions return `422` after authentication. The current `AgentSearchLanding.tsx` uses the main visitor profile/saved-home endpoints instead.

### Compatibility and maintenance

- `GET BACKEND/property/get_inquiries.php` is a compatibility alias for `contact/get_contacts.php` and requires an admin bearer token. It is not on the Next.js admin allowlist.
- `BACKEND/property/geocode_properties.php` is a one-time maintenance script for filling missing coordinates. It requires its configured query token and returns plain text. It is not on the Next.js allowlist and is not a normal application integration endpoint.
- PHP helper files, schema files, `db.php`, environment loaders, and notification functions are internal implementation files rather than supported API contracts.

## Upload limits and errors

### Size limits

MiB/KiB below mean powers of 1,024. PHP server configuration can impose additional limits.

| Request / file | Implemented limit |
| --- | --- |
| Next.js admin proxy | Declared body length at most 4.25 MiB (4,456,448 bytes) |
| Admin login | Declared body length at most 4,096 bytes |
| Email-settings unlock | 2,048 bytes |
| Testimonials | 12 KiB |
| Visitor/property-access JSON | 16 KiB |
| Email settings update | 16 KiB |
| Contact, property inquiry, valuation, agent actions JSON | 32 KiB |
| Website content JSON update | 250,000 bytes |
| Team photo / page content image | 4 MiB per image |
| Team thumbnail source | 4 MiB |
| Property image in current admin UI | 4 MiB per file; multipart request must also fit the proxy limit |
| Visitor profile image | 5 MiB; sent directly to PHP |
| Chunked property document | 10 MiB overall; 2 MiB per chunk; up to 10 chunks |

The property image handlers accept supported extensions but do not themselves enforce the UI's 4 MiB file limit. The proxy's length checks rely on `Content-Length`; testimonials additionally measure the received body. Backend JSON parsers and upload handlers have their own checks. Successful property creation does not prove that every supplied attachment was stored.

Admin requests have a 55-second backend timeout. Login, mail unlock, and testimonials use ten seconds; team thumbnail fetching uses eight seconds.

### HTTP status meanings

| Status | Meaning in this project |
| --- | --- |
| `200` | Read/update/delete success; also some legacy PHP errors, so inspect JSON |
| `201` | Created property/member/lead/profile/testimonial, uploaded content image, or recorded agent search |
| `400` | Malformed/missing body or invalid chunk data |
| `401` | Missing/invalid/expired credentials or incorrect login/confirmation |
| `403` | Invalid Next.js request origin or locked mail settings |
| `404` | Missing record/file or unlisted admin route |
| `405` | Unsupported method where enforced |
| `409` | Duplicate slug/email/account or missing upload chunks |
| `410` | Expired verification code or profile setup token |
| `413` | Request/image too large |
| `415` | JSON content type required |
| `422` | Field or business-rule validation failed |
| `429` | Submission/confirmation/sign-in rate limit or temporary lockout |
| `500` | Backend/database/file processing failure |
| `502` | Proxy/backend/mail/thumbnail service failure |
| `503` | Thumbnail API base is not configured |

## Request examples

### Admin login and reads in PowerShell

Run with the Next.js server and PHP backend available. Replace the placeholder credentials.

```powershell
$siteBase = 'http://localhost:3000'
$adminBody = @{ email = 'admin@example.com'; password = '<admin password>' } | ConvertTo-Json

Invoke-RestMethod -Uri "$siteBase/api/auth/login" -Method Post -ContentType 'application/json' -Body $adminBody -SessionVariable keynovaAdminSession
Invoke-RestMethod -Uri "$siteBase/api/auth/session" -WebSession $keynovaAdminSession
Invoke-RestMethod -Uri "$siteBase/api/admin/property/get_properties.php?destination=all" -WebSession $keynovaAdminSession
```

Unlock and read mail settings using the same session:

```powershell
$unlockBody = @{ password = '<admin password>' } | ConvertTo-Json
Invoke-RestMethod -Uri "$siteBase/api/admin/mail-settings/unlock" -Method Post -ContentType 'application/json' -Body $unlockBody -WebSession $keynovaAdminSession
Invoke-RestMethod -Uri "$siteBase/api/admin/settings/get_mail_settings.php" -WebSession $keynovaAdminSession
```

Log out:

```powershell
Invoke-RestMethod -Uri "$siteBase/api/auth/logout" -Method Post -WebSession $keynovaAdminSession
```

### Public property list and visitor login in PowerShell

```powershell
$backendBase = 'http://localhost/keynova'
Invoke-RestMethod -Uri "$backendBase/property/get_properties.php?destination=listing"

$visitorBody = @{ email = 'jordan@example.com'; password = '<visitor password>' } | ConvertTo-Json
$visitorLogin = Invoke-RestMethod -Uri "$backendBase/user/visitor_login.php" -Method Post -ContentType 'application/json' -Body $visitorBody
$visitorHeaders = @{ Authorization = "Bearer $($visitorLogin.access_token)" }

Invoke-RestMethod -Uri "$backendBase/user/visitor_profile.php" -Headers $visitorHeaders
Invoke-RestMethod -Uri "$backendBase/property/get_property.php?id=12&source=profile" -Headers $visitorHeaders
```

### Create a property with curl

The following shell example uses a previously obtained backend admin token. On Windows, invoke `curl.exe` and put the command on one line, or use your shell's line-continuation syntax.

```bash
curl 'http://localhost/keynova/property/create_property.php' \
  -H 'Authorization: Bearer <backend admin token>' \
  -F 'title=Example Residence' \
  -F 'address=100 Example Street, Boston, MA' \
  -F 'price=2450000' \
  -F 'show_on_listing=1' \
  -F 'show_off_market=0' \
  -F 'images[]=@./home.jpg'
```

For a browser using an admin cookie, send the same `FormData` to the Next.js route:

```javascript
const form = new FormData();
form.set('title', 'Example Residence');
form.set('address', '100 Example Street, Boston, MA');
form.set('price', '2450000');
form.set('show_on_listing', '1');
form.set('show_off_market', '0');

const response = await fetch('/api/admin/property/create_property.php', {
  method: 'POST',
  body: form,
});
const result = await response.json();
if (!response.ok || result.status !== 'success') {
  throw new Error(result.message || 'Property creation failed.');
}
```

### Download a document with curl

```bash
curl 'http://localhost/keynova/property/download_document.php' \
  -H 'Authorization: Bearer <visitor token>' \
  --data-urlencode 'property_id=12' \
  --data-urlencode 'document_file=doc_12_example.pdf' \
  --data-urlencode 'source=profile' \
  --output offering-memorandum.pdf
```

Check the response status/content type when integrating downloads; an error body is JSON instead of a document.

## Source files

Next.js contracts and clients:

- [`app/api`](app/api): all Next.js route handlers.
- [`lib/auth/session.ts`](lib/auth/session.ts): admin cookie encryption and lifetime.
- [`lib/auth/backend.ts`](lib/auth/backend.ts): backend URL configuration.
- [`lib/auth/mail-settings-access.ts`](lib/auth/mail-settings-access.ts): mail-access cookie.
- [`lib/visitor-account.ts`](lib/visitor-account.ts): visitor account calls and response types.
- [`lib/property-access.ts`](lib/property-access.ts): visitor session storage and sharing.
- [`lib/property-data.ts`](lib/property-data.ts): property calls and frontend normalization.
- [`app/admin/dashboard/properties/PropertiesAdminClient.tsx`](app/admin/dashboard/properties/PropertiesAdminClient.tsx): multipart and sequential chunk uploads.
- [`lib/page-content.ts`](lib/page-content.ts), [`lib/home-valuation-content.ts`](lib/home-valuation-content.ts): editable content templates.

Companion PHP contracts are in the `admin`, `property`, `user`, `contact`, `valuation`, `team`, `testimonials`, `content`, `settings`, and `agent` directories under `C:\xampp\htdocs\keynova`. Endpoint-specific helper files define validation, authentication, schema preparation, and response shapes.
