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
- **Write** tab: "What do you want to write?"
  - A big tile for each kind of record the farm keeps: milk, eggs & birds, vaccine / treatment, breeding, flock vaccine, sale, expense, stock and (owners and managers) attendance.
  - **Today's work** above the tiles: morning and evening milk and each flock, ticked once written. A red dot marks the milk or eggs still to write.
  - **Milk** sheet:
    - Day and milking at the top. The milking is picked from the clock (morning until 2 pm).
    - **Same as yesterday** copies yesterday's litres into the cows still empty.
    - **− / +** change half a litre at a time; typing works too. A cow with a number turns green, and "4 of 6 cows written" shows what is left.
    - The total and **Save** stay at the bottom of the screen.
    - After saving, it says what was saved and offers the next step: *Write the evening milk* or *Write eggs & birds*.
  - **Eggs & birds**:
    - Each box shows yesterday's number underneath. "Birds taken out" (culled) is explained.
    - The feed can be **taken from stock**: pick a poultry feed and its kg come off that item.
    - After saving, it offers the next flock or the milk.
  - Bangla digits (১২.৫) and a decimal comma work in every number box.
- **Works without internet.**
  - **Opens offline.** The account and the farms are kept on the phone, so the app opens on the farm without internet, even when the sign-in has expired (it is renewed by itself once online).
  - **The current farm is kept on the phone.** When the app opens (at most every 6 hours), when the internet comes back and with *More → Use without internet → Download now*, the app downloads:
    - every list (animals, flocks, buyers, stock, staff), every animal's page (details, milk, health, breeding, weights), each flock's page, each buyer's sales and payments, stock moves, staff months, money this month and last, and the reports;
    - records of the last **365 days**. A super admin changes the number of days in the website's */admin/settings* (`system_settings.offline_days`, 30–1095). Saved days older than that are removed from the phone.
  - **Everything can be entered offline**: milk, eggs and flock days, vaccines and treatments, breeding, sales, payments, buyers, expenses, new animals and changes to them (with the photo, uploaded later), weights, stock purchases, uses and counts, stock items, staff, attendance, staff pay, new flocks and flock health, and deleting records.
  - **What waits shows at once** in the screens (a new animal is in the list and opens its page, a vaccine is on the animal's page, a purchase raises the stock, a credit sale raises the buyer's due). A bar shows how many entries are waiting, and the Entry tab shows a badge.
  - **Sent by itself** as soon as the internet is back, when the app comes back to the front, every half minute while some wait, or with *Send now*. A save that gets no answer in 12 seconds waits on the phone instead.
  - **Never twice.** Every new row gets its id on the phone, so an entry sent again (the reply lost on a weak network) is saved once. A second sheet for the same day and milking (or flock day, or attendance day) replaces the first, as on the website. A tag or stock name already used is refused at once, offline too.
  - **Changes made elsewhere meanwhile: the later one stays, and the app says so.** Each change carries when the screen last saw the record. If the record was changed again after yours (on the website or another phone), that change is kept; if yours is later, yours replaces it; if it was deleted, yours is dropped. The note shows on the Home and Entry tabs. Changes elsewhere to other fields of the same record are kept with yours.
  - If the server refuses an entry (for example, the animal was deleted meanwhile), it shows why and can be discarded. It doesn't hold up the others.
  - Signing out clears the copies kept on the phone. Team, profile, farm settings and new farms need the internet.

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
- **Farm tools** (More → Farm tools, or the Write tab): nine calculators, the same as the website's Tools menu (`src/lib/tools.ts` is copied):
  - **Cattle & goat weight** from a measuring tape (cm or inch), shown in kg with a ±10 % range. *Save to an animal* opens the weight form already filled in.
  - **Feed ration** for a milking cow (weight, milk, fat) or fattening (weight, gain wanted): concentrate, green grass, straw, water, salt and minerals a day. Also a home-made concentrate mix with its cost per kg from your prices.
  - **Poultry feed & water** by age for layers, broilers and Sonali, with bags and cost.
  - **Calving & kidding date**: next heat, pregnancy check, drying off and the expected birth.
  - **Qurbani & animal price**: meat and bone from live weight, price per kg, profit.
  - **Unit converter**: maund, seer, kg · hali, dozen, tray · inch, cm, haat · decimal, katha, bigha, acre.
  - **Medicine dose by weight** (ml or tablets), with a "follow the label and your vet" warning.
  - **Grass land & silage**: decimals of Napier and the silage a herd needs.
  - **Milk price from fat & SNF.**
