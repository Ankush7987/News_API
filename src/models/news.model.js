const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  categories: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one category is required'
    },
    enum: ['India', 'World', 'Tech', 'Politics', 'Business', 'Sports', 'Health', 'Entertainment', 'Science', 'Other'],
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index for faster queries
newsSchema.index({ categories: 1, publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);