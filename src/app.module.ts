import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MangaDexModule } from './mangadex/mangadex.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MangaModule } from './manga/manga.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { SyncModule } from './sync/sync.module';
import { LibraryModule } from './library/library.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    MangaDexModule,
    PrismaModule,
    MangaModule,
    RecommendationModule,
    SyncModule,
    LibraryModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
