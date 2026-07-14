import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('random')
  random() {
    return this.recommendationService.getRandomManga();
  }

  @Get('similar/:mangaId')
  findSimilar(@Param('mangaId') mangaId: string) {
    return this.recommendationService.findSimilar(mangaId);
  }
}
