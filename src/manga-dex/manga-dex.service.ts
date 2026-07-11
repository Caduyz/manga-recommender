import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class MangaDexService {
  private readonly logger = new Logger(MangaDexService.name);

  constructor(private readonly httpService: HttpService) {}

  private async fetchManga(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/manga/${id}`, {
          params: {
            'includes[]': ['author', 'artist', 'cover_art'],
          },
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429) {
        this.logger.warn('Rate limit reached, waiting 1s before retrying...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.fetchManga(id);
      }

      this.logger.error(
        `Error fetching manga ${id} on MangaDex`,
        axiosError.message,
      );
      throw error;
    }
  }

  private async fetchStatistics(id: string): Promise<number | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/statistics/manga/${id}`),
      );

      return response.data.statistics?.[id]?.rating?.average ?? null;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429) {
        this.logger.warn('Rate limit reached, waiting 1s before retrying...');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return this.fetchStatistics(id);
      }

      this.logger.error(
        `Error retrieving statistics of manga ${id}`,
        axiosError.message,
      );

      throw error;
    }
  }

  async getMangaById(id: string) {
    const [manga, averageScore] = await Promise.all([
      this.fetchManga(id),
      this.fetchStatistics(id),
    ]);

    return {
      ...manga.data,
      averageScore,
    };
  }
}
