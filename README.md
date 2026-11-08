# Goby

Native iOS and Android starter using Expo, React Native, and TypeScript.
Goby helps people discover places through friends’ personal recommendations,
thank friends after a visit, and vote on places for a shared day out.

The first slice is a local guest notebook: places and personal tips persist in SQLite
across restarts and can be saved without a network connection.

## Development

Use Node 24 and npm. Install with `npm ci`, then run `npm start` and open the
project on an iOS or Android device using the compatible Expo client or a
development build. `npm run android` requires an Android emulator/device;
`npm run ios` requires macOS and Xcode. Run `npm run typecheck` and `npm test` before changes
are reviewed. The storage test uses Node’s SQLite engine; device testing is still
needed to validate native lifecycle and keyboard behavior. Web is not currently a supported target for the SQLite notebook.

## Current boundaries

No Supabase project or PowerSync service has been configured. Guest saves stay
on this device; they are not backed up or synced. Auth, sharing, plans, voting,
and Storage are not implemented. Do not treat the guest database as an
account cache. See [the architecture plan](docs/architecture.md) for the next steps.

The supplied HTML v0.41 prototype is mapped in
[the native screen reference](docs/prototype-v0.41.md). It is the visual and
interaction reference for the next UI slice. Shared-data privacy decisions
remain open.
