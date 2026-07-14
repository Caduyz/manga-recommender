import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);

    console.log('Loading manga and their tags...');
    const mangas = await prisma.manga.findMany({
      select: { id: true, tags: { select: { id: true } } },
    });

    // Etapa 2 — Map<TagId, Set<MangaId>>
    const tagToMangas = new Map<string, Set<string>>();

    for (const manga of mangas) {
      for (const tag of manga.tags) {
        if (!tagToMangas.has(tag.id)) {
          tagToMangas.set(tag.id, new Set());
        }
        tagToMangas.get(tag.id)!.add(manga.id);
      }
    }

    const tagIds = Array.from(tagToMangas.keys());
    console.log(`${tagIds.length} tags with at least one associated manga.`);

    // Etapa 3 — para cada combinação única de tags
    const affinities: {
      tagAId: string;
      tagBId: string;
      intersection: number;
      union: number;
      similarity: number;
    }[] = [];

    for (let i = 0; i < tagIds.length; i++) {
      for (let j = i + 1; j < tagIds.length; j++) {
        const setA = tagToMangas.get(tagIds[i])!;
        const setB = tagToMangas.get(tagIds[j])!;

        let intersectionCount = 0;
        for (const mangaId of setA) {
          if (setB.has(mangaId)) intersectionCount++;
        }

        if (intersectionCount === 0) continue; // sem co-ocorrência, não vale a pena manter

        const unionCount = setA.size + setB.size - intersectionCount;
        if (unionCount === 0) continue;

        const [tagAId, tagBId] = [tagIds[i], tagIds[j]].sort();

        affinities.push({
          tagAId,
          tagBId,
          intersection: intersectionCount,
          union: unionCount,
          similarity: intersectionCount / unionCount,
        });
      }
    }

    console.log(`${affinities.length} pairs with calculated affinity (of a theoretical maximum of ${(tagIds.length * (tagIds.length - 1)) / 2}).`);

    // Etapa 4 — regenerar a tabela inteira
    console.log('Persisting...');
    await prisma.$transaction([
      prisma.tagAffinity.deleteMany({}),
      prisma.tagAffinity.createMany({ data: affinities }),
    ]);

    console.log('Completed.');
  } finally {
    await app.close();
  }
}

bootstrap();