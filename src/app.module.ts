import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MangaDexModule } from './manga-dex/manga-dex.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MangaModule } from './manga/manga.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule, 
    MangaDexModule, PrismaModule, MangaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
