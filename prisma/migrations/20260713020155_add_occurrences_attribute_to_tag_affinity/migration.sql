/*
  Warnings:

  - Added the required column `occurrences` to the `TagAffinity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TagAffinity" ADD COLUMN     "occurrences" INTEGER NOT NULL;
