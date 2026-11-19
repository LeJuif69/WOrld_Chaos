# WORLD CHAOS — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership Isolation**: No player can read, list, create, update, or delete another player's `/users/{userId}/saves/{saveId}` document.
2. **Verified Identity**: All writes require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Zero PII on Leaderboard**: `/leaderboard/{userId}` never stores email addresses, phone numbers, or tokens; `displayName` is strictly bounded to 1–32 characters.
4. **Immutable Ownership & Temporal Integrity**: `ownerId` must equal `request.auth.uid` and match the path `{userId}` on create, and remain immutable on update. `updatedAt` must equal `request.time` on every write.
5. **Anti-Poisoning Bounds**: Every string has `.size()` bounds, every ID matches `^[a-zA-Z0-9_\\-]+$`, arrays (`playerPosition`, `inventory`) and maps (`quests`, `worldState`) have strict size limits.

## 2. "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read or write on `/users/u1/saves/world_1`.
2. Unverified email write (`email_verified: false`) on `/users/u1/saves/world_1` or `/leaderboard/u1`.
3. Cross-user read/write: `uid: "u2"` reading or writing `/users/u1/saves/world_1`.
4. Identity spoofing: `uid: "u1"` writing `ownerId: "u2"` inside `/users/u1/saves/world_1`.
5. Shadow field injection: adding `isAdmin: true` or `premiumBypass: true` to `/leaderboard/u1`.
6. Oversized `displayName` (33+ chars) on `/leaderboard/u1`.
7. Client-forged timestamp (`updatedAt: "2020-01-01T00:00:00Z"`) instead of `request.time`.
8. Path ID poisoning (`saveId` > 128 chars or containing invalid symbols).
9. Invalid numeric range (`level: 999` or `hp: -50` or `xp: -10`).
10. Unbounded inventory array (`inventory.size() > 30`).
11. Mutating `ownerId` during `update` on `/leaderboard/u1`.
12. Writing to `/test/connection` or any undeclared collection path.
