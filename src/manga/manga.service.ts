import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MangaDexService } from '../manga-dex/manga-dex.service';
import { MangaMapper, MappedManga } from '../manga-dex/mappers/manga.mapper';

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

    return this.prisma.manga.upsert({
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
        dexUpdatedAt: mapped.dexUpdatedAt,
        tags: { set: [], connectOrCreate: tagConnections },
        authors: { set: [], connectOrCreate: authorConnections },
        artists: { set: [], connectOrCreate: artistConnections },
      },
    });
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
      throw new NotFoundException(`Mangá ${id} não encontrado`);
    }

    return manga;
  }
}
