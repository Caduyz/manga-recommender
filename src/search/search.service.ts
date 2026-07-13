import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MangaDexService } from '../mangadex/mangadex.service';
import { Prisma } from '@prisma/client';
import { MangaService } from '../manga/manga.service';
import { MangaMapper } from '../mangadex/mappers/manga.mapper';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mangaDexService: MangaDexService,
    private readonly mangaService: MangaService,
  ) {}
  
  // -------------------- Search Methods --------------------
  async search(filters: { title?: string; author?: string; tags?: string[] }) {
    if (filters.title) {
      return this.searchByTitle(filters.title, filters.author, filters.tags);
    }
    return this.searchLocalOnly(filters.author, filters.tags);
  }

  private async searchByTitle(title: string, author?: string, tags?: string[]) {
    const [localResults, externalEntries] = await Promise.all([
      this.prisma.manga.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: title, mode: 'insensitive' } },
                { originalTitle: { contains: title, mode: 'insensitive' } },
              ],
            },
            this.buildAuthorFilter(author),
            this.buildTagFilter(tags),
          ],
        },
        include: { tags: true },
      }),
      this.mangaDexService.searchByTitle(title),
    ]);

    const localIds = new Set(localResults.map((manga) => manga.id));

    const newEntries = Array.from(
      new Map(
        externalEntries
          .filter((entry) => !localIds.has(entry.id))
          .map((entry) => [entry.id, entry]),
      ).values(),
    );

    const stats = await this.mangaDexService.getStatisticsBatch(
      newEntries.map((entry) => entry.id),
    );

    const enriched = newEntries.map((entry) => ({
      ...entry,
      bayesianScore: stats[entry.id] ?? null,
    }));

    const imported = await Promise.all(
      enriched.map((entry) =>
        this.mangaService.upsertFromMangaDex(MangaMapper.toInternal(entry)),
      ),
    );

    return this.rankByTagMatches([...localResults, ...imported], tags);
  }

  private async searchLocalOnly(author?: string, tags?: string[]) {
    const results = await this.prisma.manga.findMany({
      where: {
        AND: [this.buildAuthorFilter(author), this.buildTagFilter(tags)],
      },
      include: { tags: true },
    });

    return this.rankByTagMatches(results, tags);
  }

  // -------------------- Build Methods --------------------
  private buildAuthorFilter(author?: string): Prisma.MangaWhereInput {
    if (!author) return {};
    return {
      OR: [
        {
          authors: {
            some: { name: { contains: author, mode: 'insensitive' } },
          },
        },
        {
          artists: {
            some: { name: { contains: author, mode: 'insensitive' } },
          },
        },
      ],
    };
  }

  private buildTagFilter(tags?: string[]): Prisma.MangaWhereInput {
    if (!tags || tags.length === 0) return {};
    return {
      tags: { some: { name: { in: tags, mode: 'insensitive' } } },
    };
  }

  private rankByTagMatches<T extends { tags: { name: string }[] }>(
    results: T[],
    tags?: string[],
  ): T[] {
    if (!tags || tags.length === 0) return results;

    const lowerTags = tags.map((t) => t.toLowerCase());

    return [...results].sort((a, b) => {
      const countA = a.tags.filter((t) =>
        lowerTags.includes(t.name.toLowerCase()),
      ).length;
      const countB = b.tags.filter((t) =>
        lowerTags.includes(t.name.toLowerCase()),
      ).length;
      return countB - countA;
    });
  }
}
