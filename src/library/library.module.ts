import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { MangaModule } from '../manga/manga.module';

@Module({
  imports: [MangaModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
