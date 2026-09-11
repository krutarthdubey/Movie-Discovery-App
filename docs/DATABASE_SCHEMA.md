# Database Schema

## MongoDB collection

The backend uses MongoDB with Mongoose. The application stores wishlist entries in a single `wishlists` collection.

### Wishlist document

| Field | Type | Required | Description |
|---|---|---:|---|
| `userId` | String | Yes | Anonymous browser-level user identifier stored in frontend localStorage. Indexed for fast lookup. |
| `movieId` | Number | Yes | TMDB movie ID. |
| `title` | String | No | Movie title saved with the wishlist entry. |
| `posterPath` | String | No | TMDB poster path. |
| `backdropPath` | String | No | TMDB backdrop path. |
| `releaseDate` | String | No | Movie release date. |
| `voteAverage` | Number | No | TMDB rating at the time the movie was saved. |
| `overview` | String | No | Movie synopsis. |
| `savedAt` | Date | No | Time the wishlist item was saved; defaults to current time. |
| `createdAt` | Date | Auto | Added by Mongoose timestamps. |
| `updatedAt` | Date | Auto | Added by Mongoose timestamps. |

## Indexes

The collection has two indexes:

- `userId`: non-unique index for efficient wishlist queries by user.
- `{ userId: 1, movieId: 1 }`: unique compound index so the same movie cannot be saved twice for the same browser user.

## Persistence flow

1. The frontend creates a browser-level anonymous ID and stores it in `localStorage`.
2. The frontend sends that ID to the backend for wishlist requests.
3. The backend stores wishlist entries in MongoDB under that `userId`.
4. When the application is reopened, the same browser ID is reused and the saved wishlist is loaded from MongoDB.

This is intentionally lightweight for the screening assignment. It is not intended to replace a full authentication and user-account system.
