/*
  Warnings:

  - You are about to drop the column `averageScore` on the `Manga` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Manga" DROP COLUMN "averageScore",
ADD COLUMN     "bayesianScore" DOUBLE PRECISION;
