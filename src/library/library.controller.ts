import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';

const STUB_USER_ID = '@admin^';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  async findAll() {
    return this.libraryService.findUserLibrary(STUB_USER_ID);
  }

  @Post()
  async create(@Body() dto: CreateLibraryDto) {
    return this.libraryService.addToLibrary(STUB_USER_ID, dto);
  }

  @Patch(':mangaId')
  async update(
    @Param('mangaId') mangaId: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.libraryService.updateLibraryEntry(STUB_USER_ID, mangaId, dto);
  }
}
