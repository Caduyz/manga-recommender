import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly mangaService: MangaService,
  ) {}
  
  async getRandomManga() {
    return this.mangaService.findRandom();
  }
}

