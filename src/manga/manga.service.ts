import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MangaDexService } from '../manga-dex/manga-dex.service';
import { MangaMapper, MappedManga } from '../manga-dex/mappers/manga.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class MangaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mangaDexService: MangaDexService,
  ) {}

  async syncManga(id: string) {
    const raw = await this.mangaDexService.getMangaById(id);
    const mapped = MangaMapper.toInternal(raw);
    return this.upsertFromMangaDex(mapped);
  }

  private async upsertFromMangaDex(mapped: MappedManga) {
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
          averageScore: mapped.averageScore,
          lastChapter: mapped.lastChapter,
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
          averageScore: mapped.averageScore,
          lastChapter: mapped.lastChapter,
          coverFileName: mapped.coverFileName,
          demography: mapped.demography,
          contentRating: mapped.contentRating,
          publicationStatus: mapped.publicationStatus,
          dexUpdatedAt: mapped.dexUpdatedAt,
          tags: { set: [], connectOrCreate: tagConnections },
          authors: { set: [], connectOrCreate: authorConnections },
          artists: { set: [], connectOrCreate: artistConnections },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.log('P2002 to', mapped.id);

        return this.prisma.manga.findUniqueOrThrow({
          where: { id: mapped.id },
        });
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

  async findByTitle(query: string) {
    // Busca simultaneamente no banco local e no MangaDex
    const [localResults, externalEntries] = await Promise.all([
      this.prisma.manga.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { originalTitle: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
      this.mangaDexService.searchByTitle(query),
    ]);

    // Identifica os mangás já presentes no banco local
    const localIds = new Set(localResults.map((manga) => manga.id));

    // Remove resultados já existentes e elimina possíveis duplicatas retornadas pela API externa
    const newEntries = Array.from(
      new Map(
        externalEntries
          .filter((entry) => !localIds.has(entry.id))
          .map((entry) => [entry.id, entry]),
      ).values(),
    );

    // Busca estatísticas apenas dos mangás que ainda não foram importados
    const stats = await this.mangaDexService.getStatisticsBatch(
      newEntries.map((entry) => entry.id),
    );

    // Adiciona as estatísticas aos dados vindos do MangaDex
    const enriched = newEntries.map((entry) => ({
      ...entry,
      averageScore: stats[entry.id] ?? null,
    }));

    // Importa os novos mangás para o banco local
    const imported = await Promise.all(
      enriched.map((entry) =>
        this.upsertFromMangaDex(MangaMapper.toInternal(entry)),
      ),
    );

    // Retorna os mangás locais juntamente com os recém-importados.
    return [...localResults, ...imported];
  }
}
