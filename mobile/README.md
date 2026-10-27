# FarmFlows Android app

The native Android app for FarmFlows. It is built with Expo (React Native) and Material 3 (react-native-paper). It uses the same Supabase project as the website: the same accounts, farms and data, and the same database security rules.

The Android app comes first. The same code can later build the iPhone app.

## What's in this first version

- **Welcome guide on first launch.** Four short slides with a Bangla / English switch. It is shown once.
- **Sign in first.** There is no landing page; the guide leads straight to sign in.
  - Email and password.
  - Continue with Google.
  - Forgot password: sends the reset email. Its link opens the website, where the new password is set.
- **Create an account in the app**, in three steps:
  1. Name, email and password.
  2. Farm setup: name, area, what the farm keeps (dairy, fattening, goats & sheep, layers, broiler & Sonali) and currency. This uses the same `create_farm` function as the website.
  3. **Choose a plan.** Plans come from the `plans` table, with monthly prices in the farm's currency and their limits.
     - **Free** starts straight away.
     - **Pro** or **Business** sends an upgrade request, the same one the website sends. The super admin sees it in *Admin → Requests* and activates the plan after payment. Until then the farm runs on Free.
     - The app takes no payment itself. Google Play requires its own billing system for in-app digital purchases.
- **Home** shows:
  - A greeting, the farm, your role and the plan.
  - Today's cards for what the farm keeps: cattle, goats & sheep, birds, milk today, eggs today.
  - Pull down to refresh.
  - A link to the full dashboard on the website.
- **More** has:
  - Your account.
  - A farm switcher, when you belong to more than one farm.
  - Language and theme (system / light / dark).
  - Links to the website, help, privacy and terms.
  - Sign out.
- **Bangla everywhere.** Bangla text uses the Noto Sans Bengali font and Bangla digits; English uses Inter. The app chooses Bangla when the phone is set to Bangla or Bangladesh.

**Next steps:** animals, daily entries (milk, eggs, flock logs) that work offline, vaccines and breeding, sales and dues, profit, phone notifications for reminders, and QR tag scanning.

## Setup

```bash
cd mobile
npm install
cp .env.example .env.local   # then fill in the values
npx expo start               # press a for Android, or scan the QR code with a development build
```

`.env.local` takes three values:

| Variable | What |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Same as the website's `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The anon / publishable key (public). **Never** the service-role key. |
| `EXPO_PUBLIC_SITE_URL` | `https://www.farmflows.app` |

The app keeps only the project address from `EXPO_PUBLIC_SUPABASE_URL`, so `https://xxx.supabase.co/rest/v1/` works as well. Stray spaces or quotes around the values are removed too. When sign-in fails for a reason the app doesn't explain, the server's own message is shown in small text under the error.

**Google sign-in:** in Supabase, go to *Authentication → URL Configuration → Redirect URLs* and add `farmflows://auth/callback`.

## Checks

```bash
npm run lint
npm run typecheck
npm test                      # Jest (jest-expo): translations, plans, sign-in messages
npx expo export --platform android   # bundle check (CI runs this too)
npx expo export --platform web       # a web build, used for click-through tests in a phone-sized browser
```

## Build an APK and publish to Google Play

Builds run in the cloud with EAS. A Mac or Android Studio is not needed.

1. Create a free account at [expo.dev](https://expo.dev). Then run `npx eas-cli@latest login` and `npx eas-cli@latest init`. This links the project and adds its id to `app.json`.
2. Add the three `EXPO_PUBLIC_*` values as EAS environment variables, for the *preview* and *production* environments. Use expo.dev → Project → Environment variables, or `eas env:create`.
3. **Test APK:** `npx eas-cli@latest build -p android --profile preview`. Open the link on an Android phone to install it.
4. **Play Store build:** `npx eas-cli@latest build -p android --profile production`. This makes an `.aab`. EAS creates and keeps the signing key.
5. In the [Google Play Console](https://play.google.com/console) ($25 once):
   1. Create the app *FarmFlows* with package `app.farmflows`.
   2. Fill in the store listing (Bangla and English), the Data safety form, and the privacy policy link (`https://www.farmflows.app/privacy`).
   3. Upload the `.aab` to *Internal testing* first. `eas submit -p android` can upload it for you.
   4. New personal accounts must run a closed test before going to production. Google currently requires 12 testers for 14 days.

Version: `version` in `app.json` is the name users see. With `appVersionSource: remote`, EAS raises the Android `versionCode` on every production build.
