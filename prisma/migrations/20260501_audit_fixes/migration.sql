-- Migration: audit-fixes
-- Safe enum conversions using USING clause to preserve existing data.
-- Must drop defaults before altering column type, then restore them.

-- 1. Create the new enum types
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "MissionType" AS ENUM ('MAIN', 'SIDE', 'ACHIEVEMENT', 'COLLECTIBLE');
CREATE TYPE "MissionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- 2. Convert Friendship.status (TEXT → FriendshipStatus)
ALTER TABLE "Friendship" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Friendship"
  ALTER COLUMN "status" TYPE "FriendshipStatus"
  USING "status"::"FriendshipStatus";
ALTER TABLE "Friendship"
  ALTER COLUMN "status" SET DEFAULT 'PENDING'::"FriendshipStatus";

-- 3. Convert Mission.type (TEXT → MissionType)
ALTER TABLE "Mission" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Mission"
  ALTER COLUMN "type" TYPE "MissionType"
  USING "type"::"MissionType";
ALTER TABLE "Mission"
  ALTER COLUMN "type" SET DEFAULT 'MAIN'::"MissionType";

-- 4. Convert Mission.difficulty (TEXT → MissionDifficulty, nullable — no default to drop)
ALTER TABLE "Mission"
  ALTER COLUMN "difficulty" TYPE "MissionDifficulty"
  USING "difficulty"::"MissionDifficulty";

-- 5. Add missing index on Friendship.receiverId
CREATE INDEX IF NOT EXISTS "Friendship_receiverId_idx" ON "Friendship"("receiverId");

-- 6. Add missing index on UserGameLibrary.gameId
CREATE INDEX IF NOT EXISTS "UserGameLibrary_gameId_idx" ON "UserGameLibrary"("gameId");

-- 7. Drop the dead achievements JSON column from UserGameDetails
ALTER TABLE "UserGameDetails" DROP COLUMN IF EXISTS "achievements";
