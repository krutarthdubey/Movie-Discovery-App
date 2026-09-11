import { Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import { useWishlist } from '../context';

export default function MovieCard({ movie }) {
  const { has, toggle } = useWishlist();
  const saved = has(movie.id);

  return (
    <article className="movie-card">
      <Link to={`/movie/${movie.id}`} className="poster-wrap">
        {movie.posterPath ? (
          <img src={imageUrl(movie.posterPath)} alt={movie.title} />
        ) : (
          <div className="poster-empty">No poster</div>
        )}

        <div className="rating">
          <Star size={13} fill="currentColor" />
          {movie.voteAverage?.toFixed(1) || '—'}
        </div>
      </Link>

      <button
        className={`save-btn ${saved ? 'saved' : ''}`}
        onClick={() => toggle(movie)}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="movie-info">
        <Link to={`/movie/${movie.id}`}>
          <h3>{movie.title}</h3>
        </Link>
        <p>{movie.releaseDate?.slice(0, 4) || '—'}</p>
      </div>
    </article>
  );
}
