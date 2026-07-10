import { Module } from '@nestjs/common';
import { MangaDexModule } from '../manga-dex/manga-dex.module';
import { MangaService } from './manga.service';
import { MangaController } from './manga.controller';

@Module({
  imports: [MangaDexModule],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule {}
