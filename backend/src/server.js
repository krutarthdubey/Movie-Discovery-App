import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_discovery';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Keep the server responsive when Atlas is temporarily unavailable.
mongoose.set('bufferCommands', false);

const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000;
const STALE_CACHE_TTL = 15 * 60 * 1000;

function getCache(key, allowStale = false) {
  const hit = cache.get(key);
  if (!hit) return null;

  const age = Date.now() - hit.createdAt;
  const isFresh = age <= CACHE_TTL;
  const isUsableStale = allowStale && age <= STALE_CACHE_TTL;

  if (isFresh || isUsableStale) {
    return hit.value;
  }

  cache.delete(key);
  return null;
}

function setCache(key, value) {
  cache.set(key, {
    value,
    createdAt: Date.now(),
  });
}

const movieSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    movieId: { type: Number, required: true },
    title: String,
    posterPath: String,
    backdropPath: String,
    releaseDate: String,
    voteAverage: Number,
    overview: String,
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

movieSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', movieSchema);

function normalizeMovie(movie = {}) {
  return {
    id: movie.id,
    title: movie.title || movie.name || 'Untitled',
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null,
    releaseDate: movie.release_date || null,
    voteAverage:
      typeof movie.vote_average === 'number' ? movie.vote_average : 0,
    voteCount: movie.vote_count || 0,
    overview: movie.overview || 'No overview available.',
    genres: Array.isArray(movie.genres)
      ? movie.genres.map((genre) => genre.name)
      : [],
    runtime: movie.runtime || null,
    tagline: movie.tagline || '',
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tmdb(path, params = {}) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured.');
  }

  const key = `${path}?${new URLSearchParams(params).toString()}`;
  const cached = getCache(key);

  if (cached) {
    return cached;
  }

  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}${path}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          ...params,
        },
        timeout: 5000,
      });

      setCache(key, response.data);
      return response.data;
    } catch (error) {
      lastError = error;

      if (attempt === 0) {
        await sleep(350);
      }
    }
  }

  // If TMDB is briefly down, serve recently cached data instead of failing the page.
  const stale = getCache(key, true);

  if (stale) {
    return stale;
  }

  const error = new Error(
    lastError?.code === 'ECONNABORTED' || lastError?.code === 'ETIMEDOUT'
      ? 'Movie service timed out. Please try again.'
      : 'Movie service is temporarily unavailable. Please try again.',
  );

  error.status = lastError?.response?.status || 503;
  error.response = lastError?.response;

  throw error;
}

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const mongoReady = () => mongoose.connection.readyState === 1;

app.get('/api/health', (req, res) => {
  const mongo = mongoReady();

  res.status(mongo ? 200 : 503).json({
    ok: mongo,
    services: {
      api: 'ok',
      mongodb: mongo ? 'ok' : 'unavailable',
    },
  });
});

app.get('/api/movies', asyncRoute(async (req, res) => {
  const {
    search = '',
    category = 'popular',
    page = 1,
    sort = 'popularity.desc',
    genre = '',
  } = req.query;

  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);
  let data;

  if (search.trim()) {
    data = await tmdb('/search/movie', {
      query: search.trim(),
      page: safePage,
      include_adult: false,
    });
  } else if (genre) {
    data = await tmdb('/discover/movie', {
      page: safePage,
      with_genres: genre,
      sort_by: sort,
      include_adult: false,
    });
  } else {
    const endpoints = {
      popular: '/movie/popular',
      top_rated: '/movie/top_rated',
      now_playing: '/movie/now_playing',
      upcoming: '/movie/upcoming',
    };

    data = await tmdb(endpoints[category] || endpoints.popular, {
      page: safePage,
    });
  }

  res.json({
    page: data.page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    results: (data.results || []).map(normalizeMovie),
  });
}));

app.get('/api/movies/:id', asyncRoute(async (req, res) => {
  const movieId = Number(req.params.id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: 'Invalid movie ID.' });
  }

  const movie = await tmdb(`/movie/${movieId}`, {
    append_to_response: 'credits',
  });

  const normalized = normalizeMovie(movie);

  normalized.cast = (movie.credits?.cast || [])
    .slice(0, 8)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profilePath: person.profile_path || null,
    }));

  normalized.director =
    movie.credits?.crew?.find((person) => person.job === 'Director')?.name ||
    null;

  res.json(normalized);
}));

function requireMongo(res) {
  if (mongoReady()) {
    return true;
  }

  res.status(503).json({
    message: 'Wishlist storage is temporarily unavailable. Please try again.',
  });

  return false;
}

app.get('/api/wishlist/:userId', asyncRoute(async (req, res) => {
  if (!requireMongo(res)) return;

  const items = await Wishlist.find({ userId: req.params.userId })
    .sort({ savedAt: -1 })
    .lean();

  res.json(items);
}));

app.post('/api/wishlist/:userId', asyncRoute(async (req, res) => {
  if (!requireMongo(res)) return;

  const { movie } = req.body;

  if (!movie?.id || !movie?.title) {
    return res.status(400).json({ message: 'Valid movie data is required.' });
  }

  const item = await Wishlist.findOneAndUpdate(
    {
      userId: req.params.userId,
      movieId: movie.id,
    },
    {
      userId: req.params.userId,
      movieId: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      releaseDate: movie.releaseDate,
      voteAverage: movie.voteAverage,
      overview: movie.overview,
      savedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  res.status(201).json(item);
}));

app.delete('/api/wishlist/:userId/:movieId', asyncRoute(async (req, res) => {
  if (!requireMongo(res)) return;

  await Wishlist.deleteOne({
    userId: req.params.userId,
    movieId: Number(req.params.movieId),
  });

  res.status(204).end();
}));

app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.response?.status || 500;
  const message =
    err.response?.data?.status_message || err.message || 'Something went wrong.';

  res.status(status).json({ message });
});

let mongoRetryTimer;

async function connectMongo() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`);
    scheduleMongoRetry();
  }
}

function scheduleMongoRetry() {
  if (mongoRetryTimer || mongoReady()) {
    return;
  }

  mongoRetryTimer = setTimeout(async () => {
    mongoRetryTimer = null;
    await connectMongo();
  }, 5000);
}

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection ready');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Retrying in 5 seconds...');
  scheduleMongoRetry();
});

mongoose.connection.on('error', (error) => {
  console.warn(`MongoDB error: ${error.message}`);
});

function start() {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    connectMongo();
  });
}

start();
