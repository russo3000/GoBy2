# My places device checks

Run on both iOS and Android before calling this slice device-verified.

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
