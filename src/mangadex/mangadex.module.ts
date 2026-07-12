import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MangaDexService } from './mangadex.service';
import { MangaDexController } from './mangadex.controller';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('MANGADEX_BASE_URL'),
        timeout: 5000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MangaDexController],
  providers: [MangaDexService],
  exports: [MangaDexService],
})
export class MangaDexModule {}
