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

Protected cutover completed 2026-10-02. Both writers were gated during final sync: the old backend was stopped, the new backend temporarily ran a maintenance command through Coolify. Final pg_dump restored transactionally; all 8 table fingerprints, sequences and Alembic revision matched: 2 users, 7 calls, 4 scripts. Old backend remains stopped; old DB/volumes are retained.

Only A record `support.larin.work` changed to `38.45.65.134`; API readback and all four authoritative DNS verified, unrelated records unchanged. ACME was enabled after authoritative propagation. Normal public DNS and trusted HTTPS are accepted: frontend/assets, health, existing-user JWT `/auth/me`, calls and Q&A search all passed. This is not a password-login test. Native push delivery is verified (`is_webhook=true`, expected SHA, finished, running:healthy).

Credentials are retained in Bitwarden Secrets Manager as `SUPPORT_PANEL_PROD_POSTGRES_PASSWORD`, `SUPPORT_PANEL_PROD_SECRET_KEY`, `SUPPORT_PANEL_PROD_DATABASE_URL`; Q&A password uses existing `QNA_PROD_PORTAL_PASSWORD`. Secret values are not in source. Final backup is retained on both VPS, matching SHA256 `96228d47ed0b46f9989ccd844fb917eab64878d887b29af46e87824d43fb7bab`.

## Protected cutover procedure (future migrations require approval)

1. Pause writes by stopping only the old Support Panel backend; preserve PostgreSQL and old volumes.
2. Obtain a final pg_dump and table fingerprints while the old writer is stopped.
3. Gate new writes and replace the destination snapshot; verify all tables and Alembic revision.
4. Change only the `support.larin.work` A record from `107.174.26.138` to `38.45.65.134`; verify API readback and authoritative DNS.
5. Enable `letsencrypt` resolver labels on both HTTPS routers via a reviewed Git push/Coolify deployment.
6. Verify public trusted TLS, frontend, API, authorization and Q&A search. Observe before declaring completed.

Rollback before new production writes: restore old DNS and restart the old backend. After new writes, do NOT restart the old writer against its stale DB; reconcile/restore newest data first.
