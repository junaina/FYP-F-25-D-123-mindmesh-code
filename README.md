feat(docs-api): project-scoped DocHeader endpoints + options CRUD (read/write)

✅ What’s working

- Project-scoped routes:
  - GET /api/projects/:projectId/docs/:docId → fetch DocHeader (id, projectId, title, description, created/updated, doc-scoped property defs with options)
  - PATCH /api/projects/:projectId/docs/:docId → update DocHeader title/description and upsert property _values_
  - PUT /api/projects/:projectId/docs/:docId/properties/:propertyId/options → upsert options for a property
  - GET /api/projects/:projectId/docs/:docId/properties/:propertyId/options → read options for a property
- DTOs with Zod for strict validation (no `any`): params, header patch body, property values, option payloads.
- Next 15 param handling: `params` awaited before parsing (fixes “params should be awaited”).
- Service/Repo layers:
  - `DocumentService`: `getHeader`, `patchHeader`, `savePropertyOptions`, `readPropertyOptions`
  - `DocumentRepo`: header read, basics update, def lookup/create, link ensure/remove, value upsert, options upsert/read (transactional), cross-project guard.
- Prisma shapes mapped correctly:
  - Value mapping to `valueString | valueNumber | valueBool | valueDate | valueJson | optionId`
  - Options ordered by `position, value`; colors nullable; position normalized.
- Client helpers updated (`docs.api.ts`) to hit project-scoped endpoints.

🧭 Design choices

- Properties/options are **project-scoped**; documents reference definitions via links.
- Value upserts are per-doc/per-property; options are upserted with soft delete of removed rows.

🧩 Still to implement (next passes)

- Properties collection endpoints (project-scoped under a doc):
  - GET /api/projects/:projectId/docs/:docId/properties → list linked properties (+options)
  - POST /api/projects/:projectId/docs/:docId/properties → create & link a property (name, type, initial options)
  - PATCH/DELETE /api/projects/:projectId/docs/:docId/properties/:propertyId → rename/change type (⚠ reset incompatible values), unlink/delete
- Options single-item ops (optional sugar on top of bulk PUT):
  - PATCH/DELETE /…/properties/:propertyId/options/:optionId → rename/recolor/remove one
  - PATCH /…/properties/:propertyId/options/reorder → reorder by positions
- Stronger error mapping (Prisma unique/foreign-key → 409/422 with field hints).
- Auth/permissions checks.
- Unit/integration tests (DTOs, service, repo), seed data, and OpenAPI/README.

Refs: project scoping, Next 15 params, Prisma transactions.
