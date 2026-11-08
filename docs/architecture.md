# Production direction

## Product intent

Save favorite places, including informal spots such as a sunset bench, with a
short personal tip. Owners choose private, friends, or public visibility.
Discovery prioritizes trusted friends. A visit can lead to a one-tap thank-you;
group plans let participants vote on places. No ads or influencer mechanics.
The exact rules for sharing a restricted place into a plan remain unresolved.

## Stack

- Expo + React Native + TypeScript, with native components and navigation.
- Supabase Auth, PostgreSQL, and private Storage buckets.
- PowerSync with SQLite for authenticated offline reads/writes. The current
  expo-sqlite guest notebook is an isolated bootstrap, not a sync implementation.
- Server-side functions for sensitive shared-plan operations.
- Push notifications after save, sharing, and voting are working.

## Security decisions to resolve before a shared schema

Define friendship acceptance, shared-plan roles, whether adding a recommendation
requires its owner's consent, and what happens when visibility or membership is
revoked. Default proposed behavior: adding a reference to a plan never grants
access to a private or friends-only source. Any broader sharing must be an
explicit, authorized operation. This is a proposal pending product confirmation.

Keep recommendation ownership and audience separate from plan membership.
Authorize each read and write on the server using authenticated identity; never
trust an owner ID or audience supplied by a client. RLS must cover every exposed
table, and Storage policies must follow the same authorization relationship.
Service-role credentials must never ship in the app.

PowerSync rules must select the same authorized records as RLS. RLS alone does
not protect a replication connection. Validate the selected PowerSync version's
revocation behavior and removal of stale local rows. Previously downloaded data
cannot be remotely erased from a device that stays offline; the product needs
an explicit offline/revocation policy.

Use account-scoped databases; close and clear account caches and credentials on
sign-out or account switching. Decide how guest data is imported explicitly at
sign-in. Do not silently attach the current guest notebook to an account.

## First production vertical slice

1. Confirm the access matrix and prototype, then implement migrations, RLS,
   private Storage policies, and server-authorized plan attachment.
2. Test with anonymous, owner, accepted friend, stranger, and plan-member users.
   Include attempted owner changes, forged memberships, and visibility changes.
3. Connect Auth and account-scoped PowerSync with equivalent sync rules.
4. Test offline save, reconnect, retries, duplicate submissions, conflict handling,
   account switching, friendship revocation, and plan-member removal. Compare
   sync results against direct RLS reads for every identity.
5. Add sharing and voting UI only after these boundaries pass integration tests.

Backend tests require local Supabase or a dedicated test project and a PowerSync
instance. No claims about production permission enforcement are made by the
local notebook starter.
