/**
 * RSS Feed Sources Configuration
 * 
 * This file contains the list of RSS feed URLs from various news sources,
 * along with their corresponding categories.
 */

module.exports = [
  // India News
  {
    url: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    category: 'India',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/india/feed/',
    category: 'India',
    source: 'Indian Express'
  },
  {
    url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
    category: 'India',
    source: 'Times of India'
  },
  
  // World News
  {
    url: 'http://feeds.feedburner.com/NDTV-LatestNews',
    category: 'World',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/world/feed/',
    category: 'World',
    source: 'Indian Express'
  },
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'World',
    source: 'BBC'
  },
  
  // Technology News
  {
    url: 'https://www.ndtv.com/gadgets/rss',
    category: 'Tech',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/technology/feed/',
    category: 'Tech',
    source: 'Indian Express'
  },
  {
    url: 'https://feeds.feedburner.com/TechCrunch/',
    category: 'Tech',
    source: 'TechCrunch'
  },
  
  // Business News
  {
    url: 'https://www.ndtv.com/business/rss',
    category: 'Business',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/business/feed/',
    category: 'Business',
    source: 'Indian Express'
  },
  {
    url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    category: 'Business',
    source: 'Economic Times'
  },
  
  // Sports News
  {
    url: 'https://sports.ndtv.com/rss/all',
    category: 'Sports',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/sports/feed/',
    category: 'Sports',
    source: 'Indian Express'
  },
  {
    url: 'https://www.espn.in/espn/rss/news',
    category: 'Sports',
    source: 'ESPN'
  },
  
  // Health News
  {
    url: 'https://www.ndtv.com/health/rss',
    category: 'Health',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/lifestyle/health/feed/',
    category: 'Health',
    source: 'Indian Express'
  },
  {
    url: 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
    category: 'Health',
    source: 'WebMD'
  },
  
  // Entertainment News
  {
    url: 'https://www.ndtv.com/entertainment/rss',
    category: 'Entertainment',
    source: 'NDTV'
  },
  {
    url: 'https://indianexpress.com/section/entertainment/feed/',
    category: 'Entertainment',
    source: 'Indian Express'
  },
  {
    url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
    category: 'Entertainment',
    source: 'Times of India'
  },
  
  // Science News
  {
    url: 'https://www.sciencedaily.com/rss/all.xml',
    category: 'Science',
    source: 'Science Daily'
  },
  {
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'Science',
    source: 'BBC'
  }
];