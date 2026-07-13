import { Controller, Post, Param, Get, Query } from '@nestjs/common';
import { MangaService } from './manga.service';

@Controller('mangas')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.mangaService.findLocalById(id);
  }
}
