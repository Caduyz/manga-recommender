import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MangaEntry, Prisma, ReadingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { MangaService } from '../manga/manga.service';

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mangaService: MangaService,
  ) {}

  async addToLibrary(userId: string, entry: CreateLibraryDto) {
    const chapterProgress = await this.resolveChapterProgress(
      entry.status,
      undefined,
      0,
      entry.mangaId,
    );

    try {
      return await this.prisma.mangaEntry.create({
        data: {
          userId,
          mangaId: entry.mangaId,
          status: entry.status,
          ...this.computeInitialTimestamps(entry.status),
          ...(chapterProgress !== undefined && { chapterProgress }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          "This manga is already in the user's library.",
        );
      }
      throw error;
    }
  }

  async updateLibraryEntry(
    userId: string,
    mangaId: string,
    dto: UpdateLibraryDto,
  ) {
    const current = await this.prisma.mangaEntry.findUnique({
      where: { userId_mangaId: { userId, mangaId } },
    });

    if (!current) {
      throw new NotFoundException('Entry not found in the user library.');
    }

    const finalStatus = dto.status ?? current.status;

    const chapterProgress = await this.resolveChapterProgress(
      finalStatus,
      dto.chapterProgress,
      current.chapterProgress,
      mangaId,
    );

    const data = {
      ...dto,
      ...this.computeAutoTimestamps(dto, current),
      ...(chapterProgress !== undefined && { chapterProgress }),
    };

    this.validateTimestampOrder(data, current);

    return this.prisma.mangaEntry.update({
      where: { userId_mangaId: { userId, mangaId } },
      data,
    });
  }

  async findUserLibrary(userId: string) {
    return this.prisma.mangaEntry.findMany({
      where: { userId },
      include: { manga: true },
      orderBy: { importedAt: 'desc' },
    });
  }

  async removeFromLibrary(userId: string, mangaId: string) {
    try {
      return await this.prisma.mangaEntry.delete({
        where: { userId_mangaId: { userId, mangaId } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Entry not found in the user library.');
      }
      throw error;
    }
  }

  async findUserEntriesWithTags(userId: string) {
    return this.prisma.mangaEntry.findMany({
      where: { userId },
      include: { manga: { include: { tags: true } } },
    });
  }

  // ------------------------ Business Rules ------------------------

  private impliesStarted(status: ReadingStatus): boolean {
    return (
      status === ReadingStatus.READING || status === ReadingStatus.COMPLETED
    );
  }

  private computeInitialTimestamps(status: ReadingStatus) {
    return {
      startedAt: this.impliesStarted(status) ? new Date() : undefined,
      finishedAt: status === ReadingStatus.COMPLETED ? new Date() : undefined,
    };
  }

  private computeAutoTimestamps(dto: UpdateLibraryDto, current: MangaEntry) {
    const overrides: { startedAt?: Date; finishedAt?: Date } = {};

    const willBeStarted =
      dto.status !== undefined && this.impliesStarted(dto.status);
    if (willBeStarted && dto.startedAt === undefined && !current.startedAt) {
      overrides.startedAt = new Date();
    }

    const willBeCompleted = dto.status === ReadingStatus.COMPLETED;
    if (
      willBeCompleted &&
      dto.finishedAt === undefined &&
      !current.finishedAt
    ) {
      overrides.finishedAt = new Date();
    }

    return overrides;
  }

  private validateTimestampOrder(
    data: { startedAt?: Date; finishedAt?: Date | null },
    current: MangaEntry,
  ) {
    const finalStartedAt = data.startedAt ?? current.startedAt ?? undefined;
    const finalFinishedAt =
      data.finishedAt !== undefined ? data.finishedAt : current.finishedAt;

    if (finalStartedAt && finalFinishedAt && finalFinishedAt < finalStartedAt) {
      throw new BadRequestException(
        'finishedAt não pode ser anterior a startedAt',
      );
    }
  }

  private parseChapterNumber(
    value: string | null | undefined,
  ): number | undefined {
    if (!value) return undefined;
    const parsed = Math.floor(parseFloat(value));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private async resolveChapterProgress(
    status: ReadingStatus | undefined,
    providedProgress: number | undefined,
    currentProgress: number,
    mangaId: string,
  ): Promise<number | undefined> {
    if (status === ReadingStatus.READING) {
      const effective = providedProgress ?? currentProgress;
      return effective === 0 ? 1 : undefined;
    }

    if (status === ReadingStatus.COMPLETED) {
      const manga = await this.mangaService.findLocalById(mangaId);

      const lastChapter = this.parseChapterNumber(manga.lastChapter) ?? 0;

      const lastReleasedChapter =
        this.parseChapterNumber(manga.lastReleasedChapter) ?? 0;

      const maxProgress = Math.max(lastChapter, lastReleasedChapter);

      if (providedProgress === undefined || providedProgress < maxProgress) {
        return maxProgress;
      }
    }

    return undefined;
  }
}
