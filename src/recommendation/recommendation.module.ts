import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { MangaModule } from '../manga/manga.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryModule } from '../library/library.module';

@Module({
  imports: [MangaModule, PrismaModule, LibraryModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
