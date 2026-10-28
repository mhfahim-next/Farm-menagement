-- Privacy policy: add the Android app (camera, photos, notifications, data kept
-- on the phone), payments, error reports, security and how to delete an
-- account (/delete-account). Google Play checks these before publishing.
--
-- Only replaces the policy if it is still the original text from the first
-- release; a policy a super admin has already edited is left alone (paste the
-- new text in Admin → Pages & contact instead).

update public.site_pages set
  body_en = $body$_Last updated: November 2026_

This policy explains what **FarmFlows** (the website farmflows.app and the FarmFlows Android app) collects, why, and the choices you have.

## What we collect
- **Account details:** name, email, phone (optional) and profile photo.
- **Farm records:** everything you and your team enter — animals and their photos, milk, eggs, health, breeding, weights, stock, sales, staff, salary and money.
- **Payments for a plan:** the plan, amount, method and the transaction ID you enter. Card and online payments are handled by the payment provider (SSLCommerz or Stripe); we do not see or store card numbers.
- **Sign-in and usage data:** the IP address and approximate location (country, region, city) of signed-in users, taken from our hosting provider's network, plus the date of each sign-in.
- **Site visits:** pages viewed, the referring website, device type and country. Visitors who are not signed in are counted **without** storing their IP address. A random visitor ID is kept in your browser; "Do Not Track" is respected.
- **Error reports:** when the website crashes, a technical report (the page, the browser and the error) may be sent to our error-monitoring service so we can fix it.
- **Messages you send us** through the contact form, and **reviews** you write.

## The Android app
- **Camera:** only when you scan an animal's QR ear tag or take a photo of an animal or yourself. Nothing is recorded in the background.
- **Photos:** you choose a picture with Android's photo picker; the app sees only the picture you pick. It does not read your gallery.
- **Notifications:** if you allow them, the app registers a notification token so we can send reminders (vaccines, calving and so on). You can turn reminders off in the app or in Android settings.
- **On your phone:** a copy of your farm data is kept on the phone so the app works offline, and is removed when you sign out. Entries made without internet wait on the phone until they are sent to your account.
- The app does **not** use your location, microphone or contacts, and has no ads.

## Why we use it
To run your farm account, keep it secure (for example, spotting unusual sign-ins), send the reminders you ask for, take payments for plans, answer your messages, fix problems, improve the service, and show approved reviews on our website.

## AI assistant
When you use the AI assistant, the text you type and a short summary of your farm (for example, animal tag numbers) are sent to the AI provider chosen by FarmFlows (Google Gemini or Anthropic Claude) to prepare a suggestion. Nothing is saved until you confirm.

## Who can see your data
- People you add to your farm, according to their role. Doctors cannot see finances.
- FarmFlows administrators, only to provide support and keep the service safe.
- Service providers that run FarmFlows for us: database, file storage and hosting, email delivery, phone notifications (Expo and Google Firebase), payments (SSLCommerz, Stripe), error monitoring and the AI provider. They may only use the data to provide their service. We do **not** sell your data and do not share it for advertising.

## Security
Data is sent over encrypted connections (HTTPS) and stored with our database provider, encrypted at rest. Each farm's records can only be read by that farm's members.

## Cookies and storage
We use cookies to keep you signed in and remember your language and theme. We use browser storage for a random visitor ID. We do not use advertising cookies.

## How long we keep it
Farm records stay while your account exists. Page-view statistics are deleted after about 13 months. When you delete your account, its data is deleted straight away; copies in our hosting provider's backups are removed when those backups expire, within 30 days.

## Deleting your account
You can delete your account yourself: in the app (More → Delete account) or on the website (Profile → Delete account). This deletes your account and every farm you own alone, with all its records and photos. Records you entered on other people's farms stay there without your name. If you can't sign in, ask us from the [Contact](/contact) page. Full details: [Delete your account](/delete-account).

## Your choices
You can update your profile, turn reminders on or off, export your data (on plans with export) and delete your account at any time.

## Children
FarmFlows is not meant for children under 13.

## Changes
We may update this policy and will show the new date above.

## Contact
Questions about your data: write to us from the [Contact](/contact) page.
$body$,
  body_bn = $body$_সর্বশেষ হালনাগাদ: নভেম্বর ২০২৬_

