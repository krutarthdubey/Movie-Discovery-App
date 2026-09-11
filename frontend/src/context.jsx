import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api/client';

const WishlistContext = createContext(null);
const USER_KEY = 'movie-discovery-user-id';

function createUserId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function WishlistProvider({ children }) {
  const [userId] = useState(
    () => localStorage.getItem(USER_KEY) || createUserId(),
  );
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(USER_KEY, userId);
  }, [userId]);

  useEffect(() => {
    let active = true;

    apiFetch(`/wishlist/${userId}`, { retries: 2 })
      .then((items) => {
        if (active) {
          setWishlist(items);
          setError('');
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const has = (movieId) =>
    wishlist.some((item) => Number(item.movieId) === Number(movieId));

  const toggle = async (movie) => {
    setError('');

    const movieId = Number(movie.id);
    const alreadySaved = has(movieId);
    const previousWishlist = wishlist;

    if (alreadySaved) {
      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (item) => Number(item.movieId) !== movieId,
        ),
      );
    } else {
      const optimisticItem = {
        movieId,
        title: movie.title,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        releaseDate: movie.releaseDate,
        voteAverage: movie.voteAverage,
        overview: movie.overview,
      };

      setWishlist((currentWishlist) => [
        optimisticItem,
        ...currentWishlist.filter(
          (item) => Number(item.movieId) !== movieId,
        ),
      ]);
    }

    try {
      if (alreadySaved) {
        await apiFetch(`/wishlist/${userId}/${movieId}`, {
          method: 'DELETE',
        });
      } else {
        const item = await apiFetch(`/wishlist/${userId}`, {
          method: 'POST',
          body: JSON.stringify({ movie }),
        });

        setWishlist((currentWishlist) => [
          item,
          ...currentWishlist.filter(
            (wishlistItem) => Number(wishlistItem.movieId) !== movieId,
          ),
        ]);
      }

      setError('');
    } catch (requestError) {
      setWishlist(previousWishlist);
      setError(requestError.message || 'Could not update wishlist.');
    }
  };

  const value = useMemo(
    () => ({ wishlist, loading, error, has, toggle }),
    [wishlist, loading, error],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
