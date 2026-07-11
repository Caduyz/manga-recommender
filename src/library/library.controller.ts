import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post()
  async create(@Body() dto: CreateLibraryDto) {
    const userId = '@admin^';

    return this.libraryService.addToLibrary(userId, dto);
  }

  @Patch(':mangaId')
  async update(
    @Param('mangaId') mangaId: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    const userId = '@admin^';

    return this.libraryService.updateLibraryEntry(userId, mangaId, dto);
  }
}
