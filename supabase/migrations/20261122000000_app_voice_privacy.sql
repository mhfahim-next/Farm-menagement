-- The app's AI assistant can be spoken to: the microphone is used only when the
-- person taps the mic, and Android's speech service turns it into text. Update
-- the privacy policy wording shipped with 20261118000000_privacy_app.sql (an
-- edited policy is left alone).
update public.site_pages set
  body_en = replace(body_en,
    '- The app does **not** use your location, microphone or contacts, and has no ads.',
    '- **Microphone:** only when you tap the mic in the AI assistant. Your phone''s speech service (on Android, Google''s) turns what you say into text; the app receives only the text and sends it to the assistant like a typed message. No recording is kept.
- The app does **not** use your location or contacts, and has no ads.'),
  body_bn = replace(body_bn,
    '- অ্যাপ আপনার **লোকেশন, মাইক্রোফোন বা কন্টাক্ট ব্যবহার করে না**, আর কোনো বিজ্ঞাপন নেই।',
    '- **মাইক্রোফোন:** শুধু এআই সহকারীতে মাইকে চাপ দিলে। আপনার ফোনের কথা-থেকে-লেখা সেবা (অ্যান্ড্রয়েডে Google-এর) আপনার কথাকে লেখায় বদলায়; অ্যাপ শুধু লেখাটা পায় আর টাইপ করা বার্তার মতোই সহকারীকে পাঠায়। কোনো রেকর্ডিং রাখা হয় না।
- অ্যাপ আপনার **লোকেশন বা কন্টাক্ট ব্যবহার করে না**, আর কোনো বিজ্ঞাপন নেই।')
where slug = 'privacy';
