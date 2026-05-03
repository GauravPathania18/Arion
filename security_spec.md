# Security Specification for Arion Focus AI

## 1. Data Invariants
- Each user can only access their own data (`/users/{userId}`).
- A `DayData` record must belong to the authenticated user.
- `SiteUsage` records must belong to a valid `DayData` parent owned by the user.
- `FocusSession` records must belong to the authenticated user.
- Timestamps and IDs must be validated to prevent poisoning or spoofing.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attacker tries to read `/users/victim_uid` while logged in as `attacker_uid`.
2. **PII Leak**: Attacker tries to list all emails from the `/users` collection.
3. **Session Manipulation**: User tries to set `completed: true` for a session they didn't start.
4. **Point Injection**: User tries to update their own `progressionPoints` to 999999 without earning them (though currently clients update this, in a real app, this should be server-side).
5. **ID Poisoning**: User tries to create a document with a 2MB string as an ID.
6. **Shadow Update**: User tries to add `isAdmin: true` to their profile.
7. **Relational Break**: User tries to create `SiteUsage` under a `DayData` ID that doesn't exist.
8. **Bulk Scraping**: Attacker tries to list sessions for all users using a collection group query.
9. **Timestamp Spoofing**: User tries to set `createdAt` in the past.
10. **State Skipping**: (Not applicable yet).
11. **Resource Exhaustion**: User tries to create 10,000 empty site usage records in one second (limited by Firestore native quotas, but rules should check sizes).
12. **Type Poisoning**: User tries to set `timeSpent` as a string instead of a number.

## 3. The Test Runner (Plan)
We will implement `firestore.rules.test.ts` using the Firebase Emulator (conceptually, or as a reference for what to verify).

(Note: Actual test file creation follows in the next steps after rules draft).
