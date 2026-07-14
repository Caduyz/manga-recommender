import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';

@Injectable()
export class RecommendationService {
  constructor(private readonly mangaService: MangaService) {}

  async getRandomManga() {
    return this.mangaService.findRandom();
  }

  async findSimilar(mangaId: string, limit = 10) {
    const target = await this.mangaService.findLocalByIdWithTags(mangaId);
    const targetTagIds = target.tags.map((tag) => tag.id);

    if (targetTagIds.length === 0) return [];

    const candidates = await this.mangaService.findCandidatesByTagIds(
      targetTagIds,
      mangaId,
    );
    const targetSet = new Set(targetTagIds);

    const scored = candidates.map((candidate) => {
      const candidateSet = new Set(candidate.tags.map((tag) => tag.id));

      let intersection = 0;
      for (const id of targetSet) {
        if (candidateSet.has(id)) intersection++;
      }

      const union = targetSet.size + candidateSet.size - intersection;
      const similarity = union === 0 ? 0 : intersection / union;

      return { manga: candidate, similarity };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((entry) => entry.manga);
  }
}
