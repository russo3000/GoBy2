# My places device checks

Track Android and iOS results separately. Passing this checklist in Expo Go is
not evidence of a standalone build or store release.

- Install over the original notebook and confirm old titles/tips appear in
  “Places to keep”. No destructive reset should be needed.
- Enable airplane mode; add places with/without city and tip, create a list,
  and confirm changes remain after force-closing/reopening the app.
- Pick a photo, cancel the picker, replace/remove a photo, and edit a saved place.
  A chosen photo should still render after the picker cache is cleared or the
  app restarts. Original source photos must not be modified.
- Scroll a shelf containing enough cards to overflow; check both arrow controls,
  touch scrolling, and returning from detail to the original shelf position.
- Search by name/city/tip/list and check the no-results state and clear action.
- Open detail; edit and change its list; return using iOS back swipe and Android
  hardware back. Check a draft can be dismissed normally.
- Toggle day/night and reopen; check system status bar, notch/home-indicator
  clearance, text scaling, VoiceOver/TalkBack labels, and keyboard avoidance.
- Check Maps opens an external name/city search. It must not imply verified
  coordinates. Simulate a launch failure and confirm the error can be retried.
- Confirm Discover and Plans explain that account-based features are pending.

Current limit: replacing/removing a saved photo leaves the old private file on
this device. A later cleanup pass should remove unreferenced images. Uninstalling
or clearing app data removes guest saves; there is no cloud backup yet.


## Android Expo Go session — 8 November 2026

Evidence: Igar performed the steps on his Android phone and reported the outcomes
in this development chat. These are founder-reported manual results, not automated
or independently observed device tests. Phone model, Android version, and Expo Go
version were not recorded.

| Check | Result |
| --- | --- |
| Launch from Mac Metro QR and interact with Goby | Passed |
| Save a place with city/tip; open and edit it | Passed |
| Save survives closing and reopening Expo Go | Passed |
| Attach photo; photo survives closing and reopening Expo Go | Passed |
| Save/open another place while airplane mode is enabled | Passed |
| Android Back from detail; dismiss edit without saving | Passed |
| Reach fields and save with keyboard open and multiline tip | Passed |
| Search by name/city/tip, no results, and clear search | Passed |
| Create list; move place to another list without duplicates | Passed |
| Swipe shelves, use arrows, retain shelf position after Back | Passed |
| Day/night readability and theme persistence after reopening | Passed |
| Maps search opens and returns to same place | Passed |
| Cancel photo selection, replace photo, remove photo without losing tip/place | Passed |
| Discover/Plans placeholders and return to saved places | Passed |
| Increased Android font size | Skipped at Igar's request |

Also confirmed by Igar: Mac browser at http://localhost/Goby2/ opens and is
interactive. The full manual checklist above was performed on Android, not web.

Not covered: TalkBack, detailed notch/system-bar checks, offline cold restart
without Metro, device upgrade from the original notebook, search by list name on
the phone, simulated Maps failure, denial/failure paths, unmodified source-photo
verification, iOS execution, or standalone/release builds. Core Android checks
passed; this is not a complete accessibility or release certification.
