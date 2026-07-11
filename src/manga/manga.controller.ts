import { Controller, Post, Param, Get, Query } from '@nestjs/common';
import { MangaService } from './manga.service';

@Controller('mangas')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}

  @Get('search')
  findByTitle(@Query('title') title: string) {
    return this.mangaService.findByTitle(title);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.mangaService.findLocalById(id);
  }
}
