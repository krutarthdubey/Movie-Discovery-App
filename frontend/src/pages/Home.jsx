import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import MovieCard from '../components/MovieCard';
import { Empty, LoadingGrid } from '../components/States';

const categories = [
  ['popular', 'Popular'],
  ['top_rated', 'Top Rated'],
  ['now_playing', 'Now Playing'],
  ['upcoming', 'Upcoming'],
];

const genres = [
  ['28', 'Action'],
  ['35', 'Comedy'],
  ['18', 'Drama'],
  ['27', 'Horror'],
  ['878', 'Sci-Fi'],
  ['10749', 'Romance'],
  ['53', 'Thriller'],
  ['16', 'Animation'],
];

const initialData = {
  results: [],
  totalPages: 1,
  totalResults: 0,
};

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';

  const [category, setCategory] = useState(
    params.get('category') || 'popular',
  );
  const [sort, setSort] = useState('popularity.desc');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    setPage(1);
    setCategory(search ? 'popular' : params.get('category') || 'popular');
    setGenre('');
  }, [search, params]);

  useEffect(() => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');

    const query = new URLSearchParams({
      page: String(page),
      sort,
    });

    if (search) {
      query.set('search', search);
    } else if (genre) {
      query.set('genre', genre);
    } else {
      query.set('category', category);
    }

    apiFetch(`/movies?${query}`, {
      signal: controller.signal,
      retries: 2,
      timeout: 12000,
    })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, category, genre, page, sort, retryKey]);

  const title = useMemo(() => {
    if (search) {
      return `Results for “${search}”`;
    }

    if (genre) {
      return genres.find(([id]) => id === genre)?.[1] || 'Movies';
    }

    return categories.find(([id]) => id === category)?.[1] || 'Movies';
  }, [search, genre, category]);

  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory);
    setGenre('');
    setPage(1);
    setParams(nextCategory === 'popular' ? {} : { category: nextCategory });
  };

  return (
    <main>
      {!search && (
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR NEXT FAVORITE MOVIE</p>
            <h1>
              Discover stories
              <br />
              <em>worth watching.</em>
            </h1>
            <p>
              Browse popular releases, timeless favorites, and hidden gems—all
              in one place.
            </p>
          </div>
          <div className="hero-orb">✦</div>
        </section>
      )}

      <section className="toolbar">
        <div className="tabs">
          {categories.map(([id, label]) => (
            <button
              key={id}
              className={
                category === id && !genre && !search ? 'selected' : ''
              }
              onClick={() => chooseCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="controls">
          <select
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All genres</option>
            {genres.map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="popularity.desc">Most Popular</option>
            <option value="vote_average.desc">Highest Rated</option>
            <option value="primary_release_date.desc">Newest</option>
            <option value="primary_release_date.asc">Oldest</option>
          </select>
        </div>
      </section>

      <section className="content">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              <SlidersHorizontal size={14} /> EXPLORE
            </p>
            <h2>{title}</h2>
          </div>

          {data.totalResults > 0 && (
            <span>{data.totalResults.toLocaleString()} titles</span>
          )}
        </div>

        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <div className="error">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => setRetryKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : data.results.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid">
            {data.results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {!loading && !error && data.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              <ChevronLeft size={18} /> Prev
            </button>

            <span>
              Page <b>{page}</b> of {data.totalPages}
            </span>

            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      <footer>
        Movie data provided by TMDB. This product uses the TMDB API but is not
        endorsed or certified by TMDB.
      </footer>
    </main>
  );
}
