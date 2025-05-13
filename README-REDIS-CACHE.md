# Redis Caching Implementation

This document explains the Redis caching implementation for the News API to improve first-time load performance.

## Overview

The Redis caching system has been implemented to significantly improve the first-time load performance of the news website. When a user requests news data, the system will:

1. Check if the requested data exists in Redis cache
2. If cached data exists and is not expired, serve it directly (avoiding database queries)
3. If no cached data exists, fetch from the database, cache the results, and then return

All cached data has a 5-minute expiration time to ensure users receive reasonably fresh content while still benefiting from the performance improvements.

## Implementation Details

### Cache Utility

A dedicated cache utility (`cache.util.js`) has been created with the following functions:

- `setCache(key, data, expiration)`: Stores data in Redis with an expiration time
- `getCache(key)`: Retrieves data from Redis cache
- `deleteCache(key)`: Removes a specific key from cache
- `clearCachePattern(pattern)`: Clears all cache keys matching a pattern

### Controller Integration

The news controllers have been updated to:

1. First check Redis cache before querying the database
2. Cache database results in Redis after fetching
3. Maintain the existing fallback cache for database failure scenarios

### Cache Invalidation

When news data is updated (either automatically or manually), the cache is automatically cleared to ensure users receive the latest content.

## Configuration

### Environment Variables

To configure Redis, set the following environment variables:

```
# Redis Configuration
REDIS_URL=rediss://default:password@hostname:6379

# Optional: Set to 'true' to disable Redis in development
# SKIP_REDIS=false
```

### Local Development

For local development without Redis:

1. Set `SKIP_REDIS=true` in your `.env` file
2. The system will automatically fall back to the in-memory cache

### Docker Development

If using Docker for local development with Redis:

1. Ensure Redis is running on port 6380
2. The system will automatically connect to the local Redis instance

## Performance Impact

With Redis caching implemented:

- First-time API requests that hit the cache will be served in milliseconds instead of hundreds of milliseconds
- Database load is significantly reduced during traffic spikes
- The system is more resilient to database performance fluctuations

## Troubleshooting

If you encounter issues with the Redis cache:

1. Check Redis connection logs in the console
2. Verify your Redis URL is correctly formatted
3. Ensure Redis server is running and accessible
4. Set `SKIP_REDIS=true` temporarily to bypass Redis and use in-memory cache

## Future Improvements

- Implement cache warming for popular content
- Add cache analytics to monitor hit/miss rates
- Implement variable cache expiration based on content type