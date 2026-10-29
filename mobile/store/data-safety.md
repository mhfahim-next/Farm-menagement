# Play Console answers: Data safety, content rating and app content

Answers for *Policy → App content*. They match what the app and website do
today (checked in the code); update them if the app starts collecting
something new.

## Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS only).
**Do you provide a way for users to request that their data is deleted?** Yes:
in the app (More → Delete account) and at https://www.farmflows.app/delete-account

"Shared" means given to another company for its own use. Hosting, storage,
email, notifications, payments and the AI provider work for us (service
providers), which Google does not count as sharing, so every type below is
*collected, not shared*.

| Data type | Collected | Optional? | Why (Play's purpose names) |
| --- | --- | --- | --- |
| Personal info → Name | Yes | Required | App functionality, Account management |
| Personal info → Email address | Yes | Required | App functionality, Account management, Developer communications |
| Personal info → Phone number | Yes | Optional | Account management |
| Personal info → User IDs | Yes | Required | App functionality, Account management |
| Financial info → Purchase history | Yes | Optional (only paid plans) | App functionality, Account management |
| Financial info → Other financial info (farm income, expenses, sales, salaries the user enters) | Yes | Optional | App functionality |
| Location → Approximate location (from the IP address when the person signs in or confirms their email on the website) | Yes | Required | Fraud prevention, security and compliance; Analytics |
| Photos and videos → Photos (animal and profile photos the user adds) | Yes | Optional | App functionality |
| App activity → Other user-generated content (farm records: animals, milk, eggs, health, breeding, stock, notes) | Yes | Required | App functionality |
| Device or other IDs (notification token) | Yes | Optional (only if notifications are allowed) | App functionality |

Not collected: precise location, contacts, messages, audio, files and docs,
calendar, health and fitness (of people), web browsing, installed apps,
crash logs from the app, advertising ID.

**Processed ephemerally?** No for all of the above (they are stored).

## Content rating (IARC questionnaire)

- Category: **Reference, News, or Educational**? No: choose **Utility, Productivity, Communication, or Other**.
- Violence, sexuality, language, controlled substances, gambling: **No** to all.
- Does the app let users interact or exchange content? **Yes**: users share farm records with people they invite (team, vets); there is no public chat in the app. (The website's community forum is moderated.)
- Does the app share the user's location with other users? **No**.
- Does the app allow purchases of digital goods? **No** in the app (plans are bought on the website).

Expected rating: Everyone / 3+.

## Target audience and content

- Target age groups: **18 and over** (farm owners and workers). Not designed for children.
- Ads: **No, my app does not contain ads.**
- News app: **No.**
- Government app: **No.**
- Financial features: **None of these** (it keeps farm accounts; it doesn't lend, pay or trade).
- Health: **No** (animal health records are not human health).
- COVID-19 contact tracing: **No.**
- Data safety: as above.

## App access (for Google's reviewers)

The app needs an account, so give reviewers one:

1. Create a normal account on https://www.farmflows.app/signup (for example `playreview@<your domain>`), confirm the email, create a farm and add a few animals and records.
2. In Play Console → *App content → App access* choose **All or some functionality is restricted**, add the email and password and write: "Sign in with these details. The farm 'Demo Farm' has sample animals, milk and flock records."
3. Keep this account working (don't delete it, don't change the password without updating Play Console).

## Permissions the app asks for

| Permission | Used for |
| --- | --- |
| Camera | Scanning an animal's QR ear tag; taking a photo of an animal or yourself |
| Notifications | Vaccine, calving and other farm reminders |
| Internet | Syncing with your account |
| Network state | Knowing when the internet is back, to send entries made offline at once |

The app does **not** request location, microphone, contacts or access to
the photo library (pictures are chosen with Android's photo picker). These
are blocked in `app.json` (`android.blockedPermissions`), so a library update
can't add them by accident.
