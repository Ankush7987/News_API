# Render Deployment Guide for News API

## MongoDB Atlas Connection Issues

If you're experiencing TLS/SSL connection errors when deploying to Render, follow these steps to resolve them:

### 1. Update Your MongoDB Atlas Connection String

In your Render environment variables, update your `MONGODB_URI` with the following format:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&authSource=admin&tls=true&minTlsVersion=TLSv1.2
```

Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your actual MongoDB Atlas credentials.

### 2. MongoDB Atlas Configuration

1. **Network Access Settings**:
   - Go to MongoDB Atlas dashboard → Network Access
   - Add Render's IP addresses to the allowlist
   - For testing, you can temporarily allow access from anywhere (0.0.0.0/0)

2. **Database User**:
   - Ensure your database user has the correct permissions
   - Use a strong, unique password

### 3. Render Environment Variables

Make sure these environment variables are set in your Render dashboard:

- `MONGODB_URI`: Your MongoDB Atlas connection string with TLS parameters
- `NODE_ENV`: Set to `production`
- `PORT`: Usually set to `3000` or `10000` (Render may override this)
- `SKIP_REDIS`: Set to `true` if you're not using Redis

### 4. Common TLS Errors and Solutions

#### Error: `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`

This error typically occurs when:

1. **TLS Version Mismatch**: MongoDB Atlas requires TLS 1.2 or higher
   - Solution: Add `minTlsVersion=TLSv1.2` to your connection string

2. **Certificate Validation Issues**:
   - Solution: Ensure `tlsInsecure=false` in your connection string

3. **Network Restrictions**:
   - Solution: Check MongoDB Atlas Network Access settings

### 5. Monitoring and Debugging

- Check Render logs for detailed error messages
- Use the `/health` endpoint to monitor your MongoDB connection status
- Implement proper error handling in your application

### 6. Render-Specific Recommendations

- Use a Web Service with at least 0.5 CPU / 512MB RAM
- Set appropriate startup timeout (at least 60 seconds)
- Configure health check endpoint to `/health`

By following these steps, you should be able to resolve the TLS connection issues between Render and MongoDB Atlas.