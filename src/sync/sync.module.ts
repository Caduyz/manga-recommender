import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { MangaModule } from '../manga/manga.module';

@Module({
  imports: [MangaModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
