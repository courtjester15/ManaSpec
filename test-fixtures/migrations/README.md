# Migration Fixture Policy

These small tracked fixtures protect the data-schema boundary. They contain synthetic data only.

For every future `dataSchemaVersion` change:

- Keep one immutable source fixture for every supported prior version.
- Add the exact expected migrated output.
- Verify migration idempotence and backup export/import round trips.
- Preserve unknown fields unless the migration explicitly owns them.
- Include malformed and future-version rejection cases.
- Never update an old source fixture to match new code; add a new fixture instead.

Normal load adapters are not migrations and must not rewrite these fixtures or browser storage.

Current coverage:

- `legacy-unversioned-v1.json` and `current-v1.json` prove pre-sealed backups migrate additively.
- `current-v2-sealed.json` proves exact sealed identity and null valuation survive the current schema.
- `future-v3-rejected.json` proves unsupported future data is rejected without mutation.
- `future-v2-rejected.json` is retained as immutable history from the version-one boundary.
