# Goby development

- Repository: `russo3000/GoBy2`. The active integration baseline is
  `review/my-places`, not `main`. Fetch and inspect its latest state before work.
- Start each scoped change on a separate branch based on `review/my-places`.
  Open pull requests targeting `review/my-places`; do not merge without Igar's
  instruction. Preserve unrelated work and guest data.
- Read `README.md`, `docs/cloud-development.md`, and the relevant product
  requirements before implementation. Historical architecture proposals are not
  proof of implemented functionality.
- Use Node 24 and `npm ci`. `bash scripts/cloud-check.sh` installs dependencies,
  typechecks, runs the storage/server tests, and exports the web preview.
- Run the existing browser smoke test when the executor supports Chromium and
  persistent local processes. Report a concrete blocker if it cannot run.
- Browser tests do not establish Android behavior. Distinguish source changes,
  automated checks, browser verification, Android bundle exports, and physical
  device testing in delivery reports.
- A cloud checkout does not update the Mac checkout or an Expo Go session
  connected to the Mac. Do not say a phone reload will include a change until
  its delivery route is verified.
- Keep code and durable engineering instructions in Git. Use the existing
  product backlog for priorities; do not create a second competing backlog.
- Never commit credentials, local guest databases, node_modules, or generated
  builds. Ask for secrets only through supported secret settings, never chat.

