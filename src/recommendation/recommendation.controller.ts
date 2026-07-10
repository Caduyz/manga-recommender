import { Controller, Get } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('random')
  random() {
    return this.recommendationService.getRandomManga();
  }
}
