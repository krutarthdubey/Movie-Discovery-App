import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { Empty } from '../components/States';
import { useWishlist } from '../context';

export default function Wishlist() {
  const { wishlist, loading, error } = useWishlist();

  return (
    <main className="content wishlist-page">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            <Heart size={14} /> YOUR COLLECTION
          </p>
          <h1>My Wishlist</h1>
        </div>

        {!loading && (
          <span>
            {wishlist.length} {wishlist.length === 1 ? 'movie' : 'movies'}
          </span>
        )}
      </div>

      {error && (
        <div className="error wishlist-error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-text">Loading your wishlist…</div>
      ) : wishlist.length ? (
        <div className="grid">
          {wishlist.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={{
                id: movie.movieId,
                title: movie.title,
                posterPath: movie.posterPath,
                releaseDate: movie.releaseDate,
                voteAverage: movie.voteAverage,
                overview: movie.overview,
              }}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Your wishlist is empty"
          text="Save movies while browsing and they’ll stay here when you come back."
        />
      )}

      <Link className="browse-link" to="/">
        ← Discover more movies
      </Link>
    </main>
  );
}
