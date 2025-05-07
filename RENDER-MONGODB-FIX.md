# MongoDB Connection Fix for Render Deployment

## Issue Fixed

The error `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` was occurring during deployment on Render due to TLS/SSL configuration issues when connecting to MongoDB Atlas.

## Changes Made

### 1. Updated MongoDB Connection Options

In `src/index.js`, we've added explicit TLS configuration parameters:

```javascript
mongooseOptions.tlsInsecure = false; // Ensure proper certificate validation
mongooseOptions.tlsAllowInvalidCertificates = false;
mongooseOptions.tlsAllowInvalidHostnames = false;
mongooseOptions.minTlsVersion = 'TLSv1.2'; // Enforce minimum TLS version
mongooseOptions.maxTlsVersion = 'TLSv1.3'; // Support latest TLS version
```

### 2. Updated MongoDB Connection String

The MongoDB connection string in `.env` has been updated with proper TLS parameters:

```
MONGODB_URI=mongodb+srv://ankushchaurasiya8:<password>@ac-q18k7kh.zbke8xj.mongodb.net/news-api?retryWrites=true&w=majority&authSource=admin&tls=true&tlsInsecure=false&minTlsVersion=TLSv1.2
```

### 3. Created Deployment Guide

A new `RENDER-DEPLOYMENT-GUIDE.md` file has been created with detailed instructions for:
- Configuring MongoDB Atlas for Render
- Setting up environment variables
- Troubleshooting common TLS errors

## How to Deploy

1. Replace `<password>` in the MongoDB connection string with your actual password
2. Set this updated connection string in your Render environment variables
3. Ensure MongoDB Atlas Network Access settings allow connections from Render
4. Deploy your application on Render

## Verification

After deployment, verify the connection is working by:
1. Checking Render logs for successful MongoDB connection messages
2. Accessing the `/health` endpoint to confirm MongoDB connection status

If you continue to experience issues, refer to the detailed `RENDER-DEPLOYMENT-GUIDE.md` for additional troubleshooting steps.