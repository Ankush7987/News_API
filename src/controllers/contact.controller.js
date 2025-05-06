const nodemailer = require('nodemailer');

/**
 * Controller for handling contact form submissions
 */
exports.submitContactForm = async (req, res) => {
  // Ensure response is always JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required: name, email, subject, and message'
      });
    }
    
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.TO_EMAIL) {
      console.error('Email configuration missing. Check environment variables.');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error. Please contact the administrator.'
      });
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.TO_EMAIL,
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({
      status: 'success',
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send your message. Please try again later.'
    });
  }
};