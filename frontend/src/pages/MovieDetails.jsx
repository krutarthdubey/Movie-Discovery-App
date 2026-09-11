import { ArrowLeft, Calendar, Clock, Heart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, imageUrl } from '../api/client';
import { Spinner } from '../components/States';
import { useWishlist } from '../context';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const { has, toggle, error: wishlistError } = useWishlist();

  useEffect(() => {
    setMovie(null);
    setError('');

    apiFetch(`/movies/${id}`)
      .then(setMovie)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  if (error) {
    return (
      <div className="error page-error">
        <h2>Could not load movie</h2>
        <p>{error}</p>
        <Link to="/">Back to browse</Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="detail-loading">
        <Spinner />
      </div>
    );
  }

  const saved = has(movie.id);
  const backdropStyle = movie.backdropPath
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(8,10,16,.98) 8%, rgba(8,10,16,.78) 50%, rgba(8,10,16,.3)), url(${imageUrl(movie.backdropPath, 'w1280')})`,
      }
    : undefined;

  return (
    <main className="details">
      <div className="backdrop" style={backdropStyle} />

      <section className="detail-content">
        <Link
          className="back"
          to="/"
          onClick={(event) => {
            if (window.history.length > 1) {
              event.preventDefault();
              window.history.back();
            }
          }}
        >
          <ArrowLeft size={18} /> Back to browse
        </Link>

        <div className="detail-layout">
          <div className="detail-poster">
            {movie.posterPath && (
              <img src={imageUrl(movie.posterPath, 'w500')} alt={movie.title} />
            )}
          </div>

          <div className="detail-copy">
            <p className="eyebrow">MOVIE DETAILS</p>
            <h1>{movie.title}</h1>

            {movie.tagline && <p className="tagline">“{movie.tagline}”</p>}

            <div className="meta">
              <span>
                <Star size={16} fill="currentColor" />{' '}
                {movie.voteAverage.toFixed(1)}
              </span>

              {movie.releaseDate && (
                <span>
                  <Calendar size={16} /> {movie.releaseDate}
                </span>
              )}

              {movie.runtime && (
                <span>
                  <Clock size={16} /> {movie.runtime} min
                </span>
              )}
            </div>

            <div className="chips">
              {movie.genres.map((genreName) => (
                <span key={genreName}>{genreName}</span>
              ))}
            </div>

            <p className="overview">{movie.overview}</p>

            <button
              className={`wishlist-cta ${saved ? 'saved' : ''}`}
              onClick={() => toggle(movie)}
            >
              <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved to wishlist' : 'Add to wishlist'}
            </button>

            {wishlistError && (
              <p className="director" role="status">
                {wishlistError}
              </p>
            )}

            {movie.director && (
              <p className="director">
                <b>Director</b> {movie.director}
              </p>
            )}
          </div>
        </div>

        {movie.cast?.length > 0 && (
          <div className="cast">
            <h2>Cast</h2>

            <div className="cast-grid">
              {movie.cast.map((person) => (
                <div className="person" key={person.id}>
                  {person.profilePath ? (
                    <img
                      src={imageUrl(person.profilePath, 'w185')}
                      alt={person.name}
                    />
                  ) : (
                    <div className="person-empty" />
                  )}

                  <div>
                    <b>{person.name}</b>
                    <span>{person.character}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
