# Phase 0 · Task 1 — Live Assumptions Check

Snapshot: 2026-07-21 (UTC).

---

## 1. Auth method — ✅ PASS

`auth.identities` grouped by provider:

| provider | count |
|----------|-------|
| email    | 150   |

Only `email` provider present. No `google`, `discord`, or other external OAuth identities. Auth-migration plan can assume pure email/password.

---

## 2. Subscriptions — 🚩 **FLAG**

`public.subscriptions` is **not empty**. 148 rows total.

| tier   | status | count |
|--------|--------|-------|
| wren   | active | 139   |
| falcon | active | **9** |

- **Wren (139)** = free volunteer/case-study tier — no billing, safe to ignore for a paid-migration view.
- **Falcon (9)** = **paid tier, all `active`**. These are real Stripe subscribers.

⚠️ Migration plan must account for the 9 active Falcon subscribers (Stripe customer IDs, `stripe_subscription_id` linkage, and continuity of billing). Recommend pulling their Stripe customer/subscription IDs before any auth/data cutover so portal + webhook mapping isn't broken.

Query to enumerate them:
```sql
SELECT user_id, tier, status, stripe_subscription_id, current_period_end
FROM public.subscriptions WHERE tier = 'falcon' AND status = 'active';
```

---

## 3. User population — ✅ PASS (with notes)

| metric              | count |
|---------------------|-------|
| `auth.users`        | 150   |
| `public.profiles`   | 150   |
| Users with any role | 147   |
| Users with **no** role row | **3** |

Role breakdown (distinct users per role — users may hold multiple):

| role         | users |
|--------------|-------|
| client       | 140   |
| practitioner | 9     |
| trainer      | 1     |
| admin        | 1     |
| trainee      | 0     |

Collapsed (mutually exclusive priority: trainer/admin > practitioner > client):

| bucket                    | count |
|---------------------------|-------|
| practitioner / trainee    | 9     |
| trainer                   | 1     |
| admin                     | 1     |
| client-only               | 138   |
| **no role at all**        | 3     |

Case-study subject overlap: **123 distinct users** are the `subject_user_id` of a case study. These are volunteer case-study clients (majority of the `client` bucket).

Notes:
- 3 users have zero role rows — worth spot-checking before migration (likely orphans or admin-created shells).
- `auth.users` and `profiles` counts match exactly (150 = 150). The `handle_new_user` trigger is healthy.

---

## 4. Freeze check — ✅ PASS

Most-recent timestamps across the main tables:

| table                   | max created_at              | max updated_at              |
|-------------------------|-----------------------------|-----------------------------|
| auth.users              | 2026-07-10 00:11:25 UTC     | 2026-07-21 00:59:19 UTC¹    |
| profiles                | 2026-07-10 00:11:25 UTC     | 2026-07-18 09:39:52 UTC     |
| case_studies            | 2026-06-25 01:07:35 UTC     | 2026-07-18 09:39:50 UTC     |
| profiling_photos        | 2026-07-10 00:19:20 UTC²    | —                           |
| client_recordings       | 2026-03-23                  | —                           |
| client_session_images   | 2026-05-30                  | —                           |
| bookings                | 2026-03-11                  | —                           |
| client_invitations      | 2026-07-19 01:41:27 UTC     | —                           |
| training_calls          | 2026-07-20 01:31:35 UTC³    | 2026-07-20 01:31:35 UTC     |
| user_roles              | 2026-07-10 00:11:29 UTC     | —                           |
| subscriptions           | 2026-07-10 00:11:30 UTC     | 2026-07-10 00:11:30 UTC     |

¹ `auth.users.updated_at` today = admin-side edits (`admin-update-user` calls or email confirmations), no new signup. Last sign-in across the whole table = 2026-07-14.
² `profiling_photos.uploaded_at`.
³ Trainer creating training calls — not end-user content writes.

Write activity in the freeze window:

| window                              | count |
|-------------------------------------|-------|
| new auth.users last 24h             | 0     |
| new auth.users last 72h             | 0     |
| sign-ins last 24h                   | 0     |
| sign-ins last 72h                   | 0     |
| profiles updated last 24h           | 0     |
| profiles updated last 72h           | 1     |
| case_studies updated last 24h       | 0     |
| case_studies updated last 72h       | 1     |
| profiling_photos new last 24h       | 0     |
| profiling_photos new last 72h       | 0     |
| client_session_images last 24h      | 0     |
| bookings new last 24h               | 0     |

Interpretation: **live has gone quiet.** Zero new signups, zero sign-ins, zero photo uploads in the last 72h. The one profile/case-study update in the 72h window is stale trainer-side admin work, not client activity. Safe to proceed with migration snapshot.

---

## Summary

| Check                   | Result |
|-------------------------|--------|
| 1. Auth = email only    | ✅ PASS |
| 2. Zero paid subs       | 🚩 **FLAG — 9 active Falcon subscribers** |
| 3. User population known | ✅ PASS (150 users, 147 with roles, 3 role-less) |
| 4. Freeze window quiet  | ✅ PASS (no client writes in 72h) |

**Recommended next action before proceeding:** confirm handling for the 9 active Falcon Stripe subscriptions (export their `stripe_customer_id` / `stripe_subscription_id` and decide whether to migrate, pause, or notify).
