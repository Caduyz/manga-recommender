import { Injectable } from '@nestjs/common';
import { MangaService } from '../manga/manga.service';
import { LibraryService } from '../library/library.service';
import { ReadingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly mangaService: MangaService,
    private readonly libraryService: LibraryService,
    private readonly prisma: PrismaService
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

  private buildDirectWeights(entries: Awaited<ReturnType<LibraryService['findUserEntriesWithTags']>>) {
    const weights = new Map<string, number>();

    for (const entry of entries) {
      let contribution: number | null = null;

      if (entry.userScore !== null) {
        contribution = entry.userScore - 5;
      } else if (entry.status === ReadingStatus.DROPPED) {
        contribution = -3;
      }

      if (contribution === null) continue;

      for (const tag of entry.manga.tags) {
        weights.set(tag.id, (weights.get(tag.id) ?? 0) + contribution);
      }
    }

    return weights;
  }

  private async buildInheritedWeights(directWeights: Map<string, number>) {
    const directTagIds = Array.from(directWeights.keys());
    if (directTagIds.length === 0) return new Map<string, number>();

    const affinities = await this.prisma.tagAffinity.findMany({
      where: {
        OR: [{ tagAId: { in: directTagIds } }, { tagBId: { in: directTagIds } }],
      },
    });

    const DAMPING = 0.4;
    const inherited = new Map<string, number>();

    for (const affinity of affinities) {
      const aIsDirect = directWeights.has(affinity.tagAId);
      const bIsDirect = directWeights.has(affinity.tagBId);

      if (aIsDirect && !bIsDirect) {
        const contribution = DAMPING * affinity.similarity * directWeights.get(affinity.tagAId)!;
        inherited.set(affinity.tagBId, (inherited.get(affinity.tagBId) ?? 0) + contribution);
      } else if (bIsDirect && !aIsDirect) {
        const contribution = DAMPING * affinity.similarity * directWeights.get(affinity.tagBId)!;
        inherited.set(affinity.tagAId, (inherited.get(affinity.tagAId) ?? 0) + contribution);
      }
      // se os dois já são diretos, a tag já tem peso próprio — não sobrescreve
    }

    return inherited;
  }

  async findPersonalized(userId: string, limit = 20) {
    const entries = await this.libraryService.findUserEntriesWithTags(userId);
    const directWeights = this.buildDirectWeights(entries);

    if (directWeights.size === 0) return [];

    const inheritedWeights = await this.buildInheritedWeights(directWeights);

    const finalWeights = new Map<string, number>([...inheritedWeights, ...directWeights]);
    // Repare a ordem do spread: inheritedWeights primeiro, directWeights por cima —
    // isso garante que, se uma tag existir nos dois mapas, o peso DIRETO vence.

    const relevantTagIds = Array.from(finalWeights.keys());
    const excludeIds = entries.map((entry) => entry.mangaId);

    const candidates = await this.mangaService.findCandidatesByTagIds(relevantTagIds, excludeIds);

    const scored = candidates.map((manga) => {
      const score = manga.tags.reduce(
        (sum, tag) => sum + (finalWeights.get(tag.id) ?? 0),
        0,
      );
      return { manga, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.manga);
  }
}
