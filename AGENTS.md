
- Case study migration choice feature is self-contained (migration_settings, migration_choices, migration_attempts; edge functions migration-choice and migration-admin; pages /choose/:code, /choose/privacy, /admin/migration-choice) — it only records answers and must never delete or move data.
- Migration invitation counts are read at send time from profiling photos, client session images and case-study attachments; fail the individual send on count-read errors rather than misrepresent missing data as zero.
