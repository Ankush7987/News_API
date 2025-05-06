# Contact Form System

This document provides instructions for setting up and using the contact form system implemented with Node.js, Express, and Nodemailer.

## Overview

The contact form system allows users to send messages through a form on the website. When a user submits the form with their name, email, subject, and message, the backend sends this data to a specified email address using Gmail SMTP.

## Features

- Backend API endpoint (`/api/contact`) to handle form submissions
- Email sending using Nodemailer and Gmail SMTP
- Secure credential storage using environment variables
- Form validation and error handling
- User-friendly feedback on submission status

## Setup Instructions

### 1. Install Dependencies

Make sure you have all the required dependencies installed:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

1. Create a `.env` file in the `backend` directory based on the provided `.env.example`:

```
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/newsflow

# Server Port
PORT=3000

# Email Configuration
EMAIL_USER=creercraftadvisors@gmail.com
EMAIL_PASS=your_app_password_here
TO_EMAIL=creercraftadvisors@gmail.com
```

2. Replace `your_app_password_here` with your actual Gmail App Password (see instructions below).

### 3. How to Generate a Gmail App Password

To use Gmail SMTP for sending emails, you need to generate an App Password:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Select "Security" from the left sidebar
3. Under "Signing in to Google," select "2-Step Verification" (enable it if not already enabled)
4. Scroll down and select "App passwords"
5. Select "Mail" as the app and "Other" as the device (name it "NewsFlow Contact Form")
6. Click "Generate"
7. Google will display a 16-character password - copy this password
8. Paste this password as the value for `EMAIL_PASS` in your `.env` file

**Important**: Keep this password secure and never share it publicly.

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

## Usage

### Frontend Integration

The contact form in `frontend/pages/contact.js` is already configured to send data to the `/api/contact` endpoint. When a user submits the form:

1. The form data is sent to the backend API
2. The backend validates the input and sends an email
3. The user receives feedback on the submission status

### API Endpoint

- **URL**: `/api/contact`
- **Method**: POST
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "subject": "Message Subject",
    "message": "Message content..."
  }
  ```
- **Success Response**: Status 200
  ```json
  {
    "status": "success",
    "message": "Your message has been sent successfully!"
  }
  ```
- **Error Response**: Status 400/500
  ```json
  {
    "status": "error",
    "message": "Error message"
  }
  ```

## Troubleshooting

- **Email not sending**: Verify your Gmail App Password is correct and that "Less secure app access" is enabled in your Google account settings.
- **SMTP connection errors**: Make sure your network allows outgoing connections on port 587 (Gmail SMTP).
- **Form submission errors**: Check the browser console for any JavaScript errors or network request failures.

## Security Considerations

- The `.env` file contains sensitive information and should never be committed to version control.
- Consider implementing rate limiting to prevent abuse of the contact form.
- Validate and sanitize all user input to prevent injection attacks.