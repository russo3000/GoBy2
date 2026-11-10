# Installable Android preview

Use the EAS `preview` profile to build an internally distributed APK containing
the JavaScript bundle. This is a standalone preview, not a development client:
it should not need Metro, Expo Go, or the founder's laptop to launch.

## Identity and data

- Display name: Goby Preview.
- Android application ID: `com.russo3000.goby.preview`.
- The profile sets `APP_VARIANT=preview`; normal Expo Go/web configuration stays
  unchanged. Keep this application ID and signing key stable for future updates.
- It installs separately from Expo Go. Its database starts empty; the existing
  Expo Go guest notebook is not transferred or deleted.
- Native photo picking uses the existing expo-image-picker implementation.
  This configuration does not establish that the picker works on a device.
- Guest data remains device-local. There is no account backup or sync yet.

## One-time cloud service setup

Use the founder's Expo account, not an agent-owned account. Authentication must
use a supported browser/secure credential flow. Never paste passwords, tokens,
keystores, or keystore passwords into chat or Git.

1. Authenticate the cloud EAS CLI with `npx eas-cli@latest login`.
2. Inspect existing Expo projects before creating/linking a project. Record the
   actual project ID in app.json at `expo.extra.eas.projectId` and owner when
   needed; app.config.js preserves those fields.
3. Run the preview build interactively the first time to generate or select the
   Android signing keystore on Expo. Reuse it for subsequent preview updates.
4. Use the available account build quota. Do not accept paid upgrades or enable
   paid build options without the founder's decision.

## Build and handover

From a clean feature checkout based on the current `review/my-places`:

```sh
npm ci
npm run typecheck
npm test
APP_VARIANT=preview npx expo config --type public
npx eas-cli@latest build --platform android --profile preview
```

EAS uploads source and builds remotely. Only claim completion when the remote
build reports success and supplies an APK. Deliver its actual installation URL
and identify the source commit. A JavaScript export or queued job is not an APK.
If account policy permits public access to internal distribution links, treat
the install URL as a shareable build link; do not imply ChatGPT's private Site
gate protects it.

On Android, open the provided link, download the APK, and allow installation
from that browser when Android requests it. Do not uninstall Expo Go. Verify
launch without a development server; add a place and a device photo, edit a
list, force-close/reopen, then confirm saves and photos persist. Record results
as founder-reported checks until independently observed.

Code updates require a new APK build and installation over the existing Goby
Preview using the same application ID and keystore. OTA updates are not configured.

## Evidence boundary

The profile and application identity can be validated before account linking.
Actual APK generation, signing, installation, and device behavior must be
reported separately. No EAS account/project/signing setup is implied by this file.
