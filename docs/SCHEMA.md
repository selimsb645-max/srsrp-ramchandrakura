# Firestore ডেটা স্কিমা (Phase 2 — Firebase integration)

সব ডকুমেন্টে: `createdAt`, `updatedAt`। পাবলিক কনটেন্টে `published` (boolean) এবং
কনটেন্ট লেখকের ক্ষেত্রে `createdBy` (uid) বাধ্যতামূলক — রুলস এটি যাচাই করে।

## ১. `users/{uid}` — অ্যাকাউন্ট (ডকুমেন্ট আইডি = Firebase Auth UID)

```json
{
  "uid": "<auth uid>",
  "nameBn": "নাম",
  "nameEn": "Name",
  "memberCode": "RSK-RC-0001",
  "ward": "5",
  "village": "…",
  "school": "…",
  "className": "…",
  "photoUrl": "https://…",
  "role": "member | editor | admin | super_admin",
  "status": "pending | active | suspended",
  "published": true,
  "approvedBy": "<admin uid>",
  "approvedAt": "<timestamp>",

  "designationBn": "সাংগঠনিক পদবি — যেমন সদস্য / সাংগঠনিক সম্পাদক",
  "joinedAt": "<timestamp — যোগদানের তারিখ>",
  "cardIssuedAt": "<timestamp — আইডি কার্ড ইস্যুর তারিখ>",
  "cardExpiresAt": "<timestamp — কার্ডের মেয়াদ শেষ>"
}
```

* আইডি কার্ডের চারটি ঘর (`designationBn`, `joinedAt`, `cardIssuedAt`, `cardExpiresAt`) কেবল
  admin/super_admin বদলাতে পারে; সদস্য নিজের ডকুমেন্টেও এগুলো লিখতে পারবে না (রুলস বন্ধ করে রাখে)।
* `designationBn` খালি থাকলে কার্ডে "সদস্য" ছাপা হয়। `cardExpiresAt` না থাকলে
  `cardIssuedAt` (বা `joinedAt`) + `site.membership.cardTermYears` (এখন ২ বছর) ধরা হয়।

* `role` ও `status` কেবল অনুমোদিত ভূমিকা বদলাতে পারে (super_admin) বা অনুমোদন দিতে পারে (admin)।
  সদস্য নিজে কখনোই বদলাতে পারবে না — রুলস সরাসরি প্রত্যাখ্যান করে।
* পাবলিক ডিরেক্টরি শুধু `published == true` অ্যাকাউন্ট পড়ে এবং সেখানেও ফোন/ইমেইল থাকে না।

### `users/{uid}/private/contact` — ব্যক্তিগত তথ্য

```json
{ "phone": "01XXXXXXXXX", "email": "…", "guardianName": "…", "dateOfBirth": "2012-05-01" }
```

শুধু ডকুমেন্টের মালিক ও admin পড়তে পারে। এখানেই ফোন, ইমেইল, অভিভাবকের নাম, জন্মতারিখ থাকে —
`users/{uid}`-তে কখনো নয়।

## ২. `membershipApplications/{id}`

```json
{
  "uid": "<auth uid, ঐচ্ছিক>",
  "fullName": "…", "guardianName": "…", "dateOfBirth": "…",
  "school": "…", "className": "…", "ward": "…", "village": "…",
  "phone": "01XXXXXXXXX", "email": "…", "motivation": "…",
  "status": "pending | approved | rejected",
  "reviewedBy": "<admin uid>", "reviewedAt": "<timestamp>"
}
```

* যে কেউ আবেদন করতে পারে, কিন্তু `status` কেবল `pending` দিয়েই তৈরি হয়।
* পড়া ও পর্যালোচনা কেবল admin। আবেদনকারীর নিজের দেওয়া তথ্য (নাম, ফোন) বদলানো যায় না।
* অনুমোদন করলে সংশ্লিষ্ট `users/{uid}` সক্রিয় (`status: active`, `published: true`) হয় এবং
  `auditLogs`-এ একটি এন্ট্রি যায়। Cloud Function ছাড়াই, তাই Spark প্ল্যানেই চলে।

## ৩. `committees/{id}`

```json
{
  "nameBn": "…", "nameEn": "…",
  "role": "president | vice_president | general_secretary | joint_secretary | organizing_secretary | treasurer | office_secretary | publicity_secretary | member",
  "roleTitleBn": "…", "roleTitleEn": "…", "photoUrl": "…",
  "order": 1, "termBn": "২০২৫–২০২৭",
  "verification": "pending | verified",
  "published": true, "createdBy": "<uid>"
}
```

## ৪. `notices/{id}`

```json
{
  "titleBn": "…", "titleEn": "…", "bodyBn": "…", "bodyEn": "…",
  "date": "2026-11-10", "priority": "normal | important | urgent",
  "attachmentUrl": "…", "published": true, "createdBy": "<uid>"
}
```

## ৫. `events/{id}`

```json
{
  "titleBn": "…", "titleEn": "…", "descriptionBn": "…", "descriptionEn": "…",
  "startAt": "2026-12-16T10:00:00+06:00", "endAt": "…",
  "venueBn": "…", "venueEn": "…",
  "registrationOpen": false, "published": true, "createdBy": "<uid>"
}
```

## ৬. `activities/{id}`

```json
{
  "titleBn": "…", "summaryBn": "…", "bodyBn": "…",
  "category": "education | sports | culture | health | social | environment | other",
  "date": "2026-11-01", "locationBn": "…", "coverImageUrl": "…",
  "published": true, "createdBy": "<uid>"
}
```

## ৭. `gallery/{id}`

```json
{ "titleBn": "…", "imageUrl": "https://…", "albumBn": "…", "takenAt": "2026-10-18",
  "credit": "…", "published": true, "createdBy": "<uid>" }
```

## ৮. `contactMessages/{id}`

```json
{ "name": "…", "email": "…", "phone": "…", "subject": "…", "message": "…", "handled": false }
```

পাবলিক `create` (যাচাইসহ), `read/update` কেবল admin, `delete` কেবল super_admin।

## ৯. `auditLogs/{id}` — append-only

```json
{
  "actorUid": "<uid>", "actorRole": "admin",
  "action": "membership.approved | user.role_changed | user.status_changed | …",
  "targetType": "user | membershipApplication | notice | event | activity | gallery",
  "targetId": "…", "detail": "member → editor",
  "createdAt": "2026-11-15T12:00:00.000Z"
}
```

`update`/`delete` কখনোই অনুমোদিত নয় — অডিট ট্রেইল মুছে ফেলা সম্ভব না।

## ১০. `settings/{docId}`

পাবলিক পড়া, লেখা কেবল super_admin।

---

## Phase 1 → Phase 2 কালেকশন নাম বদল

| Phase 1 | Phase 2 |
|---|---|
| `members` | `users` (+ `users/{uid}/private/contact`) |
| `committee` | `committees` |
| `joinRequests` | `membershipApplications` |

পুরনো ডেটা থাকলে Firestore Console থেকে ডকুমেন্ট কপি করে নতুন কালেকশনে নিন, অথবা
`src/services/collections.ts`-এর `LEGACY_COLLECTIONS` ম্যাপ দেখে স্ক্রিপ্ট লিখুন।
