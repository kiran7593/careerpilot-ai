-- Create the SkillProgress enum.
CREATE TYPE "SkillProgress" AS ENUM (
    'Not Started',
    'In Progress',
    'Completed'
);

-- Remove the existing text default.
ALTER TABLE "SkillStatus"
ALTER COLUMN "status" DROP DEFAULT;

-- Convert the existing text column to the enum.
ALTER TABLE "SkillStatus"
ALTER COLUMN "status" TYPE "SkillProgress"
USING ("status"::"SkillProgress");

-- Restore the default using the enum.
ALTER TABLE "SkillStatus"
ALTER COLUMN "status" SET DEFAULT 'Not Started'::"SkillProgress";