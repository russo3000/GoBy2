# Cloud development

## Starting point

Repository: `https://github.com/russo3000/GoBy2.git`.
Integration branch: `review/my-places`. Node: 24, recorded in `.nvmrc`.
The cloud executor uses its own checkout; the founder's laptop need not run.
Only pushed commits are available to a fresh checkout. Local Mac changes and
guest data do not transfer automatically.

For a fresh environment:

```sh
git clone --single-branch --branch review/my-places https://github.com/russo3000/GoBy2.git goby
cd goby
git switch -c feature/short-description
bash scripts/cloud-check.sh
```

For an existing checkout, inspect `git status` and fetch before starting. Do not
reset or overwrite someone else's changes. Branch from the current remote
`review/my-places` head when the working tree is clean.

## Verification and browser preview

The check script installs locked dependencies, checks TypeScript, runs the
SQLite/server tests, and builds `dist/`. It does not claim browser or device
verification.

Where the executor supports persistent processes, start the compiled preview:

```sh
GOBY_REVIEW_PORT=8080 npm run review:serve
```

The executor-local URL is `http://localhost:8080/Goby2/`. In another terminal
in the same executor, run:

```sh
CHROMIUM_PATH=/usr/bin/chromium GOBY_TEST_URL=http://localhost:8080/Goby2/ npm run test:browser
```

Use the executor's installed compatible Chromium, or provision Playwright's
browser through its supported installation mechanism. Leave CHROMIUM_PATH unset
when using Playwright's own browser. Rebuild after source changes to update this
compiled preview. The gateway sends the isolation headers required by SQLite WASM.

This localhost address is not a phone-accessible URL. A public preview needs a
separate hosting/forwarding configuration with HTTPS and the required isolation
headers. Do not expose a source directory or credentials to create a preview.

## Delivery

Commit the scoped change to its feature branch and open a pull request targeting
`review/my-places`. Include the starting commit, changes, checks actually run,
remaining limitations, and how Igar can review the result. Use the authenticated
GitHub connector to publish changes if the executor has read-only Git transport.
Inspect the target branch for concurrent changes before integrating.

The GitHub record is durable; the cloud checkout and running processes may be
temporary. This file does not create or publish a reusable Codex environment.
Where environment settings are available, configure this repository and branch,
Node 24, package-registry access, and the verification command above.

## Android testing remains a separate delivery step

The current app uses Expo Go from a Mac-hosted Metro server. Updating GitHub
does not update that server's checkout. Laptop-independent phone testing needs a
separately configured cloud preview/dev-server route or an installed development
or preview build with an appropriate delivery mechanism.

No Expo/EAS project, signing setup, update channel, or Android build service was
configured in this setup. An Android JavaScript export is not an installable APK.
Do not uninstall the existing app or clear its data to test cloud delivery;
guest saves currently have no backup.

## Setup verification — 10 November 2026

Baseline inspected: `ee3e0d1d192c792d253ee2b682b229c7012bc001`.
Node 24.22.1: dependency install, TypeScript, all six automated tests, and the web
export passed in the cloud. The browser smoke test was attempted but Chromium
could not launch: `socket() failed: Operation not permitted`. Browser and Android
execution were not verified in this setup session. No externally reachable
preview or reusable environment was published.
