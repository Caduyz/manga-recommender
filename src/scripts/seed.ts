import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MangaDexService } from '../mangadex/mangadex.service';
import { MangaService } from '../manga/manga.service';
import { MangaMapper } from '../mangadex/mappers/manga.mapper';

const ORDERINGS = ['rating', 'followedCount', 'createdAt'] as const;
const LIMIT_PER_ORDER = 10;
const PERSIST_BATCH_SIZE = 25;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const mangaDexService = app.get(MangaDexService);
    const mangaService = app.get(MangaService);

    const tags = await mangaDexService.getTags();
    console.log(`Found ${tags.length} tags. Starting discovery...`);

    const discovered = new Map<string, any>();

    for (const [index, tag] of tags.entries()) {
      for (const orderBy of ORDERINGS) {
        try {
          const entries = await mangaDexService.searchByTag(
            tag.id,
            orderBy,
            LIMIT_PER_ORDER,
          );
          for (const entry of entries) {
            discovered.set(entry.id, entry);
          }
        } catch (error) {
          console.error(
            `Failed to retrieve tag ${tag.name} (${orderBy})`,
            (error as Error).message,
          );
        }
      }
      console.log(
        `[${index + 1}/${tags.length}] ${tag.name}: ${discovered.size} unique ones so far.`,
      );
    }

    console.log(`Discovery complete: ${discovered.size} unique manga.`);

    const ids = Array.from(discovered.keys());

    let stats: Record<string, number | null> = {};
    try {
      stats = await mangaDexService.getStatisticsBatch(ids);
    } catch (error) {
      console.error(
        'Failed to fetch batch statistics; proceeding without them.',
        (error as Error).message,
      );
    }

    const enriched = ids.map((id) => ({
      ...discovered.get(id),
      bayesianScore: stats[id] ?? null,
    }));

    console.log('Persisting on the database...');

    let success = 0;
    let failed = 0;

    for (let i = 0; i < enriched.length; i += PERSIST_BATCH_SIZE) {
      const batch = enriched.slice(i, i + PERSIST_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((entry) =>
          mangaService.upsertFromMangaDex(MangaMapper.toInternal(entry)),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') success++;
        else {
          failed++;
          console.error('Failed to persist:', result.reason);
        }
      }

      console.log(
        `Persisted ${Math.min(i + PERSIST_BATCH_SIZE, enriched.length)}/${enriched.length}`,
      );
    }

    console.log(`Completed. Sucess: ${success}, Faileds: ${failed}.`);
  } finally {
    await app.close();
  }
}

bootstrap();
