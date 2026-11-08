# Prototype v0.41 → native app reference

Source: user-supplied `Goby-phone-preview-v0.41 (1).html`.
Reviewed HTML, final CSS overrides, and JavaScript definitions. This is a source
review; the prototype has not been visually tested in a browser in this session.
The HTML contains successive revisions of styles and functions, so later
implementations take precedence over earlier screens.

## Navigation and visual language

Three bottom destinations: **My places**, **Discover**, **Plans**.
Preserve the footprint identity, “Where your friends would take you” tagline,
serif collection headings, photographic horizontal shelves, rounded controls,
and day/night themes. Use native lists, navigation, sheets, and forms.
The temporary green notebook starter is not the target design.

## Screen mapping

| Prototype surface | Native implementation direction |
| --- | --- |
| My places | Personal/friend collection context, horizontal place shelves, list ordering, inline search, add button |
| Discover | Destination and discovery filters, guide/trail browsing, clearly attributed recommendations |
| Place | Full image header, personal tip and author, back navigation, visitor information and source links |
| Save place | Required name; optional city, tip, photo, coordinates; optional list; “Places to keep” fallback |
| Lists | Create, select, rename/reorder, copy recommendations while retaining provenance |
| Visit | Optional date and private memory; save first, then offer thank-you |
| Thank-you | Editable message and explicit system share action; nothing sent automatically |
| Plans | Stacked plans, member selection, horizontal suggestions, voting, confirmed choice, reopening |
| Sharing | Selected places, personal message, recipient preview, audience selection |

## Behaviors to retain

- Capture works without a city, photo, verified venue ID, or location permission.
- Location permission is requested only after tapping the location action.
- Tips are distinct from private visit memories.
- Preserve the original recommender when copying into a list or plan.
- Voting choices: “I’m in”, “Probably”, “Can we find something better”, “Not for me”.
  Tapping the selected vote clears it; confirming a choice freezes voting until reopened.
- Return from place detail to the prior collection/search context.
- Keep usable touch targets, reduced-motion support, and screen-reader labels.

## Production differences requiring decisions

The prototype explicitly simulates invitations and sync with browser localStorage.
Its sharing labels are “Only me”, “People I invite”, and “Anyone with the link”.
These are not equivalent to the proposed private/friends/public recommendation
model: invited recipients may not be friends, and an unlisted link is not public
discovery. Model recommendation audience, explicit share grants, and plan roles
separately rather than mapping these labels silently.

The prototype adds plan suggestions from local references without server access
resolution. Production must authorize attachment and subsequent reads; adding a
place must not silently reveal its restricted tip to every plan member.

Keep private visit memories out of exported guides, sync audiences for friends,
and shared plans. Local HTML exports are copies that cannot be revoked; hosted
shares need explicit access and expiry semantics if revocation is required.

Sample friends, votes, editor collections, public profiles, and illustrations are
reference content, not live users or endorsements. Confirm the role of editor
collections against Goby’s friends-first positioning before including them.

## Build order

1. Replace the temporary notebook UI with the native My places shell and
   prototype typography, themes, navigation, and horizontal shelves.
2. Expand local capture to city/list and place detail; retain offline durability.
3. Implement Auth, tested RLS, account-scoped sync, and private Storage.
4. Add friends/discovery, visits/thanks, and authorized plan voting incrementally.
