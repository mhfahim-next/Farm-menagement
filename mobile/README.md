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

- **Animals** tab:
  - Every cow, heifer, bull, goat and sheep, with type, breed and age.
  - Search by tag or name. Active or All (sold and dead too). Cattle and goats & sheep are kept apart.
  - Tap an animal for its page: details and mother, milk over the last 7 and 30 days, the latest vaccines and treatments with the next due date, and breeding with the expected calving date.
- **Entry** tab (owners, managers and workers):
  - **Milk:** pick the day (today, yesterday or the day before) and the milking. Then type litres for each milking animal and watch the total. Numbers already saved for that day are filled in, so they can be checked and changed.
  - **Birds:** pick a flock or batch and enter the day's eggs, broken eggs, deaths, culls and feed. Broiler and Sonali batches also have average weight.
  - Bangla digits (১২.৫) and a decimal comma work in every number box.
- **Works without internet.**
  - The animal and flock lists are kept on the phone, so they still open offline.
  - An entry saved without internet waits on the phone. A bar shows how many are waiting, and the Entry tab shows a badge.
  - Waiting entries are sent in order: when the app comes back to the front, every half minute, or with *Send now*.
  - If the server refuses one (for example, the animal was deleted meanwhile), it shows why and can be discarded. It doesn't hold up the others.
  - Entries use the same tables and security rules as the website. A second sheet for the same day and milking replaces the first, as on the website.

- **Vaccine / treatment** (from the Entry tab or an animal's page):
  - Quick choices fill in the vaccine, the type and how often to repeat it: FMD, HS, BQ, LSD, deworming, tick spray, and for goats PPR, goat pox and ET.
  - Choose one animal or many, or *Select all*. Each animal gets its own record with the next due date, which then shows in Reminders.
- **Breeding** (only for females):
  - Heat, with the signs seen. The next heat date is shown.
  - Insemination, with the bull or semen. The expected birth date comes from the admin's gestation days for that species.
  - Pregnancy check, with its result. Dry off.
  - Birth: give the newborn a tag and it joins your animals with its mother, breed and sire. A heifer (young doe, ewe lamb) becomes a cow (doe, ewe).
- **Sales** tab:
  - What all buyers owe, the buyers with their dues, and the latest sales.
  - **New sale:** milk, eggs, an animal, broiler birds, manure or other.
    - Sell for cash, or on credit to a buyer. The buyer's usual milk or egg rate fills in the price.
    - The total and the remaining due are shown before saving.
    - An animal sold this way is marked sold.
  - **Buyer page:** what they owe, their sales and payments, a call button, and *Payment* (cash, bKash, Nagad, Rocket, bank).
  - **New buyer:** name, phone, usual rates.
- **Every record works offline.**
  - Records get their id on the phone, so sending one twice (when the connection drops just after the server saved it) never makes a copy.
  - A buyer added offline can be sold to straight away. The buyer reaches the server first.
- Vets don't see the Entry and Sales tabs. Their changes go through the farm's approval on the website.

- **Today's work** on Home, and a **Reminders** screen:
  - Vaccines due, heats, pregnancy checks, births, low stock, buyer dues, broiler weighing, the Qurbani countdown and more.
  - It is the same list as the bell on the website. The app reads it from `/api/app/reminders` on the website, using the person's own session, so the database security rules apply.
  - Tick one off with *Mark done*.
- **Phone notifications** (More → Notifications):
  - At 7 am, today's work. At 8 pm, a note if today's milk or eggs aren't entered yet.
  - They are scheduled on the phone itself, so no push server or Firebase setup is needed.
  - The plan is renewed every time the app opens. If the app isn't opened for a few days, a short daily nudge keeps coming for up to a week.
  - Tapping a notification opens the right screen.
- **Scan a tag** (Animals → Scan):
  - Point the camera at the QR code on an ear tag printed from the website, and the animal opens.
  - Or type the tag number.
- **Expenses** (Sales tab → Expense, or Entry):
  - Feed, medicine, labour, electricity and so on, for one part of the farm or the whole farm.
  - Enter either an amount or quantity × price. Works offline.
- **Profit** (Sales tab → Profit): this month or last month, money in, money out and profit per part of the farm. It uses the same ledger as the website: sales, costs, medicine, breeding and staff pay.

- **Animals: add, edit, delete** (Animals → **+ Add**, or ✏ on an animal's page):
  - Tag, name, type, breed, birth date, purchase date and price, mother (from the farm's females), sire and notes, plus a **photo** from the camera or gallery.
    - Photos are shrunk to 1024 px and stored in the `animal-photos` bucket under the farm's folder. Only that farm's staff can add or change them.
  - A bought animal can start fattening straight away, with its weight now and a target weight.
  - The status can be changed (sold, dead, archived). Owners and managers can delete an animal.
  - Duplicate tags and plan limits are explained in plain words.
- **Change or delete records:** the ⋮ menu on a vaccine, breeding event, weight, sale, payment or expense.
  - Staff can edit vaccines and breeding events. Owners and managers can delete records, which matches the database rules.
- **Weights and fattening:**
  - Weigh on a scale, or with a **measuring tape**: girth² × length ÷ 10838, the same formula as the website.
  - The animal's page shows the latest weight, grams gained a day, and for fattening animals: days on feed, expected weight on the sale day, cost so far, break-even price per kg and expected profit.
  - **Fattening** (Animals → Fattening) lists every animal being fattened. Its settings hold the sale day (Qurbani by default), daily cost and price per kg.
  - The numbers come from the same code as the website (`src/lib/fattening.ts` is copied).
- **Flocks and batches** (Animals → Flocks & batches; the Birds tab on farms that keep only birds):
  - Start a layer flock or a broiler / Sonali batch.
  - Layer page: birds alive, laying % over 7 days, mortality, feed per dozen eggs, age.
  - Batch page: age, live birds, mortality, average weight, FCR, cost per kg, sales and profit (`src/lib/broiler.ts` is copied too).
  - Vaccines and medicine for one or more flocks, with Newcastle, Gumboro and other presets.
  - A flock can be marked sold or culled.
- **Profile:** name, phone, photo, a new password, and **Delete account** (type DELETE to confirm).
  - Google Play requires the delete option. The website has the same button under Profile.
  - Farms owned alone are deleted with all their records.
  - A farm shared with others has to be handed over first.
- **Farm settings** (owners and managers): name, area, what the farm keeps, currency, and the profit-per-animal switch. **Add another farm**, within the plan's limit.

**Next steps:** stock (feed and medicine), staff attendance and pay, the team (invite managers, workers and vets), milk and egg charts, profit per litre or egg and per animal, and sharing reports as PDF or Excel.

For the Play Console's account-deletion question, give: in the app, More → Profile → Delete account; on the web, https://www.farmflows.app/dashboard/profile (sign in, then Delete account).

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
| `EXPO_PUBLIC_SITE_URL` | `https://www.farmflows.app`: links, and the reminders the app reads from the website |

The app keeps only the project address from `EXPO_PUBLIC_SUPABASE_URL`, so `https://xxx.supabase.co/rest/v1/` works as well. Stray spaces or quotes around the values are removed too. When sign-in fails for a reason the app doesn't explain, the server's own message is shown in small text under the error.

**Google sign-in:** in Supabase, go to *Authentication → URL Configuration → Redirect URLs* and add `farmflows://auth/callback`.

## Checks

```bash
npm run lint
npm run typecheck
npm test                      # Jest (jest-expo): translations, plans, sign-in messages, entries, the offline outbox
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
