import { GatewayTimeoutException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

@Injectable()
export class MangaDexService {
  private readonly logger = new Logger(MangaDexService.name);

  constructor(private readonly httpService: HttpService) {}

  private async requestWithRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    context: string,
  ): Promise<T> {
    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // A MangaDex respondeu com rate limit (HTTP 429)
      // Aguarda 1 segundo e tenta novamente a mesma requisição
      if (axiosError.response?.status === 429) {
        this.logger.warn(
          `Rate limit reached on ${context}, waiting 1s before retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.requestWithRetry(fn, context);
      }

      // A requisição excedeu o tempo limite configurado
      if (axiosError.code === 'ECONNABORTED') {
        this.logger.error(`Timeout on ${context}`);
        throw new GatewayTimeoutException('MangaDex took too long to respond.');
      }

      // Qualquer outro erro é registrado e propagado para a camada superior
      this.logger.error(`Error on ${context}`, axiosError.message);
      throw error;
    }
  }

  private fetchManga(id: string) {
    return this.requestWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get(`/manga/${id}`, {
            params: { 'includes[]': ['author', 'artist', 'cover_art'] },
          }),
        ),
      `fetchManga(${id})`,
    );
  }

  private async fetchStatisticsBatch(
    ids: string[],
  ): Promise<Record<string, number | null>> {
    // Realiza uma única requisição ao endpoint de estatísticas do MangaDex para todos os IDs informados
    const data = await this.requestWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get('/statistics/manga', {
            params: { 'manga[]': ids },
          }),
        ),
      `fetchStatisticsBatch(${ids.length} ids)`,
    );

    // A resposta do MangaDex organiza as estatísticas em um objeto indexado pelo ID
    const statistics = data.statistics as Record<
      string,
      { rating?: { bayesian?: number } }
    >;

    // { mangaId -> bayesianScore | null }
    return Object.fromEntries(
      ids.map((id) => [id, statistics[id]?.rating?.bayesian ?? null]),
    );
  }

  private async fetchStatistics(id: string): Promise<number | null> {
    const batch = await this.fetchStatisticsBatch([id]);
    return batch[id] ?? null;
  }

  async getMangaById(id: string) {
    const [manga, bayesianScore] = await Promise.all([
      this.fetchManga(id),
      this.fetchStatistics(id),
    ]);

    return {
      ...manga.data,
      bayesianScore,
    };
  }

  async searchByTitle(title: string) {
    // Busca até 10 mangás cujo título corresponda à pesquisa
    const data = await this.requestWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get('/manga', {
            params: {
              title,
              limit: 10,
              'includes[]': ['author', 'artist', 'cover_art'],
            },
          }),
        ),
      `searchByTitle(${title})`,
    );

    return data.data as any[];
  }

  async getStatisticsBatch(
    ids: string[],
  ): Promise<Record<string, number | null>> {
    if (ids.length === 0) return {};
    return this.fetchStatisticsBatch(ids);
  }
}
