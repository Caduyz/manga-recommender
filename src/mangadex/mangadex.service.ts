import { GatewayTimeoutException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { MangaDexTag } from './mangadex.types';

@Injectable()
export class MangaDexService {
  private readonly logger = new Logger(MangaDexService.name);

  constructor(private readonly httpService: HttpService) {}

  private async requestWithRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    context: string,
    attempt = 0,
  ): Promise<T> {
    const MAX_RETRIES = 5;

    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Aguarda um tempo crescente (backoff exponencial) e tenta novamente até um limite de tentativas
      // Evita escalar pra um banimento temporário de IP
      if (axiosError.response?.status === 429) {
        if (attempt >= MAX_RETRIES) {
          this.logger.error(
            `Persistent rate limit on ${context}, giving up after ${MAX_RETRIES} attempts.`,
          );
          throw error;
        }

        const waitMs = 1000 * 2 ** attempt; // 1s, 2s, 4s, 8s, 16s...
        this.logger.warn(
          `Rate limit reached on ${context}, waiting ${waitMs}ms before retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return this.requestWithRetry(fn, context, attempt + 1);
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
    const [manga, bayesianScore, latestReleasedChapter] = await Promise.all([
      this.fetchManga(id),
      this.fetchStatistics(id),
      this.fetchLatestChapter(id),
    ]);

    return {
      ...manga.data,
      bayesianScore,
      latestReleasedChapter,
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

    const CHUNK_SIZE = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }

    const results = await Promise.all(
      chunks.map((chunk) => this.fetchStatisticsBatch(chunk)),
    );
    return Object.assign({}, ...results);
  }

  private async fetchLatestChapter(id: string): Promise<string | null> {
    const data = await this.requestWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get(`/manga/${id}/feed`, {
            params: {
              'translatedLanguage[]': ['en'],
              'order[chapter]': 'desc',
              limit: 1,
            },
          }),
        ),
      `fetchLatestChapter(${id})`,
    );

    return data.data[0]?.attributes?.chapter ?? null;
  }

  async getTags(): Promise<MangaDexTag[]> {
    const response = await this.requestWithRetry(
      () => firstValueFrom(this.httpService.get('/manga/tag')),
      `getTags`,
    );

    return response.data.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name.en ?? Object.values(tag.attributes.name)[0],
      group: tag.attributes.group,
    }));
  }

  async searchByTag(
    tagId: string,
    orderBy: 'rating' | 'followedCount' | 'createdAt',
    limit = 10,
  ) {
    const data = await this.requestWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get('/manga', {
            params: {
              'includedTags[]': [tagId],
              [`order[${orderBy}]`]: 'desc',
              limit,
              'includes[]': ['author', 'artist', 'cover_art'],
            },
          }),
        ),
      `searchByTag(${tagId}, ${orderBy})`,
    );
    return data.data as any[];
  }
}
