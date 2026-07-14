import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

const STUB_USER_ID = '@admin^';

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

  @Get('library')
  findPersonalized() {
    return this.recommendationService.findPersonalized(STUB_USER_ID);
  }
}