- **Doctors (vets)**
  - A doctor's account opens the **Doctor console** instead of farm setup:
    - farms served, with animals and overdue vaccines;
    - invitations, with Accept / Decline;
    - Open farm, or leave it;
    - doctor details (registration number, specialty) and the verified badge.
  - On a farm, a doctor writes vaccines, treatments and breeding (Write tab or an animal's page). These are **sent to the owner for approval**, as on the website; nothing is saved until then. Doctors don't see sales.
  - **Approvals** (More → Approvals; a card on Home when something waits):
    - Owners and managers approve or reject (with a reason).
    - A doctor sees what they sent, the decision and the reason, and can withdraw an entry still waiting.
    - These go through the website's own approval code (`/api/app/approvals`, `/api/app/submit`) with the person's own session, so the rules stay exactly the same.

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
- **Profile:** name, phone, photo, a new password, and **Delete account**: an optional reason and note, type DELETE to confirm. This saves a request and signs out everywhere; the account is deleted 30 days later. Signing in again before then cancels it, and Home says so.
  - Google Play requires the delete option. The website has the same button under Profile.
  - Farms owned alone are deleted with all their records.
  - A farm shared with others has to be handed over first.
- **Farm settings** (owners and managers): name, area, what the farm keeps, currency, and the profit-per-animal switch. **Add another farm**, within the plan's limit.

- **Farm tools** (More → Farm tools):
  - **Stock: feed and medicine.** Items counted in kg, bags (with the bag's weight), litres, doses and so on.
    - Record purchases (with a price, they go into expenses), uses (for cattle, poultry or one flock) and counts. A count stores the difference from what the app shows.
    - Each item shows what is in stock, its average cost, about how many days it lasts at the last 30 days' rate, and a warning when it falls to the level you set.
    - Owners and managers can delete an entry. Uses that come from a flock's daily log are changed there.
  - **Staff and pay** (owners and managers):
    - Add workers with a monthly salary. Mark only who was absent, on half day or on leave; everyone else counts as present.
    - Each worker's month shows days, the cut for absences, what is paid and what is still due. Pay salary, an advance or a bonus (prefilled with what is due).
    - Uses the website's own salary maths (`src/lib/staff.ts` is copied).
  - **Team:** see who is on the farm.
    - Owners and managers invite by email as manager (owner only), worker or vet, and can cancel an invitation. The owner can remove someone.
    - Anyone else can leave the farm.
    - **Invitations to you** show on the home screen and on the first farm-setup screen, with Accept / Decline.
  - **Reports:**
    - Milk and eggs for the last 30 days as bar charts.
    - Cost, income and profit per litre and per egg for any month, plus the last 6 months (same numbers as the website's `farm_monthly_summary` and `src/lib/profit.ts`).
    - Profit per animal for the last 12 months, this year or all time, unless the farm turned it off (`animal_profit_data`, `src/lib/animal-profit.ts`).
    - **Share as PDF or CSV** (Excel) through WhatsApp, email or Drive. Like the website's downloads, this needs a paid plan.

`tests/copies.test.ts` fails when a copied website file changes on one side only.

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
npm test                      # Jest (jest-expo): translations, plans, sign-in messages, entries, the offline outbox, records, reports, website copies
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
