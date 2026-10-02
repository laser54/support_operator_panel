# Support Panel production on Coolify

Existing production migration, no invented DEV. Resource `pt4yigwrdmzcjuvokw4c0xce`, host `38.45.65.134`, GitHub App source `laser54/support_operator_panel/main`.

## Deployment

- Raw Compose `/docker-compose.coolify.yml`, repository preserved, no host ports.
- Coolify creates runtime `.env`; DATABASE_URL must use `support-panel-db:5432/support_panel` and the same password as POSTGRES_PASSWORD.
- Runtime-only secrets: DATABASE_URL, POSTGRES_PASSWORD, SECRET_KEY, KNOWLEDGE_BASE_PASSWORD. No build arguments containing secrets.
- The frontend receives no secrets. DB blanks application credentials; backend blanks POSTGRES_PASSWORD. Review this deny-list whenever variables are added.
- Native GitHub App pushes deploy production. GitHub Actions validates only; no legacy SSH deployment.
- Runtime starts the installed venv directly; httpx is a production dependency. Outbound Q&A TLS is verified.
- PostgreSQL pinned to the legacy 16.11 image digest. Persistent volume name must be discovered from the running DB mount, not guessed.
- No automatic Alembic upgrades. Expected existing head: `f4c1502b9e15`.

## Migration status / acceptance

Initial pg_dump restored transactionally into the empty destination database. All 8 table row counts and ordered-row fingerprints match the initial old-VPS snapshot: 2 users, 7 calls, 4 scripts. Existing-user JWT `/auth/me` and trusted-TLS Q&A login/search passed. This is not a password-login test.

DNS is still on the old VPS. New routing has only been tested with forced address and certificate verification disabled because ACME is intentionally disabled before cutover. Trusted public TLS is NOT yet accepted.

## Protected cutover (requires separate approval)

1. Pause writes by stopping only the old Support Panel backend; preserve PostgreSQL and old volumes.
2. Obtain a final pg_dump and table fingerprints while the old writer is stopped.
3. Gate new writes and replace the destination snapshot; verify all tables and Alembic revision.
4. Change only the `support.larin.work` A record from `107.174.26.138` to `38.45.65.134`; verify API readback and authoritative DNS.
5. Enable `letsencrypt` resolver labels on both HTTPS routers via a reviewed Git push/Coolify deployment.
6. Verify public trusted TLS, frontend, API, authorization and Q&A search. Observe before declaring completed.

Rollback before new production writes: restore old DNS and restart the old backend. After new writes, do NOT restart the old writer against its stale DB; reconcile/restore newest data first.
