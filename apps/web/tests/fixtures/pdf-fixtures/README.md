# Blood-work PDF fixtures

This folder is the drop-zone for the two PDF fixtures referenced by
`blood-work.spec.ts`:

- `text-blood-work.pdf` — text-layer PDF (LifeLabs-style table)
- `scanned-blood-work.pdf` — image-only PDF that exercises the vision fallback

Both PDFs should encode the biomarkers listed in `expected-biomarkers.ts`.

The PDFs are **not committed** — generate them locally with:

```bash
pnpm --filter @triveda/web exec tsx tests/fixtures/pdf-fixtures/generate.ts
```

The generator relies on `pdf-lib` (already a devDependency of `@triveda/api`)
and is idempotent. Specs that can't find the PDFs at runtime skip with a clear
message rather than failing the suite.
