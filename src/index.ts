/**
 * Movies MCP — wraps iTunes Search API (movies, free, no auth) and TVmaze API (TV shows, free, no auth)
 *
 * Tools:
 * - search_movies: search for movies via iTunes Search API
 * - search_tv_shows: search for TV shows via TVmaze
 * - get_tv_show: get full TV show details including episode list via TVmaze
 * - get_tv_schedule: get today's (or any date's) TV broadcast schedule via TVmaze
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const ITUNES_BASE = 'https://itunes.apple.com';
const TVMAZE_BASE = 'https://api.tvmaze.com';

// -- iTunes types ----------------------------------------------------------

type ItunesMovieResult = {
  trackName?: string;
  artistName?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  longDescription?: string;
  shortDescription?: string;
  trackViewUrl?: string;
  artworkUrl100?: string;
  wrapperType?: string;
  kind?: string;
  collectionName?: string;
  trackTimeMillis?: number;
  contentAdvisoryRating?: string;
  country?: string;
};

type ItunesSearchResponse = {
  resultCount: number;
  results: ItunesMovieResult[];
};

// -- TVmaze types ----------------------------------------------------------

type TvmazeImage = {
  medium?: string;
  original?: string;
} | null;

type TvmazeRating = {
  average: number | null;
};

type TvmazeNetwork = {
  name: string;
  country?: { name: string; code: string } | null;
} | null;

type TvmazeShow = {
  id: number;
  name: string;
  type?: string;
  language?: string;
  genres?: string[];
  status?: string;
  premiered?: string | null;
  ended?: string | null;
  rating?: TvmazeRating;
  network?: TvmazeNetwork;
  webChannel?: { name: string } | null;
  summary?: string | null;
  url?: string;
  image?: TvmazeImage;
};

type TvmazeSearchResult = {
  score: number;
  show: TvmazeShow;
};

type TvmazeEpisode = {
  id: number;
  name: string;
  season: number;
  number: number | null;
  airdate?: string;
  airtime?: string;
  runtime?: number | null;
  summary?: string | null;
};

type TvmazeShowWithEmbeds = TvmazeShow & {
  _embedded?: {
    episodes?: TvmazeEpisode[];
  };
};

type TvmazeScheduleEntry = {
  id: number;
  name: string;
  season: number;
  number: number | null;
  airdate?: string;
  airtime?: string;
  runtime?: number | null;
  show: TvmazeShow;
};

// -- Tool definitions ------------------------------------------------------

const tools: McpToolExport['tools'] = [
  {
    name: 'search_movies',
    description:
      'Search for movies by title or keyword. Returns title, director, release date, genre, description, artwork, and iTunes store link.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Movie title or keyword to search for' },
        limit: {
          type: 'number',
          description: 'Number of results to return (1-25, default 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_tv_shows',
    description:
      'Search for TV shows by name. Returns show name, genres, premiere/end dates, rating, summary, and image.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'TV show name or keyword to search for' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_tv_show',
    description:
      'Get full details for a TV show by its TVmaze ID, including its complete episode list.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'TVmaze show ID (e.g., 1 for "Under the Dome")' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_tv_schedule',
    description:
      "Get the TV broadcast schedule for a given country and date. Defaults to today's US schedule.",
    inputSchema: {
      type: 'object',
      properties: {
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 country code (default "US")',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (default: today)',
        },
      },
    },
  },
];

// -- callTool dispatcher ---------------------------------------------------

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_movies':
      return searchMovies(args.query as string, (args.limit as number) ?? 10);
    case 'search_tv_shows':
      return searchTvShows(args.query as string);
    case 'get_tv_show':
      return getTvShow(args.id as number);
    case 'get_tv_schedule':
      return getTvSchedule(
        (args.country as string) ?? 'US',
        args.date as string | undefined,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// -- Helpers ---------------------------------------------------------------

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]+>/g, '').trim() || null;
}

function formatShow(show: TvmazeShow) {
  return {
    id: show.id,
    name: show.name,
    type: show.type ?? null,
    language: show.language ?? null,
    genres: show.genres ?? [],
    status: show.status ?? null,
    premiered: show.premiered ?? null,
    ended: show.ended ?? null,
    rating: show.rating?.average ?? null,
    network: show.network?.name ?? show.webChannel?.name ?? null,
    summary: stripHtml(show.summary),
    url: show.url ?? null,
    image: show.image?.medium ?? null,
  };
}

// -- Tool implementations --------------------------------------------------

async function searchMovies(query: string, limit: number) {
  const count = Math.min(25, Math.max(1, limit));
  const params = new URLSearchParams({
    term: query,
    media: 'movie',
    limit: String(count),
  });

  const res = await fetch(`${ITUNES_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`iTunes Search error: ${res.status}`);

  const data = (await res.json()) as ItunesSearchResponse;

  return {
    total_found: data.resultCount,
    movies: data.results.map((item) => ({
      title: item.trackName ?? null,
      director: item.artistName ?? null,
      release_date: item.releaseDate ? item.releaseDate.substring(0, 10) : null,
      genre: item.primaryGenreName ?? null,
      description: item.longDescription ?? item.shortDescription ?? null,
      rating: item.contentAdvisoryRating ?? null,
      runtime_minutes: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 60000) : null,
      itunes_url: item.trackViewUrl ?? null,
      artwork_url: item.artworkUrl100 ?? null,
    })),
  };
}

async function searchTvShows(query: string) {
  const res = await fetch(
    `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error(`TVmaze error: ${res.status}`);

  const data = (await res.json()) as TvmazeSearchResult[];

  return {
    total_found: data.length,
    shows: data.map((entry) => ({
      score: entry.score,
      ...formatShow(entry.show),
    })),
  };
}

async function getTvShow(id: number) {
  const res = await fetch(`${TVMAZE_BASE}/shows/${id}?embed=episodes`);
  if (res.status === 404) throw new Error(`TV show not found for ID: ${id}`);
  if (!res.ok) throw new Error(`TVmaze error: ${res.status}`);

  const data = (await res.json()) as TvmazeShowWithEmbeds;
  const episodes = data._embedded?.episodes ?? [];

  return {
    ...formatShow(data),
    episode_count: episodes.length,
    episodes: episodes.map((ep) => ({
      id: ep.id,
      season: ep.season,
      episode: ep.number,
      name: ep.name,
      airdate: ep.airdate ?? null,
      airtime: ep.airtime ?? null,
      runtime_minutes: ep.runtime ?? null,
      summary: stripHtml(ep.summary),
    })),
  };
}

async function getTvSchedule(country: string, date?: string) {
  const params = new URLSearchParams({ country: country.toUpperCase() });
  if (date) params.set('date', date);

  const res = await fetch(`${TVMAZE_BASE}/schedule?${params}`);
  if (!res.ok) throw new Error(`TVmaze error: ${res.status}`);

  const data = (await res.json()) as TvmazeScheduleEntry[];

  return {
    country: country.toUpperCase(),
    date: date ?? new Date().toISOString().substring(0, 10),
    total_airings: data.length,
    schedule: data.map((entry) => ({
      airtime: entry.airtime ?? null,
      show_name: entry.show?.name ?? null,
      network: entry.show?.network?.name ?? entry.show?.webChannel?.name ?? null,
      episode_name: entry.name,
      season: entry.season,
      episode: entry.number,
      runtime_minutes: entry.runtime ?? null,
    })),
  };
}

export default { tools, callTool } satisfies McpToolExport;
