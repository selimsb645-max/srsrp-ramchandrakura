# Firestore ডেটা স্কিমা

সব ডকুমেন্টে স্বয়ংক্রিয়ভাবে যোগ করুন:
`createdAt`, `updatedAt` (Timestamp), `published` (boolean, পাবলিক দেখাবে কি না)।

## committee/{docId}

```json
{
  "nameBn": "নাম (বাংলা)",
  "nameEn": "Name (English, optional)",
  "role": "president | vice_president | general_secretary | joint_secretary | organizing_secretary | treasurer | office_secretary | publicity_secretary | member",
  "roleTitleBn": "ঐচ্ছিক কাস্টম পদবি",
  "roleTitleEn": "optional",
  "photoUrl": "https://…",
  "order": 1,
  "termBn": "২০২৫–২০২৭",
  "verification": "verified",
  "published": true
}
```

`order` ছোট সংখ্যা আগে দেখাবে। `verification` = `"pending"` হলে UI-তে “যাচাই বাকি” চিহ্ন।

## members/{uid}

ডকুমেন্ট আইডি = Firebase Auth UID (অ্যাকাউন্টধারী সদস্যের জন্য)।
পাবলিক ডকুমেন্টে **কখনো** ফোন/ইমেইল রাখবেন না।

```json
{
  "memberCode": "RSK-RC-0001",
  "nameBn": "নাম",
  "nameEn": "Name",
  "school": "…",
  "className": "…",
  "ward": "5",
  "village": "…",
  "photoUrl": "https://…",
  "status": "active | inactive | pending",
  "role": "member | admin",
  "isMinor": true,
  "uid": "<auth uid>",
  "published": true
}
```

ব্যক্তিগত তথ্য আলাদা সাবকালেকশনে:

```
members/{uid}/private/contact
{
  "phone": "01XXXXXXXXX",
  "email": "…",
  "guardianName": "…",
  "dateOfBirth": "2012-05-01"
}
```

রুলস: এই সাবকালেকশন শুধু ডকুমেন্টের মালিক ও অ্যাডমিন পড়তে পারে।

## activities/{docId}

```json
{
  "titleBn": "…", "titleEn": "…",
  "summaryBn": "…", "summaryEn": "…",
  "bodyBn": "…", "bodyEn": "…",
  "category": "education | sports | culture | health | social | environment | other",
  "date": "2026-11-01",
  "locationBn": "…",
  "coverImageUrl": "https://…",
  "published": true
}
```

## events/{docId}

```json
{
  "titleBn": "…", "titleEn": "…",
  "descriptionBn": "…", "descriptionEn": "…",
  "startAt": "2026-12-16T10:00:00+06:00",
  "endAt": "2026-12-16T13:00:00+06:00",
  "venueBn": "…", "venueEn": "…",
  "registrationOpen": false,
  "published": true
}
```

## notices/{docId}

```json
{
  "titleBn": "…", "titleEn": "…",
  "bodyBn": "…", "bodyEn": "…",
  "date": "2026-11-10",
  "priority": "normal | important | urgent",
  "attachmentUrl": "https://…",
  "published": true
}
```

## gallery/{docId}

```json
{
  "titleBn": "…", "titleEn": "…",
  "imageUrl": "https://…",
  "albumBn": "…",
  "takenAt": "2026-10-18",
  "credit": "…",
  "published": true
}
```

## contactMessages/{docId} — শুধু `create` পাবলিক

```json
{ "name": "…", "email": "…", "phone": "…", "subject": "…", "message": "…", "handled": false }
```

## joinRequests/{docId} — শুধু `create` পাবলিক

```json
{
  "nameBn": "…", "guardianName": "…", "dateOfBirth": "…",
  "school": "…", "className": "…", "ward": "…", "village": "…",
  "phone": "…", "email": "…", "motivation": "…", "status": "pending"
}
```

## settings/app

```json
{ "noticeBanner": "", "contactOverride": {} }
```
