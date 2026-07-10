import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class MangaDexService {
  private readonly logger = new Logger(MangaDexService.name);

  constructor(private readonly httpService: HttpService) {}

  async getMangaById(id: string) {
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
        this.logger.warn('Rate limit atingido, aguardando 1s antes de tentar de novo...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getMangaById(id);
      }

      this.logger.error(`Erro ao buscar mangá ${id} na MangaDex`, axiosError.message);
      throw error;
    }
  }
}