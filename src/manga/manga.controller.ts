import { Controller, Post, Param } from '@nestjs/common';
import { MangaService } from './manga.service';

@Controller('manga')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}

  // endpoint temporário pra debug (não vai se manter nesse controller)
  @Post('import/:id')
  import(@Param('id') id: string) {
    return this.mangaService.importFromMangaDex(id);
  }
}