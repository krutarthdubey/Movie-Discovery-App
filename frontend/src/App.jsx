import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Wishlist from './pages/Wishlist';
import { WishlistProvider } from './context';

export default function App() {
  return (
    <BrowserRouter>
      <WishlistProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      </WishlistProvider>
    </BrowserRouter>
  );
}
