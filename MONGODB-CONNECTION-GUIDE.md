# MongoDB Connection Guide

This guide explains the MongoDB connection configuration in the application and provides troubleshooting steps for common issues.

## Current Configuration

We've implemented the following improvements to the MongoDB connection:

### 1. Enhanced Connection Options

```javascript
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // Timeout for server selection (increased from default)
  socketTimeoutMS: 45000, // How long the MongoDB driver will wait before timing out operations
  connectTimeoutMS: 30000, // How long to wait for initial connection
  maxPoolSize: 10, // Maximum number of sockets the MongoDB driver will keep open for this connection
  minPoolSize: 1, // Minimum number of sockets the MongoDB driver will keep open for this connection
  heartbeatFrequencyMS: 10000, // How often to send heartbeats
  retryWrites: true, // Automatically retry failed writes
  retryReads: true, // Automatically retry failed reads
  maxIdleTimeMS: 45000, // How long a connection can remain idle before being closed
  autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
};
```

### 2. Connection Event Monitoring

The application now monitors MongoDB connection events:

- `connected`: Logged when connection is established
- `error`: Logged when connection errors occur
- `disconnected`: Logged when connection is lost
- `reconnected`: Logged when connection is reestablished

### 3. Improved Query Timeout Handling

All database queries now have:
- A maximum execution time of 5000ms (5 seconds)
- Proper error handling with specific error messages
- Fallback to cache when the database is unavailable

### 4. Health Check Endpoint

The `/health` endpoint now includes MongoDB connection status for monitoring.

## Troubleshooting MongoDB Connection Issues on Render

### Common Issues and Solutions

1. **Connection Timeouts**
   - Ensure your MongoDB Atlas IP allowlist includes Render's IPs
   - Check the Render logs for any connection error details
   - Try increasing the connection timeout values (currently set to 30 seconds)

2. **Operation Timeouts**
   - If operations time out after connection is established, consider:
     - Reviewing and optimizing database queries
     - Adding appropriate indexes to your collections
     - Scaling up your MongoDB Atlas cluster

3. **Blocked Connections**
   - Ensure MongoDB Atlas network access settings allow connections from Render
   - Whitelist the IP ranges used by Render in your MongoDB Atlas settings

### Setting Up MongoDB Atlas for Render

1. In MongoDB Atlas, go to "Network Access" under "Security"
2. Add the IP addresses of your Render deployment
3. For testing, you can temporarily allow access from anywhere (0.0.0.0/0)
4. Use a dedicated database user with appropriate permissions 

### Render-Specific Configuration

1. **Set Environment Variables**
   - Ensure `MONGODB_URI` is correctly set in your Render dashboard
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

2. **Connection Pooling**
   - Our app uses connection pooling (maxPoolSize: 10)
   - This is especially important on Render to handle multiple requests efficiently

3. **Monitoring**
   - Use the `/health` endpoint to monitor your MongoDB connection
   - Set up health checks in Render to alert on connection issues

## Port Configuration for Render

Render automatically sets a `PORT` environment variable that your app should use. Our application is configured to use this port:

```javascript
const PORT = process.env.PORT || 3000;
```

## Logs and Debugging

When troubleshooting, check:
1. The application logs for detailed error messages
2. MongoDB Atlas logs for connection attempts
3. The MongoDB connection status via the `/health` endpoint

## Emergency Fallback

If the database becomes completely unavailable, the application will:
1. Return cached data if available (30-minute TTL)
2. Return a user-friendly error message if no cache exists 