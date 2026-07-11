-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED');

-- AlterTable
ALTER TABLE "Manga" ADD COLUMN     "publicationStatus" "PublicationStatus";
