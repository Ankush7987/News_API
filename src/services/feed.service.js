/**
 * Feed Service
 * 
 * This service handles fetching and processing RSS feeds, including:
 * - Parsing RSS feeds from multiple sources
 * - Extracting news data
 * - Deduplicating news items
 * - Saving news to the database
 */

const Parser = require('rss-parser');
const axios = require('axios');
const News = require('../models/news.model');
const feedSources = require('../feeds/feed-sources');

// Initialize RSS parser
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

/**
 * Extract image URL from RSS feed item
 * @param {Object} item - RSS feed item
 * @returns {String} - Image URL or empty string
 */
const extractImageUrl = (item) => {
  // Try to get image from media:content
  if (item.media && item.media.$ && item.media.$.url) {
    return item.media.$.url;
  }
  
  // Try to get image from enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // Try to extract image from content or description using regex
  const content = item.contentEncoded || item.content || item.description || '';
  const imgRegex = /<img[^>]+src="([^"]+)"/;
  const match = content.match(imgRegex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return '';
};

/**
 * Extract summary from RSS feed item
 * @param {Object} item - RSS feed item
 * @returns {String} - Summary text
 */
const extractSummary = (item) => {
  // Get content from description or content
  let content = item.contentSnippet || item.description || '';
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, '');
  
  // Truncate to 100 words if needed
  const words = content.split(/\s+/);
  if (words.length > 100) {
    return words.slice(0, 100).join(' ') + '...';
  }
  
  return content;
};

/**
 * Process a single RSS feed
 * @param {Object} feedSource - Feed source configuration
 * @returns {Promise<Array>} - Array of processed news items
 */
const processFeed = async (feedSource) => {
  try {
    console.log(`Processing feed: ${feedSource.source} - ${feedSource.category}`);
    
    // Parse the RSS feed
    const feed = await parser.parseURL(feedSource.url);
    const processedItems = [];
    
    // Process each item in the feed
    for (const item of feed.items) {
      // Extract data from the feed item
      const newsItem = {
        title: item.title,
        imageUrl: extractImageUrl(item),
        summary: extractSummary(item),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: feedSource.source,
        author: item.creator || item.author || 'Unknown',
        categories: [feedSource.category],
        url: item.link
      };
      
      // Check if this news item already exists in the database
      const existingNews = await News.findOne({ title: newsItem.title });
      
      if (!existingNews) {
        // Save the news item to the database
        const newNews = new News(newsItem);
        await newNews.save();
        processedItems.push(newsItem);
        console.log(`Added new news item: ${newsItem.title}`);
      } else {
        console.log(`Skipped duplicate news item: ${newsItem.title}`);
      }
    }
    
    return processedItems;
  } catch (error) {
    console.error(`Error processing feed ${feedSource.url}:`, error);
    return [];
  }
};

/**
 * Process all RSS feeds
 * @returns {Promise<Object>} - Result of processing all feeds
 */
const processAllFeeds = async () => {
  console.log('Starting to process all feeds...');
  
  const results = {
    totalProcessed: 0,
    newItems: 0,
    errors: 0
  };
  
  // Process each feed source
  for (const feedSource of feedSources) {
    try {
      const processedItems = await processFeed(feedSource);
      results.totalProcessed += 1;
      results.newItems += processedItems.length;
    } catch (error) {
      console.error(`Error processing feed source ${feedSource.source}:`, error);
      results.errors += 1;
    }
  }
  
  console.log(`Completed processing all feeds. Results: ${JSON.stringify(results)}`);
  return results;
};

module.exports = {
  processFeed,
  processAllFeeds
};