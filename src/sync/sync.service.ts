import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';
import { MangaDexService } from '../mangadex/mangadex.service';
import { MangaMapper } from '../mangadex/mappers/manga.mapper';

@Injectable()
export class SyncService {
  constructor(
    private readonly mangaService: MangaService,
    private readonly mangaDexService: MangaDexService
  ) {}

  async syncManga(id: string) {
    const raw = await this.mangaDexService.getMangaById(id);
    const mapped = MangaMapper.toInternal(raw);
    return this.mangaService.upsertFromMangaDex(mapped);
  }
}
