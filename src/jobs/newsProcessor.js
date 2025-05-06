/**
 * News Processor
 * 
 * This file contains the processor function for the news queue jobs.
 * It handles fetching news from RSS feeds and storing them in MongoDB.
 */

const Parser = require('rss-parser');
const { URL } = require('url');
const axios = require('axios');
const cheerio = require('cheerio');
const News = require('../models/news.model');
const feedSources = require('../feeds/feed-sources');

// Initialize RSS parser with custom fields for media content
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
      ['enclosure', 'enclosure']
    ]
  }
});

/**
 * Fetch and parse the article page to extract image URL
 * @param {String} url - Article URL
 * @returns {Promise<String>} - Image URL or empty string
 */
const fetchArticleImage = async (url) => {
  try {
    // Set a timeout to avoid hanging on slow requests
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    let imageUrl = '';
    
    // Try to get Open Graph image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      return ogImage;
    }
    
    // Try to get Twitter image
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) {
      return twitterImage;
    }
    
    // Try to get the first large image in the article
    $('img').each((i, img) => {
      const src = $(img).attr('src');
      const dataSrc = $(img).attr('data-src');
      const imgSrc = dataSrc || src;
      
      if (imgSrc && !imageUrl) {
        // Skip small icons and logos (often less than 100px)
        const width = parseInt($(img).attr('width'), 10) || 0;
        const height = parseInt($(img).attr('height'), 10) || 0;
        
        if ((width === 0 && height === 0) || (width > 100 && height > 100)) {
          imageUrl = imgSrc;
        }
      }
    });
    
    return imageUrl;
  } catch (error) {
    console.error(`Error fetching article image from ${url}:`, error.message);
    return '';
  }
};

/**
 * Extract image URL from RSS feed item
 * @param {Object} item - RSS feed item
 * @returns {Promise<String>} - Image URL or empty string
 */
const extractImageUrl = async (item) => {
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
  
  // If no image found in RSS feed, try to fetch from the article page
  if (item.link) {
    const articleImage = await fetchArticleImage(item.link);
    if (articleImage) {
      return articleImage;
    }
  }
  
  // Default placeholder image if no image is found
  return 'https://placehold.co/640x360?text=News+Image';
};

/**
 * Fetch and parse the article page to extract summary content
 * @param {String} url - Article URL
 * @returns {Promise<String|null>} - Article summary or null if not available
 */
