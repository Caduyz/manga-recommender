import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStatus } from '@prisma/client';
import { SyncService } from '../sync/sync.service';

const STALE_THRESHOLD_HOURS = 24;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncService = app.get(SyncService);
  const prisma = app.get(PrismaService);

  const threshold = new Date(
    Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  const staleOngoing = await prisma.manga.findMany({
    where: {
      publicationStatus: PublicationStatus.ONGOING,
      updatedAt: { lt: threshold },
    },
    select: { id: true, title: true },
  });

  console.log(`Found ${staleOngoing.length} mangas ongoing to resynchronize.`);

  let success = 0;
  let failed = 0;

  for (const [index, manga] of staleOngoing.entries()) {
    try {
      await syncService.syncManga(manga.id);
      success++;
      console.log(`[${index + 1}/${staleOngoing.length}] OK: ${manga.title}`);
    } catch (error) {
      failed++;
      console.error(
        `[${index + 1}/${staleOngoing.length}] FAILED: ${manga.title}`,
        (error as Error).message,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 300)); // pausa entre cada mangá
  }

  console.log(`Completed. Sucess: ${success}, Faileds: ${failed}.`);
  await app.close();
}

bootstrap();
