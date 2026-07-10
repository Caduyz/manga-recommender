import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { MangaModule } from '../manga/manga.module';

@Module({
  imports: [MangaModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
