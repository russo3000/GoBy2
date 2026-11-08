# Goby

Goby helps people discover places through friends’ personal recommendations,
thank friends after a visit, and vote on places for a shared day out.

This is the Expo + React Native + TypeScript implementation. The current slice
is **My places → add a place → place detail**, using native components and local
SQLite storage. The v0.41 HTML prototype guides its branding and interaction design.

## What works

- Native stack navigation and bottom tabs; day/night themes remembered locally.
- Personal lists and horizontally scrolling place shelves with touch and arrow controls.
- Add a place with a name, optional city, personal tip, and optional device photo.
- Create a named list while saving, or use “Places to keep”.
- Search names, cities, lists, and tips. Open place details, edit, and find in maps.
- Offline saves, persistent photo copies, and migration of the original guest notebook.

Discover and Plans have explicit coming-soon screens. Auth, friends, sharing,
visits/thanks, voting, Storage, and PowerSync are not connected. Guest saves stay
on this device; they are not synced or backed up. No sample friends or votes are
presented as live data. Do not use the guest database as an account cache.

## Development

Use Node 24 and npm:

```sh
npm ci
npm start
```

Open on a device with a compatible Expo client or a development build.
`npm run android` needs an Android emulator/device. `npm run ios` requires macOS
and Xcode. The app requests the system photo picker only when the user chooses
it; it does not request location or camera access.

`npm run web` starts a browser preview. Saving, lists, search, themes, and details
work there using SQLite WebAssembly; photo picking is available only on native
platforms. Metro config supplies the WebAssembly asset configuration and isolation
headers required by SQLite. A separately hosted web export would also need
Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.
Browser preview data is separate from device data.

## Validation

```sh
npm run typecheck
npm test
```

Storage tests use a real SQLite engine, including upgrade preservation, foreign
keys, validation, editing, settings, and reopening a database from disk.

With `npm run web` already running on port 8081, run:

```sh
npx playwright install chromium
npm run test:browser
```

An existing Chromium can be selected using `CHROMIUM_PATH=/path/to/chromium`.
`GOBY_TEST_URL` overrides the preview URL. The browser smoke test checks create
list/save/detail/edit/search, theme and data persistence, and saving offline.
It uses a fresh browser context. Physical-device checks are still needed for
photo picking/copying, keyboard layout, safe areas, and native back/swipe gestures.

## References

- [Architecture and privacy plan](docs/architecture.md)
- [Prototype-to-native screen mapping](docs/prototype-v0.41.md)
- [Manual device checks](docs/device-checks.md)
