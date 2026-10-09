
- Case study migration choice feature is self-contained (migration_settings, migration_choices, migration_attempts; edge functions migration-choice and migration-admin; pages /choose/:code, /choose/privacy, /admin/migration-choice) — it only records answers and must never delete or move data.
- Migration invitation counts are read at send time from profiling photos, client session images and case-study attachments; fail the individual send on count-read errors rather than misrepresent missing data as zero.
- Migration email HTML formatting lives in a pure shared helper, separate from database access, so presentation can be tested without sending emails or changing stored wording.
- Migration choice behaviour keys off `choice_key` (keep_all | keep_account | delete_all), never the option number; numbers are display-only via settings `option{n}_key` — so wording can be reordered without flipping stored answers.
