import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';
import { LibraryService } from '../library/library.service';
import { ReadingStatus, TagType } from '@prisma/client';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly mangaService: MangaService,
    private readonly libraryService: LibraryService,
  ) {}

  async getRandomManga() {
    return this.mangaService.findRandom();
  }

  async findSimilar(mangaId: string, limit = 10) {
    const target = await this.mangaService.findLocalByIdWithTags(mangaId);
    const targetTagIds = target.tags.map((tag) => tag.id);

    if (targetTagIds.length === 0) return [];

    const candidates = await this.mangaService.findCandidatesByTagIds(targetTagIds, [mangaId]);
    
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

  private isScorableTagType(type: TagType): boolean {
    return type !== TagType.FORMAT;
  }

  async findPersonalized(userId: string, limit = 20) {
    const entries = await this.libraryService.findUserEntriesWithTags(userId);
    const excludeIds = entries.map((entry) => entry.mangaId);

    const sources = entries
      .map((entry) => {
        let sign: number | null = null;
        if (entry.userScore !== null) sign = entry.userScore - 5;
        else if (entry.status === ReadingStatus.DROPPED) sign = -3;
        if (sign === null || sign === 0) return null;

        const tagIds = entry.manga.tags
          .filter((tag) => this.isScorableTagType(tag.type))
          .map((tag) => tag.id);
        if (tagIds.length === 0) return null;

        return { sign, tagSet: new Set(tagIds) };
      })
      .filter((s): s is { sign: number; tagSet: Set<string> } => s !== null);

    if (sources.length === 0) return [];

    const allRelevantTagIds = Array.from(
      new Set(sources.flatMap((source) => Array.from(source.tagSet))),
    );

    const candidates = await this.mangaService.findCandidatesByTagIds(allRelevantTagIds, excludeIds);

    const perSourceRankings = sources.map((source) => {
      return candidates
        .map((candidate) => {
          const candidateSet = new Set(
            candidate.tags
              .filter((tag) => this.isScorableTagType(tag.type))
              .map((tag) => tag.id),
          );

          let intersection = 0;
          for (const id of source.tagSet) {
            if (candidateSet.has(id)) intersection++;
          }
          if (intersection === 0) return null;

          const union = source.tagSet.size + candidateSet.size - intersection;
          const similarity = union === 0 ? 0 : intersection / union;
          const score = source.sign * similarity;

          return score > 0 ? { manga: candidate, score } : null;
        })
        .filter((e): e is { manga: (typeof candidates)[number]; score: number } => e !== null)
        .sort((a, b) => b.score - a.score);
    });

    const result: (typeof candidates)[number][] = [];
    const seen = new Set<string>();
    const cursors = new Array(perSourceRankings.length).fill(0);

    while (result.length < limit) {
      let addedInThisRound = false;

      for (let i = 0; i < perSourceRankings.length; i++) {
        const ranking = perSourceRankings[i];
        while (cursors[i] < ranking.length && seen.has(ranking[cursors[i]].manga.id)) {
          cursors[i]++;
        }
        if (cursors[i] >= ranking.length) continue;

        const next = ranking[cursors[i]];
        seen.add(next.manga.id);
        result.push(next.manga);
        cursors[i]++;
        addedInThisRound = true;

        if (result.length >= limit) break;
      }

      if (!addedInThisRound) break;
    }

    return result;
  }
}
