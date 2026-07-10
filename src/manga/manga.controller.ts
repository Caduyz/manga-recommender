import { Controller, Post, Param } from '@nestjs/common';
import { MangaService } from './manga.service';

@Controller('mangas')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}
}
