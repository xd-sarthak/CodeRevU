/*
  Warnings:

  - You are about to drop the column `reiewCounts` on the `UserUsage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserUsage" DROP COLUMN "reiewCounts",
ADD COLUMN     "reviewCounts" JSONB NOT NULL DEFAULT '{}';
