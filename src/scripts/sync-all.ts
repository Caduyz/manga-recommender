import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MangaService } from '../manga/manga.service';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mangaService = app.get(MangaService);
  const prisma = app.get(PrismaService);

  const allManga = await prisma.manga.findMany({
    select: { id: true, title: true },
  });

  console.log(`Found ${allManga.length} mangas to resynchronize.`);

  let success = 0;
  let failed = 0;

for (const [index, manga] of allManga.entries()) {
    try {
        await mangaService.syncManga(manga.id);
        success++;
        console.log(`[${index + 1}/${allManga.length}] OK: ${manga.title}`);
    } catch (error) {
        failed++;
        console.error(`[${index + 1}/${allManga.length}] FALHOU: ${manga.title}`, (error as Error).message);
    }

    await new Promise((resolve) => setTimeout(resolve, 300)); // pausa entre cada mangá
    }

  console.log(`Completed. Sucess: ${success}, Faileds: ${failed}.`);
  await app.close();
}

bootstrap();