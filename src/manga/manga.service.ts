import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MappedManga } from '../mangadex/mappers/manga.mapper';
import { Manga, Prisma, Tag } from '@prisma/client';

@Injectable()
export class MangaService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromMangaDex(
    mapped: MappedManga,
    isRetry = false,
  ): Promise<Manga & { tags: Tag[] }> {
    const tagConnections = mapped.tags.map((tag) => ({
      where: { id: tag.id },
      create: { id: tag.id, name: tag.name, type: tag.type },
    }));

    const authorConnections = mapped.authors.map((author) => ({
      where: { id: author.id },
      create: { id: author.id, name: author.name },
    }));

    const artistConnections = mapped.artists.map((artist) => ({
      where: { id: artist.id },
      create: { id: artist.id, name: artist.name },
    }));

    try {
      return await this.prisma.manga.upsert({
        where: { id: mapped.id },
        create: {
          id: mapped.id,
          title: mapped.title,
          originalTitle: mapped.originalTitle,
          synopsis: mapped.synopsis,
          publicationYear: mapped.publicationYear,
          bayesianScore: mapped.bayesianScore,
          lastChapter: mapped.lastChapter,
          lastReleasedChapter: mapped.latestReleasedChapter,
          coverFileName: mapped.coverFileName,
          demography: mapped.demography,
          contentRating: mapped.contentRating,
          publicationStatus: mapped.publicationStatus,
          dexCreatedAt: mapped.dexCreatedAt,
          dexUpdatedAt: mapped.dexUpdatedAt,
          importedAt: new Date(),
          tags: { connectOrCreate: tagConnections },
          authors: { connectOrCreate: authorConnections },
          artists: { connectOrCreate: artistConnections },
        },
        update: {
          title: mapped.title,
          originalTitle: mapped.originalTitle,
          synopsis: mapped.synopsis,
          publicationYear: mapped.publicationYear,
          bayesianScore: mapped.bayesianScore,
          lastChapter: mapped.lastChapter,
          lastReleasedChapter: mapped.latestReleasedChapter,
          coverFileName: mapped.coverFileName,
          demography: mapped.demography,
          contentRating: mapped.contentRating,
          publicationStatus: mapped.publicationStatus,
          dexUpdatedAt: mapped.dexUpdatedAt,
          tags: { set: [], connectOrCreate: tagConnections },
          authors: { set: [], connectOrCreate: authorConnections },
          artists: { set: [], connectOrCreate: artistConnections },
        },
        include: { tags: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        !isRetry
      ) {
        // Tenta novamente o upsert
        return this.upsertFromMangaDex(mapped, true);
      }
      throw error;
    }
  }

  async findRandom() {
    const count = await this.prisma.manga.count();

    if (count === 0) throw new NotFoundException('No manga found.');

    const randomIndex = Math.floor(Math.random() * count);

    return this.prisma.manga.findFirst({
      skip: randomIndex,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findLocalById(id: string) {
    const manga = await this.prisma.manga.findUnique({ where: { id } });

    if (!manga) {
      throw new NotFoundException(`Manga ${id} not found.`);
    }

    return manga;
  }

  async findLocalByIdWithTags(id: string) {
    const manga = await this.prisma.manga.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!manga) {
      throw new NotFoundException(`Manga ${id} not found.`);
    }

    return manga;
  }

  async findCandidatesByTagIds(tagIds: string[], excludeIds: string[]) {
    return this.prisma.manga.findMany({
      where: {
        id: { notIn: excludeIds },
        tags: { some: { id: { in: tagIds } } },
      },
      include: { tags: true },
    });
  }
}
