# MangaCompass

MangaCompass is a platform for organizing manga collections and discovering new works through personalized recommendations.

The project allows users to create a personal library, track their reading progress, and receive recommendations based on their interests and history.

> This project was created for study and portfolio purposes using the [MangaDex API](https://api.mangadex.org/docs/).

> _This project is under active development. Features and APIs may change without notice._

---

## Contents

- [Features](#features)
- [Technologies](#technologies)
- [Running Locally](#running-locally)
- [Architecture](#architecture)
- [API](#api)
- [Roadmap](#roadmap)
- [Acknowledgements](#acknowledgements)

---

## Features

- Manga search using the MangaDex API
- Local cache of imported works
- Personal library
- Reading progress tracking
- Recommendation system (in development)

---

## Technologies

### Backend

- NestJS
- Prisma
- PostgreSQL
- TypeScript

---

## Running Locally

### Requirements

- Node.js
- PostgreSQL
- pnpm

### Installation

```bash
git clone https://github.com/Caduyz/manga-recommender.git
cd manga-recommender

pnpm install
```

Configure the environment variables:

```.env
DATABASE_URL=
```

Run database migrations:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

Start the application:

```bash
pnpm start:dev
```

---

## Architecture

The backend is built using a modular architecture with NestJS. Each module is responsible for a specific domain of the application.

src  
├── library  
├── manga  
├── mangadex  
├── prisma  
├── recommendation  
├── search  
├── sync  
└── app.module.ts

> External data synchronization is handled separately through the Sync module.

### Current Data Flow

```
  MangaDex API
       |
       v
    Mapper
       |
       v
Internal Models
       |
       v
   Database
```

---

## API

### Mangas

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | `/mangas/:mangaId` |

### Search

| Method | Endpoint               |
| ------ | ---------------------- |
| GET    | `/search?title={...}`  |
| GET    | `/search?author={...}` |
| GET    | `/search?tag={...}`    |

> You can combine author and tag filters

### Library

| Method | Endpoint            |
| ------ | ------------------- |
| GET    | `/library`          |
| POST   | `/library`          |
| PATCH  | `/library/:mangaId` |
| DELETE | `/library/:mangaId` |

### Recommendations

| Method | Endpoint                            |
| ------ | ----------------------------------- |
| GET    | `/recommendations/random`           |
| GET    | `/recommendations/similar/:mangaId` |

### Synchronization

| Method | Endpoint               |
| ------ | ---------------------- |
| POST   | `/sync/manga/:mangaId` |

> Full API documentation will be available through Swagger.

---

## Roadmap

- [x] Manga data synchronization
- [x] Library
- [ ] Recommendations algorithm (50%)
- [ ] Authentication
- [ ] Web interface

---

## Acknowledgements

- This project uses the [MangaDex API](https://api.mangadex.org/docs/) to retrieve manga metadata and statistics.

---
