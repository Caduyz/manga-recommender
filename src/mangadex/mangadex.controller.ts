import { Controller, Get, Param } from '@nestjs/common';
import { MangaDexService } from './mangadex.service';
import { MangaMapper } from './mappers/manga.mapper';

@Controller('manga-dex')
export class MangaDexController {
  constructor(private readonly mangaDexService: MangaDexService) {}

  @Get('manga/:id')
  async getManga(@Param('id') id: string) {
    const raw = await this.mangaDexService.getMangaById(id);

    return MangaMapper.toInternal(raw);
  }
}
