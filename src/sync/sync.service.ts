import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';

@Injectable()
export class SyncService {
  constructor(private readonly mangaService: MangaService) {}

  async syncManga(id: string) {
    return this.mangaService.syncManga(id);
  }
}
