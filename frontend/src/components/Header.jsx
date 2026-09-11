import { Film, Heart, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context';

export default function Header() {
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [value, setValue] = useState(params.get('search') || '');

  const submit = (event) => {
    event.preventDefault();

    if (value.trim()) {
      navigate(`/?search=${encodeURIComponent(value.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="header">
      <Link className="brand" to="/">
        <span className="brand-icon">
          <Film size={20} />
        </span>
        CineScope
      </Link>

      <form className="search" onSubmit={submit}>
        <Search size={18} />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search movies..."
          aria-label="Search movies"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              navigate('/');
            }}
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </form>

      <nav>
        <Link
          className={location.pathname === '/wishlist' ? 'active' : ''}
          to="/wishlist"
        >
          <Heart size={18} /> Wishlist <span>{wishlist.length}</span>
        </Link>
      </nav>
    </header>
  );
}
