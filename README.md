# Real-time News API

A clean, fast, and real-time News API built with Node.js that fetches news from multiple sources using their RSS feeds and serves categorized, de-duplicated news in JSON format. The system auto-updates hourly and always reflects the latest published news.

## Features

- **Multiple RSS Feed Sources**: Fetches news from various sources like NDTV, Indian Express, BBC, etc.
- **Categorization**: News items are categorized (India, World, Tech, Business, Sports, Health, etc.)
- **Deduplication**: Ensures no duplicate news items are saved or returned
- **Real-time Updates**: Background jobs fetch fresh news every hour
- **RESTful API**: Clean API endpoints for accessing news data
- **Performance Optimized**: Fast response times with pagination

## Tech Stack

- Node.js & Express.js
- RSS Parser (rss-parser)
- Queue System: BullMQ + Redis
- MongoDB for storage
- Security: Helmet, Rate Limiting, etc.

## API Endpoints

- `/api/news?category=world` - Returns list of latest news from "World" category
- `/api/news/latest` - Returns latest 50 news sorted by timestamp
- `/api/update-news` - Manual trigger to update news (protected with admin token)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Redis server
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd news-api
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/news-api
   REDIS_URL=redis://localhost:6379
   ADMIN_TOKEN=your_admin_token_here
   ```

4. Start the server
   ```
   npm start
   ```
   For development with auto-reload:
   ```
   npm run dev
   ```

## Project Structure

```
/src
  /feeds        - RSS feed configurations
  /controllers  - API route handlers
  /services     - Business logic
  /models       - Database models
  /utils        - Helper functions
  /routes       - API route definitions
  /jobs         - Background job definitions
  /config       - Configuration files
  index.js      - Application entry point
```

## License

ISC