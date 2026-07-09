-- CreateEnum
CREATE TYPE "Demography" AS ENUM ('SEINEN', 'SHONEN', 'JOSEI', 'SHOJO', 'KODOMOMUKE');

-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('SAFE', 'SUGGESTIVE', 'EROTICA', 'PORNOGRAPHIC');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('READING', 'COMPLETED', 'DROPPED', 'ON_HOLD', 'PLAN_TO_READ');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('GENRE', 'THEME');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manga" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "synopsis" TEXT,
    "publicationYear" INTEGER,
    "averageScore" DOUBLE PRECISION,
    "coverFileName" TEXT,
    "dexCreatedAt" TIMESTAMP(3) NOT NULL,
    "dexUpdatedAt" TIMESTAMP(3) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL,
    "demography" "Demography",
    "contentRating" "ContentRating",

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MangaEntry" (
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL,
    "userScore" INTEGER,
    "chapterProgress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaEntry_pkey" PRIMARY KEY ("userId","mangaId")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TagType" NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagAffinity" (
    "tagAId" TEXT NOT NULL,
    "tagBId" TEXT NOT NULL,
    "intersection" INTEGER NOT NULL,
    "union" INTEGER NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagAffinity_pkey" PRIMARY KEY ("tagAId","tagBId")
);

-- CreateTable
CREATE TABLE "_MangaToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MangaToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MangaAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MangaAuthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MangaArtists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MangaArtists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Manga_title_idx" ON "Manga"("title");

-- CreateIndex
CREATE INDEX "Creator_name_idx" ON "Creator"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "TagAffinity_similarity_idx" ON "TagAffinity"("similarity");

-- CreateIndex
CREATE INDEX "_MangaToTag_B_index" ON "_MangaToTag"("B");

-- CreateIndex
CREATE INDEX "_MangaAuthors_B_index" ON "_MangaAuthors"("B");

-- CreateIndex
CREATE INDEX "_MangaArtists_B_index" ON "_MangaArtists"("B");

-- AddForeignKey
ALTER TABLE "MangaEntry" ADD CONSTRAINT "MangaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaEntry" ADD CONSTRAINT "MangaEntry_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAffinity" ADD CONSTRAINT "TagAffinity_tagAId_fkey" FOREIGN KEY ("tagAId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAffinity" ADD CONSTRAINT "TagAffinity_tagBId_fkey" FOREIGN KEY ("tagBId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaToTag" ADD CONSTRAINT "_MangaToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaToTag" ADD CONSTRAINT "_MangaToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaAuthors" ADD CONSTRAINT "_MangaAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaAuthors" ADD CONSTRAINT "_MangaAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaArtists" ADD CONSTRAINT "_MangaArtists_A_fkey" FOREIGN KEY ("A") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MangaArtists" ADD CONSTRAINT "_MangaArtists_B_fkey" FOREIGN KEY ("B") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
