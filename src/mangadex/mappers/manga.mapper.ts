// Objetos multi-idioma da MangaDex sempre têm esse formato:
// { "en": "texto em inglês", "ja-ro": "texto romanizado", ... }
interface LocalizedText {
  [languageCode: string]: string;
}

interface MangaDexTag {
  id: string;
  attributes: {
    name: LocalizedText;
    group: 'genre' | 'theme' | 'format' | 'content';
  };
}

interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    name?: string;
    fileName?: string;
  };
}

interface MangaDexMangaAttributes {
  title: LocalizedText;
  altTitles: LocalizedText[];
  description: LocalizedText;
  lastChapter: string | null;
  publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen' | null;
  year: number | null;
  contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  tags: MangaDexTag[];
  createdAt: string;
  updatedAt: string;
}

export interface MangaDexMangaData {
  id: string;
  bayesianScore: number | null;

  attributes: MangaDexMangaAttributes;
  relationships: MangaDexRelationship[];
}

export interface MappedManga {
  id: string;
  title: string;
  originalTitle: string | null;
  synopsis: string | null;
  publicationYear: number | null;
  bayesianScore: number | null;
  lastChapter: string | null;
  coverFileName: string | null;
  demography: 'SHONEN' | 'SHOJO' | 'JOSEI' | 'SEINEN' | null;
  contentRating: 'SAFE' | 'SUGGESTIVE' | 'EROTICA' | 'PORNOGRAPHIC';
  publicationStatus: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'CANCELLED';
  dexCreatedAt: Date;
  dexUpdatedAt: Date;
  tags: {
    id: string;
    name: string;
    type: 'GENRE' | 'THEME' | 'FORMAT' | 'CONTENT';
  }[];
  authors: { id: string; name: string }[];
  artists: { id: string; name: string }[];
}

function pickText(text: LocalizedText, lang: string): string | undefined {
  return text[lang];
}

function pickFromAltTitles(
  altTitles: LocalizedText[],
  lang: string,
): string | undefined {
  const found = altTitles.find((entry) => entry[lang]);
  return found?.[lang];
}

function firstAvailable(text: LocalizedText): string | undefined {
  return Object.values(text)[0];
}

const DEMOGRAPHY_MAP: Record<string, MappedManga['demography']> = {
  shounen: 'SHONEN',
  shoujo: 'SHOJO',
  josei: 'JOSEI',
  seinen: 'SEINEN',
};

export class MangaMapper {
  static toInternal(data: MangaDexMangaData): MappedManga {
    const { id, attributes, relationships } = data;

    const title =
      pickText(attributes.title, 'en') ??
      pickFromAltTitles(attributes.altTitles, 'en') ??
      firstAvailable(attributes.title) ??
      'No Title';

    const originalTitle =
      pickText(attributes.title, 'ja-ro') ??
      pickFromAltTitles(attributes.altTitles, 'ja-ro') ??
      null;

    const synopsis = pickText(attributes.description, 'en') ?? null;

    const demography = attributes.publicationDemographic
      ? (DEMOGRAPHY_MAP[attributes.publicationDemographic] ?? null)
      : null;

    const authors = relationships
      .filter((r) => r.type === 'author')
      .map((r) => ({ id: r.id, name: r.attributes?.name ?? 'Unknown' }));

    const artists = relationships
      .filter((r) => r.type === 'artist')
      .map((r) => ({ id: r.id, name: r.attributes?.name ?? 'Unknown' }));

    const cover = relationships.find((r) => r.type === 'cover_art');

    const tags = attributes.tags.map((tag) => ({
      id: tag.id,
      name:
        pickText(tag.attributes.name, 'en') ??
        firstAvailable(tag.attributes.name) ??
        '',
      type: tag.attributes.group.toUpperCase() as
        'GENRE' | 'THEME' | 'FORMAT' | 'CONTENT',
    }));

    return {
      id,
      title,
      originalTitle,
      synopsis,
      publicationYear: attributes.year,
      bayesianScore: data.bayesianScore,
      lastChapter: attributes.lastChapter,
      coverFileName: cover?.attributes?.fileName ?? null,
      demography,
      contentRating:
        attributes.contentRating.toUpperCase() as MappedManga['contentRating'],
      publicationStatus:
        attributes.status.toUpperCase() as MappedManga['publicationStatus'],
      dexCreatedAt: new Date(attributes.createdAt),
      dexUpdatedAt: new Date(attributes.updatedAt),
      tags,
      authors,
      artists,
    };
  }
}
