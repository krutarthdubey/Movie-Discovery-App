# CineScope — Movie Discovery App

A full-stack movie discovery application built for the Trackzio Full-Stack Intern assignment.

CineScope lets users discover movies by category, search and filter results, view movie details, and maintain a persistent wishlist. The React frontend communicates only with the Node.js backend. The backend acts as the abstraction layer for the external movie service and handles caching, retries, validation, and failure states.

## Features

- Browse Popular, Top Rated, Now Playing, and Upcoming movies
- Search movies by title
- Filter by genre
- Sort results
- Paginate large result sets
- View movie details, rating, release date, genres, synopsis, and cast
- Add/remove movies from a persistent wishlist
- Keep wishlist data after closing and reopening the browser
- Responsive UI for desktop, tablet, and mobile screens
- Loading, empty, and error states
- Cancel stale requests when search/filter input changes quickly
- Retry transient movie-service failures
- Backend response caching to reduce repeated external requests
- Normalized API responses so the frontend is not coupled to the provider's schema

## Architecture

```text
React Frontend
     |
     | HTTP requests
     v
Node.js + Express Backend
     |                 |
     |                 +----> MongoDB
     |                       (wishlist)
     |
     +---------------------> TMDB API
                            (movie data)
```

The frontend never calls TMDB directly. The backend owns the TMDB API key and exposes application-specific endpoints to the client.

## Technology Stack

### Frontend

- React
- React Router
- Vite
- CSS

### Backend

- Node.js
- Express
- Axios
- Mongoose

### Database

- MongoDB / MongoDB Atlas

### External API

- TMDB

## Project Structure

```text
Movie Discovery App/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       └── server.js
└── frontend/
    ├── .env.example
    ├── favicon.svg
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    └── src/
        ├── api/
        │   └── client.js
        ├── components/
        │   ├── Header.jsx
        │   ├── MovieCard.jsx
        │   └── States.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── MovieDetails.jsx
        │   └── Wishlist.jsx
        ├── App.jsx
        ├── context.jsx
        ├── main.jsx
        └── styles.css
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account or a local MongoDB instance
- TMDB API key

### 1. Clone the repository

```bash
git clone https://github.com/krutarthdubey/Movie-Discovery-App.git
cd Movie-Discovery-App
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file from `.env.example` and set the required values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

> On Windows PowerShell, create the `.env` files manually if `cp` is unavailable. Never commit real API keys or database credentials.

## API Endpoints

### Movie endpoints

- `GET /api/movies/popular`
- `GET /api/movies/top-rated`
- `GET /api/movies/now-playing`
- `GET /api/movies/upcoming`
- `GET /api/movies/search`
- `GET /api/movies/genres`
- `GET /api/movies/:id`

### Wishlist endpoints

- `GET /api/wishlist/:userId`
- `POST /api/wishlist/:userId`
- `DELETE /api/wishlist/:userId/:movieId`

### Health endpoint

- `GET /api/health`

## Important Technical Decisions

### Backend abstraction

The frontend talks only to Express. This keeps the external API key on the server and gives the frontend a stable API contract even if the provider's response structure changes.

### Caching

Movie responses are cached in memory for a short period to avoid unnecessary repeated requests. A stale cache can also be used when the external movie service is temporarily unavailable. For a multi-instance production deployment, Redis or another shared cache would be a better choice.

### Request cancellation

The frontend uses `AbortController` for movie-list requests. When users change searches or filters quickly, older requests are cancelled so stale responses do not overwrite newer results.

### Retry and timeout handling

The backend uses a short request timeout and a limited retry strategy for the external movie service. The frontend also retries suitable GET requests. This improves resilience without creating an uncontrolled request loop.

### Wishlist persistence

Wishlist records are stored in MongoDB. The browser generates an anonymous user ID and keeps it in `localStorage`, allowing the same wishlist to be recovered after reopening the application in that browser.

### Data modelling

The database stores wishlist information rather than the complete movie catalogue. Each wishlist record contains a small movie snapshot, while current movie catalogue information continues to come from the external provider.

## Error and Edge-Case Handling

The application accounts for:

- Slow external movie-service responses
- Temporary external-service failures
- Repeated requests
- Rapid search/filter changes
- Empty search results
- Invalid movie IDs
- Missing movie information
- MongoDB being unavailable
- Large result sets through pagination
- Loading and error states in the UI

## Assumptions

- Authentication is not required by the assignment, so wishlist ownership uses an anonymous browser-generated ID.
- MongoDB is used for persistent wishlist storage.
- TMDB is the selected third-party movie provider.
- Movie catalogue information does not need to be duplicated in MongoDB for this assignment.

## Known Limitations

- The movie-response cache is process-local and is cleared when the backend restarts.
- Anonymous wishlist data is browser-specific and is not synchronized between devices.
- There is no authentication or multi-device account syncing.
- The cache is not shared between multiple backend instances.
- Automated tests and CI/CD are not included in the current submission.

## AI Transparency

AI tools, including ChatGPT, were used as development support for the project. They helped with initial boilerplate, understanding the third-party API, debugging request failures, reviewing error-handling approaches, improving code readability, and considering architecture alternatives.

The final application structure, API boundary, persistence approach, caching strategy, resilience behaviour, UI requirements, and implementation decisions were reviewed and adapted for this assignment. The submitted code is intended to be understood and explainable by the developer.

## What I Would Improve With More Time

- Add authentication and multi-device wishlist synchronization
- Replace process-local caching with Redis
- Add API rate limiting
- Add automated unit/integration tests and CI
- Add stronger observability with structured logs and metrics
- Improve image loading and optimization
- Add richer discovery features such as actor/director filters and recommendations
- Add production deployment configuration

## Assignment Coverage

| Requirement | Implementation |
|---|---|
| Movie discovery | Category-based browsing and search |
| Categories | Popular, Top Rated, Now Playing, Upcoming |
| Ordering/filtering | Sorting and genre filtering |
| Large result sets | Pagination |
| Movie details | Dedicated details page with metadata and cast |
| Persistent wishlist | MongoDB + anonymous browser ID |
| Backend abstraction | React → Express → TMDB |
| Repeated requests | In-memory caching |
| Rapid requests | AbortController |
| Slow/failing service | Timeout, retries, stale cache, friendly errors |
| Responsive UI | Responsive CSS layouts |
| Loading/empty/error states | Dedicated UI states |
