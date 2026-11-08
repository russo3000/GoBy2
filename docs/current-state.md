# Verified development baseline — 8 November 2026

Code baseline: `c6cc5f3` on `review/my-places` in `russo3000/GoBy2`.
Remote refs checked during this audit: main is `f15e508`; review/my-places is
`c6cc5f3`. The fuller My places implementation is not merged into main.

## Implemented

Expo SDK 58, React Native 0.88.1, React 19.3, and TypeScript. Native components
with React Navigation; SQLite guest database `goby-guest.db`.

My places includes named lists, horizontal shelves, search, capture/edit with
optional city/tip, place detail, theme preference, external map search, and
native photo selection/copying. The browser photo picker is deliberately disabled.
Old notebook migration is implemented. Discover and Plans are placeholder screens.

No Supabase or PowerSync packages, migrations, service configuration, or connections
are present. Authentication, real friend relationships, audience enforcement,
shared recommendations, plans/voting, visits/thanks, and account sync are not
implemented. Architecture notes describe a direction and open decisions, not
working production permissions. No decision IDs were available for this audit.

## Verified during this audit

- `npm run typecheck`: passed.
- `npm test`: four tests passed, covering SQLite saves/upgrades/reopening and the
  named-project gateway.
- `CHROMIUM_PATH=/usr/bin/chromium GOBY_TEST_URL=http://localhost/Goby2/ npm run test:browser`:
  passed in cloud Chromium. Checks list creation, save/detail/edit/search,
  theme/data persistence, offline save, shelf arrows, and tab placeholders.
- `npx expo export --platform android`: completed. This creates a JavaScript
  bundle, not an APK, and does not establish successful Android execution.
- Cloud gateway `/Goby2/` and Expo server returned HTTP 200. These are cloud
  processes, not evidence of processes running on Igar's Mac.

## Remaining verification and limitations

Igar has since confirmed physical Android execution through Expo Go and completed
core manual checks: save/edit, restart persistence, photos and photo restart
persistence, offline save/open, Android Back, keyboard/form scrolling, search,
lists, shelves, themes, Maps, photo controls, and placeholder tabs. The Mac browser
at http://localhost/Goby2/ also opens and is interactive, reported by Igar.
See device-checks.md for evidence boundaries and the detailed results.

Larger-text testing was skipped at Igar's request. TalkBack, detailed safe areas,
offline cold startup without Metro, native upgrade migration, and error paths
remain unverified. Device/OS/Expo Go versions were not captured. Earlier iOS
bundle exports passed, but no iOS device run is evidenced.
No standalone Android/iOS build or store release is evidenced. No EAS configuration
or distributable APK/AAB/IPA is present.

Guest saves are local only. Browser and phone do not sync; localhost and
localhost:8081 use separate browser storage origins. Replaced photos can leave
unreferenced local files. No backend privacy enforcement should be inferred from
this guest-only implementation.

## Sources and coordination

Inspected package/app config, app screens, SQLite data functions, README,
architecture/prototype/device notes, tests, remote Git refs, and runtime responses.
The accessible uploaded reference is `Goby-phone-preview-v0.41 (1).html`.
No native-source/build-kit ZIPs were found in the accessible workspace.
Drive searches did not locate “Goby — Current Brief”. Request a direct link or
attachment before treating requirements in that record as known. No other chat's
messages or files are assumed accessible.

## Mac launch sequence

First verify the browser, then start Expo in a second Terminal. The Mac previously
used nvm Node 26.13.0 successfully; Node 24 is the documented development baseline.
The old Homebrew Apache service previously occupied port 80 and was stopped.
Igar confirmed `/Goby2/` working and subsequently launched Goby on Android via
Expo Go. Processes still need to be started again after their Terminals close. Do not change Apache aliases to fix the Node gateway.

Browser Terminal, assuming the previously successful dist build still exists:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use 26
cd ~/Downloads/Goby-review
sudo "$(command -v node)" scripts/review-server.cjs
```

Open http://localhost/Goby2/ and keep that Terminal running. The static gateway
requires elevated permission for port 80 on this Mac. npm installs/builds must
run under the normal user. Rebuild with `npm run review:build` when needed.

Only after browser confirmation, in another Terminal:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use 26
cd ~/Downloads/Goby-review
npm start
```

Connect Android and Mac to the same Wi-Fi; open a compatible Expo Go and scan
the current QR from its scanner. Igar confirmed this launch works on his Android
phone in this session. Recheck client compatibility if Expo Go or the SDK changes.