const fetchArticleSummary = async (url) => {
  try {
    // Set a timeout to avoid hanging on slow requests
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    let content = '';
    
    // Try to get content from article body
    // Look for common article content containers
    const contentSelectors = [
      'article', '.article-content', '.post-content', '.entry-content',
      '[itemprop="articleBody"]', '.story-body', '.news-article', '.content-body',
      'main', '#content', '.main-content'
    ];
    
    // Try each selector until we find content
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Get text from paragraphs within the content container
        element.find('p').each((i, el) => {
          content += $(el).text() + ' ';
        });
        
        if (content.trim().length > 0) {
          break;
        }
      }
    }
    
    // If no content found from selectors, try getting all paragraphs
    if (content.trim().length === 0) {
      $('p').each((i, el) => {
        // Skip very short paragraphs that are likely not content
        const text = $(el).text().trim();
        if (text.length > 20) {
          content += text + ' ';
        }
      });
    }
    
    // Clean and trim the content
    content = content.trim();
    
    // If we have content, extract the first 50-100 words
    if (content.length > 0) {
      const words = content.split(/\s+/);
      const wordCount = Math.min(words.length, 100);
      return words.slice(0, wordCount).join(' ') + (wordCount < words.length ? '...' : '');
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching article summary from ${url}:`, error.message);
    return null;
  }
};

/**
 * Extract description from RSS feed item and limit to 100 words
 * @param {Object} item - RSS feed item
 * @returns {Promise<String|null>} - Limited description or null if not available
 */
const extractDescription = async (item) => {
  // Get content from description or content
  let content = item.contentSnippet || item.description || '';
  
  // Check if content is 'null' as a string and convert to actual null
  if (content === 'null' || content === '') {
    // If no content in RSS feed and we have a link, try to fetch from article
    if (item.link) {
      return await fetchArticleSummary(item.link);
    }
    return null;
  }
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, '').trim();
  
  // If content is empty after cleaning, try to fetch from article
  if (content === '' && item.link) {
    return await fetchArticleSummary(item.link);
  }
  
  // Truncate to 100 words if needed
  const words = content.split(/\s+/);
  if (words.length > 100) {
    return words.slice(0, 100).join(' ') + '...';
  }
  
  return content.length > 0 ? content : null;
};

/**
 * Extract hostname from URL
 * @param {String} urlString - URL string
 * @returns {String} - Hostname
 */
const extractHostname = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error(`Error extracting hostname from ${urlString}:`, error);
    return 'unknown';
  }
};

/**
 * Process a single RSS feed
 * @param {Object} feedSource - Feed source configuration
 * @returns {Promise<Array>} - Array of processed news items
 */
/**
 * Normalize category name to match the enum in the news model
 * @param {String} category - Category name to normalize
 * @returns {String} - Normalized category name
 */
const normalizeCategory = (category) => {
  if (!category) return 'General';
  
  // Map of possible category variations to normalized names
  const categoryMap = {
    'india': 'India',
    'world': 'World',
    'tech': 'Tech',
    'technology': 'Tech',
    'gadgets': 'Tech',
    'politics': 'Politics',
    'business': 'Business',
    'economy': 'Business',
    'finance': 'Business',
    'sports': 'Sports',
    'sport': 'Sports',
    'health': 'Health',
    'healthcare': 'Health',
    'wellness': 'Health',
    'entertainment': 'Entertainment',
    'movies': 'Entertainment',
    'science': 'Science',
    'education': 'Science',
    'other': 'Other',
    'general': 'General'
  };
  
  // Convert to lowercase for case-insensitive matching
  const lowerCategory = category.toLowerCase();
  
  // Return the normalized category or the original with first letter capitalized
  return categoryMap[lowerCategory] || 
         (category.charAt(0).toUpperCase() + category.slice(1));
};

const processFeed = async (feedSource) => {
  try {
    // Normalize the category from the feed source
    const normalizedCategory = normalizeCategory(feedSource.category);
    
    console.log(`Processing feed: ${feedSource.source} - ${normalizedCategory} (original: ${feedSource.category})`);
    
    // Special log for the new NDTV feed
    if (feedSource.url === 'https://feeds.feedburner.com/ndtvnews-top-stories') {
      console.log(`✅ Successfully processing NDTV feed with URL: ${feedSource.url}`);
    }
    
    // Parse the RSS feed
    const feed = await parser.parseURL(feedSource.url);
    const processedItems = [];
    
    // Process each item in the feed
    for (const item of feed.items) {
      // Extract source hostname from feed URL if not provided
      const source = feedSource.source || extractHostname(feedSource.url);
      
      // Extract image URL (now async)
      let imageUrl = '';
      try {
        imageUrl = await extractImageUrl(item);
      } catch (error) {
        console.error(`Error extracting image for article: ${item.title}`, error.message);
        imageUrl = 'https://placehold.co/640x360?text=News+Image';
      }
      
      // Extract data from the feed item
      const summary = await extractDescription(item);
      
      const newsItem = {
        title: item.title,
        summary: summary,
        author: item.creator || item.author || 'Unknown',
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: source,
        imageUrl: imageUrl,
        categories: [normalizedCategory || 'General'] // Use normalized category with fallback
      };
      
      // Check if this news item already exists in the database
      const existingNews = await News.findOne({ 
        title: newsItem.title,
        source: newsItem.source
      });
      
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
    errors: 0,
    startTime: new Date(),
    endTime: null,
    categoryCounts: {} // Track counts per category
  };
  
  // Process each feed source
  for (const feedSource of feedSources) {
    try {
      const processedItems = await processFeed(feedSource);
      results.totalProcessed += 1;
      results.newItems += processedItems.length;
      
      // Track category counts
      if (processedItems.length > 0) {
        // Get the normalized category
        const normalizedCategory = normalizeCategory(feedSource.category);
        
        // Initialize or increment the category count
        if (!results.categoryCounts[normalizedCategory]) {
          results.categoryCounts[normalizedCategory] = processedItems.length;
        } else {
          results.categoryCounts[normalizedCategory] += processedItems.length;
        }
        
        console.log(`Added ${processedItems.length} articles to category: ${normalizedCategory}`);
      }
    } catch (error) {
      console.error(`Error processing feed source ${feedSource.source}:`, error);
      results.errors += 1;
    }
  }
  
  results.endTime = new Date();
  const duration = (results.endTime - results.startTime) / 1000;
  
  console.log(`Completed processing all feeds in ${duration.toFixed(2)} seconds.`);
  console.log(`Results: ${results.totalProcessed} feeds processed, ${results.newItems} new items added, ${results.errors} errors`);
  
  // Log category distribution
  console.log('Category distribution:');
  for (const [category, count] of Object.entries(results.categoryCounts)) {
    console.log(`- ${category}: ${count} articles`);
  }
  
  return results;
};

/**
 * News processor function for BullMQ worker
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const newsProcessor = async (job) => {
  try {
    console.log(`Starting news processor job ${job.id}`);
    
    // Update job progress
    await job.updateProgress(10);
    
    // Process all feeds
    const results = await processAllFeeds();
    
    // Update job progress
    await job.updateProgress(100);
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('Error in news processor:', error);
    throw error; // Re-throw to let BullMQ handle retries
  }
};

module.exports = newsProcessor;