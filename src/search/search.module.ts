import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MangaModule } from '../manga/manga.module';
import { MangaDexModule } from '../mangadex/mangadex.module';

@Module({
  imports: [MangaModule, MangaDexModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