এই নীতিতে **FarmFlows** (ওয়েবসাইট farmflows.app ও FarmFlows অ্যান্ড্রয়েড অ্যাপ) কী তথ্য নেয়, কেন নেয় এবং আপনার কী কী সুযোগ আছে তা বলা আছে।

## আমরা কী তথ্য নিই
- **অ্যাকাউন্টের তথ্য:** নাম, ইমেইল, ফোন (ঐচ্ছিক) ও প্রোফাইল ছবি।
- **খামারের রেকর্ড:** আপনি ও আপনার টিম যা লেখেন — পশু ও তাদের ছবি, দুধ, ডিম, স্বাস্থ্য, প্রজনন, ওজন, স্টক, বিক্রি, কর্মী, বেতন ও টাকার হিসাব।
- **প্ল্যানের পেমেন্ট:** প্ল্যান, টাকার পরিমাণ, পদ্ধতি ও আপনার দেওয়া ট্রানজেকশন আইডি। কার্ড ও অনলাইন পেমেন্ট পেমেন্ট সেবা (SSLCommerz বা Stripe) সামলায়; কার্ড নম্বর আমরা দেখি না, রাখিও না।
- **লগইন ও ব্যবহারের তথ্য:** লগইন করা ব্যবহারকারীর আইপি ঠিকানা ও আনুমানিক অবস্থান (দেশ, অঞ্চল, শহর) — হোস্টিং সেবার নেটওয়ার্ক থেকে — এবং প্রতিটি লগইনের সময়।
- **সাইট ভিজিট:** কোন পাতা দেখা হয়েছে, কোন সাইট থেকে এসেছেন, ডিভাইসের ধরন ও দেশ। লগইন না করা ভিজিটরের আইপি **রাখা হয় না**। আপনার ব্রাউজারে একটি এলোমেলো ভিজিটর আইডি রাখা হয়; "Do Not Track" মানা হয়।
- **ত্রুটির রিপোর্ট:** ওয়েবসাইটে কোনো ত্রুটি হলে একটি কারিগরি রিপোর্ট (পাতা, ব্রাউজার ও ত্রুটি) আমাদের ত্রুটি-পর্যবেক্ষণ সেবায় যেতে পারে, যাতে আমরা ঠিক করতে পারি।
- **যোগাযোগ ফর্মে পাঠানো বার্তা** ও আপনার লেখা **রিভিউ**।

## অ্যান্ড্রয়েড অ্যাপ
- **ক্যামেরা:** শুধু যখন আপনি পশুর কানের QR ট্যাগ স্ক্যান করেন বা পশুর/নিজের ছবি তোলেন। পেছনে কিছু রেকর্ড হয় না।
- **ছবি:** অ্যান্ড্রয়েডের ফটো পিকার দিয়ে আপনি ছবি বেছে নেন; অ্যাপ শুধু বেছে নেওয়া ছবিটাই পায়। আপনার গ্যালারি পড়ে না।
- **নোটিফিকেশন:** অনুমতি দিলে অ্যাপ একটি নোটিফিকেশন টোকেন রেজিস্টার করে, যাতে আমরা রিমাইন্ডার (টিকা, প্রসব ইত্যাদি) পাঠাতে পারি। অ্যাপ বা অ্যান্ড্রয়েড সেটিংস থেকে বন্ধ করতে পারেন।
- **আপনার ফোনে:** অফলাইনে কাজ করার জন্য খামারের তথ্যের একটি কপি ফোনে থাকে, লগআউট করলে মুছে যায়। ইন্টারনেট ছাড়া লেখা এন্ট্রি অ্যাকাউন্টে পাঠানো পর্যন্ত ফোনে অপেক্ষা করে।
- অ্যাপ আপনার **লোকেশন, মাইক্রোফোন বা কন্টাক্ট ব্যবহার করে না**, আর কোনো বিজ্ঞাপন নেই।

## কেন ব্যবহার করি
আপনার খামারের অ্যাকাউন্ট চালাতে, নিরাপদ রাখতে (যেমন অস্বাভাবিক লগইন ধরতে), আপনার চাওয়া রিমাইন্ডার পাঠাতে, প্ল্যানের পেমেন্ট নিতে, আপনার বার্তার উত্তর দিতে, সমস্যা ঠিক করতে, সেবা উন্নত করতে এবং অনুমোদিত রিভিউ ওয়েবসাইটে দেখাতে।

