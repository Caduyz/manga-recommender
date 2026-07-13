import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('title') title?: string,
    @Query('author') author?: string,
    @Query('tag') tag?: string | string[],
  ) {
    const tags = tag ? (Array.isArray(tag) ? tag : [tag]) : undefined;
    return this.searchService.search({ title, author, tags });
  }
}
