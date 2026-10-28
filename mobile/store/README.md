# Publishing FarmFlows on Google Play

Everything Google asks for, in order. The texts are in `listing.md`, the
answers for the policy forms in `data-safety.md`, the pictures in `graphics/`.

## 0. Before you start

- The website must be live with the latest migrations, so these pages work:
  - https://www.farmflows.app/privacy (privacy policy, now covering the app)
  - https://www.farmflows.app/delete-account (how to delete an account; Google requires this link)
- If you edited the privacy policy in *Admin → Pages & contact* before, the
  migration leaves your text alone. Then copy the new text from
  `supabase/migrations/20261118000000_privacy_app.sql` into the admin page.

## 1. Google Play developer account

1. Sign up at https://play.google.com/console with the Google account that should own the app.
2. Choose **Organization** if you have a registered business (trade licence and a D-U-N-S number), otherwise **Personal**.
3. Pay the one-time registration fee and finish identity verification (ID, phone, address). This can take a few days.
4. Note: new **personal** accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to everyone (Google's rule at the time of writing; Play Console shows the current requirement). Organization accounts skip this.

## 2. Create the app

Play Console → *Create app*:

- App name: `FarmFlows: Farm Manager`
- Default language: English (United States)
- App or game: **App** · Free or paid: **Free**
- Accept the declarations.

The Android package name is fixed by the first upload: `app.farmflows` (from `mobile/app.json`). It can never change afterwards.

## 3. App content (Policy → App content)

Fill every section with the answers in `data-safety.md`:
privacy policy URL, app access (reviewer login), ads, content rating,
target audience, news app, data safety (with the deletion URL), government
app, financial features, health.

## 4. Store listing

*Grow users → Store presence → Main store listing*: paste the texts from
`listing.md`, upload the icon, feature graphic and screenshots from
`graphics/`. Add the Bangla translation (*Manage translations → bn-BD*) with
the Bangla texts and the `bn` screenshots.

## 5. Build the release (Android App Bundle)

The app reads three public settings at build time. In EAS (expo.dev → your
project → *Environment variables*) make sure the **production** environment
has the same values as preview:

| Name | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | the publishable / anon key (never the service_role key) |
| `EXPO_PUBLIC_SITE_URL` | `https://www.farmflows.app` |

Then build:

```bash
git pull
cd mobile
npx eas-cli@latest build -p android --profile production
```

This makes an `.aab` (not an APK). The build number (`versionCode`) goes up
by itself on every production build; change `"version"` in `app.json`
(1.0.0 → 1.0.1 …) when you want a new version name for users.

## 6. Upload and test

1. Play Console → *Test and release → Testing → Internal testing* → *Create new release*.
2. When asked about app signing, keep **Play App Signing** (Google keeps the signing key; EAS keeps the upload key).
3. Upload the `.aab` from the EAS build page, paste the release notes from `listing.md`, roll out.
4. Add yourself and a few people as internal testers and install from the link to check everything.
5. Personal account: create a **Closed testing** track, add at least 12 testers (their Gmail addresses or a Google Group), and keep it running for 14 days.
6. Then *Production* → create a release with the same bundle → send for review. The first review usually takes a few days.

Later updates: `npx eas-cli@latest build -p android --profile production`, then
upload the new `.aab` to Production (or set up `eas submit` with a Google
service account to upload from the command line).

## 7. After it is live

- Put the Play Store link on the website (home page "mobile app" section).
- Answer reviews in Play Console.
- Every time the app starts using a new kind of data or permission, update
  `data-safety.md`, the Data safety form and the privacy policy.

## Remaking the graphics

The screenshots come from the app's web build with a demo farm; the feature
graphic and icon from the app's own artwork. See `graphics/README.md`.