## এআই সহকারী
এআই সহকারী ব্যবহার করলে আপনার লেখা ও খামারের সংক্ষিপ্ত তথ্য (যেমন পশুর ট্যাগ নম্বর) FarmFlows নির্বাচিত এআই সেবায় (Google Gemini বা Anthropic Claude) পাঠানো হয় প্রস্তাব তৈরির জন্য। আপনি নিশ্চিত না করা পর্যন্ত কিছুই সংরক্ষিত হয় না।

## কারা আপনার তথ্য দেখতে পায়
- আপনি খামারে যাদের যোগ করেন, তাদের ভূমিকা অনুযায়ী। ডাক্তাররা আয়-ব্যয় দেখতে পান না।
- FarmFlows-এর অ্যাডমিনরা, শুধু সহায়তা দিতে ও সেবা নিরাপদ রাখতে।
- যে সেবাগুলো আমাদের হয়ে FarmFlows চালায়: ডাটাবেস, ফাইল স্টোরেজ ও হোস্টিং, ইমেইল পাঠানো, ফোনের নোটিফিকেশন (Expo ও Google Firebase), পেমেন্ট (SSLCommerz, Stripe), ত্রুটি-পর্যবেক্ষণ ও এআই সেবা। তারা শুধু নিজেদের সেবা দিতেই তথ্য ব্যবহার করতে পারে। আমরা আপনার তথ্য **বিক্রি করি না**, বিজ্ঞাপনের জন্যও কাউকে দিই না।

## নিরাপত্তা
তথ্য এনক্রিপ্ট করা সংযোগে (HTTPS) পাঠানো হয় এবং ডাটাবেস সেবায় এনক্রিপ্ট করে রাখা হয়। প্রতিটি খামারের রেকর্ড শুধু সেই খামারের সদস্যরাই পড়তে পারেন।

## কুকি ও স্টোরেজ
লগইন রাখা এবং ভাষা ও থিম মনে রাখার জন্য কুকি ব্যবহার করি। এলোমেলো ভিজিটর আইডির জন্য ব্রাউজার স্টোরেজ ব্যবহার করি। বিজ্ঞাপনের কুকি ব্যবহার করি না।

## কতদিন রাখি
অ্যাকাউন্ট থাকা পর্যন্ত খামারের রেকর্ড থাকে। পেজ ভিউয়ের হিসাব প্রায় ১৩ মাস পর মুছে ফেলা হয়। অ্যাকাউন্ট মুছলে তার তথ্য সাথে সাথে মুছে যায়; হোস্টিং সেবার ব্যাকআপে থাকা কপি ব্যাকআপের মেয়াদ শেষ হলে, ৩০ দিনের মধ্যে, মুছে যায়।

## অ্যাকাউন্ট মুছে ফেলা
আপনি নিজেই অ্যাকাউন্ট মুছতে পারেন: অ্যাপে (আরও → অ্যাকাউন্ট মুছুন) বা ওয়েবসাইটে (প্রোফাইল → অ্যাকাউন্ট মুছুন)। এতে আপনার অ্যাকাউন্ট এবং আপনি একা যে খামারগুলোর মালিক, সেগুলোর সব রেকর্ড ও ছবি মুছে যায়। অন্যের খামারে আপনার লেখা রেকর্ড সেখানে থেকে যায়, আপনার নাম ছাড়া। লগইন করতে না পারলে [যোগাযোগ](/contact) পাতা থেকে আমাদের জানান। বিস্তারিত: [অ্যাকাউন্ট মুছে ফেলুন](/delete-account)।

## আপনার সুযোগ
যেকোনো সময় প্রোফাইল হালনাগাদ করতে, রিমাইন্ডার চালু বা বন্ধ করতে, তথ্য এক্সপোর্ট করতে (এক্সপোর্টসহ প্ল্যানে) এবং অ্যাকাউন্ট মুছে ফেলতে পারেন।

## শিশু
FarmFlows ১৩ বছরের কম বয়সী শিশুদের জন্য নয়।

## পরিবর্তন
আমরা এই নীতি হালনাগাদ করতে পারি এবং উপরে নতুন তারিখ দেখাব।

## যোগাযোগ
আপনার তথ্য নিয়ে প্রশ্ন থাকলে [যোগাযোগ](/contact) পাতা থেকে লিখুন।
$body$,
  updated_at = now()
where slug = 'privacy'
  and body_en like '%_Last updated: October 2026_%'
  and body_en like '%ask us to delete your account and farm data%';
