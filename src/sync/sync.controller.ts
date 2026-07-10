import { Controller, Param, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('manga/:id')
  sync(@Param('id') id: string) {
    return this.syncService.syncManga(id);
  }
}
