const SearchQuery = require("../models/SearchQuery");
const logger = require("../utils/logger");

/**
 * Advanced Search Service with Multi-Factor Ranking Algorithm
 * Optimized for Indian e-commerce market with Hinglish support
 */
class SearchService {
  constructor(productRepository) {
    this.productRepository = productRepository;
    this.searchCache = new Map(); // Simple LRU cache for frequent queries
    this.maxCacheSize = 1000;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Main search method with ranking and filtering
   */
  async search(queryParams) {
    const startTime = Date.now();

    try {
      // Parse and validate search query
      const searchQuery = new SearchQuery(queryParams);

      // Check cache first
      const cacheKey = this.generateCacheKey(searchQuery);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        this.cacheStats.hits++;
        logger.info("Search result served from cache", {
          query: searchQuery.query,
          cacheKey: cacheKey.substring(0, 50),
        });
        return cachedResult;
      }

      this.cacheStats.misses++;

      // Perform search
      const searchResults = await this.performSearch(searchQuery);

      // Cache results
      this.addToCache(cacheKey, searchResults);

      logger.performance("Search completed", startTime, {
        query: searchQuery.query,
        resultsCount: searchResults.data.length,
        totalResults: searchResults.totalResults,
        cacheHitRate: this.getCacheHitRate(),
      });

      return searchResults;
    } catch (error) {
      logger.error("Search failed", {
        error: error.message,
        queryParams,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Perform the actual search operation
   */
  async performSearch(searchQuery) {
    const startTime = Date.now();

    // Get initial product matches
    let products = [];

    if (searchQuery.query) {
      products = await this.productRepository.search(searchQuery.query, {
        category: searchQuery.category,
        brand: searchQuery.brand,
        priceRange: searchQuery.priceRange,
        ratingRange: searchQuery.ratingRange,
        inStock: searchQuery.inStock,
      });
    } else {
      // If no query, get all products and apply filters
      products = Array.from(this.productRepository.products.values());
    }

    // Apply additional filters
    products = products.filter((product) =>
      searchQuery.matchesFilters(product),
    );

    // Calculate relevance scores
    products = products.map((product) => ({
      ...product,
      relevanceScore: this.calculateRelevanceScore(product, searchQuery),
    }));

    // Sort results
    products.sort(this.getSortFunction(searchQuery));

    // Get total count before pagination
    const totalResults = products.length;

    // Apply pagination
    const paginatedProducts = products
      .slice(searchQuery.offset, searchQuery.offset + searchQuery.limit)
      .map((product) => {
        // Check if product has toSearchResult method (Product instance)
        if (typeof product.toSearchResult === "function") {
          return product.toSearchResult(
            searchQuery.query,
            product.relevanceScore,
          );
        }

        // Fallback for plain objects - create search result manually
        return {
          productId: product.productId,
          title: product.title,
          description: product.description,
          price: product.price,
          mrp: product.mrp,
          currency: product.currency || "INR",
          discount: product.mrp
            ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
            : 0,
          rating: product.rating,
          ratingCount: product.ratingCount,
          stock: product.stock,
          stockStatus:
            product.stock === 0
              ? "OUT_OF_STOCK"
              : product.stock <= 10
                ? "LOW_STOCK"
                : "HIGH_STOCK",
          brand: product.brand,
          category: product.category,
          imageUrls: (product.imageUrls || []).slice(0, 3),
          metadata: product.metadata || {},
          relevanceScore: Math.round((product.relevanceScore || 0) * 100) / 100,
          tags: product.tags || [],
        };
      });

    return {
      data: paginatedProducts,
      totalResults,
      query: searchQuery.query,
      filters: {
        category: searchQuery.category,
        brand: searchQuery.brand,
        minPrice: searchQuery.minPrice,
        maxPrice: searchQuery.maxPrice,
        minRating: searchQuery.minRating,
        inStock: searchQuery.inStock,
      },
      pagination: {
        limit: searchQuery.limit,
        offset: searchQuery.offset,
        hasNext: searchQuery.offset + searchQuery.limit < totalResults,
        hasPrevious: searchQuery.offset > 0,
      },
      sortBy: searchQuery.sortBy,
      executionTime: `${Date.now() - startTime}ms`,
    };
  }

  /**
   * Multi-factor relevance scoring algorithm
   */
  calculateRelevanceScore(product, searchQuery) {
    // Base relevance score (0-1)
    let score = 0;

    // 1. Text Relevance Score (40% weight)
    const textScore = this.calculateTextRelevance(product, searchQuery);
    score += textScore * 0.4;

    // 2. Quality Score (25% weight)
    const qualityScore = this.calculateQualityScore(product);
    score += qualityScore * 0.25;

    // 3. Popularity Score (20% weight)
    const popularityScore = this.calculatePopularityScore(product);
    score += popularityScore * 0.2;

    // 4. Business Score (15% weight)
    const businessScore = this.calculateBusinessScore(product);
    score += businessScore * 0.15;

    // Apply boost factors
    score = this.applyBoostFactors(score, product, searchQuery);

    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  }

  /**
   * Calculate text relevance score
   */
  calculateTextRelevance(product, searchQuery) {
    if (!searchQuery.query) return 0.5; // Default relevance for non-text searches

    const queryTerms = searchQuery.getSearchTerms();
    if (queryTerms.length === 0) return 0;

    let totalRelevance = 0;
    const title = product.title.toLowerCase();
    const description = (product.description || "").toLowerCase();
    const searchableText = product.searchableText.toLowerCase();

    for (const term of queryTerms) {
      let termRelevance = 0;

      // Exact match in title (highest weight)
      if (title.includes(term)) {
        if (title === term) {
          termRelevance += 1.0; // Perfect match
        } else if (title.startsWith(term) || title.endsWith(term)) {
          termRelevance += 0.8; // Start/end match
        } else {
          termRelevance += 0.6; // Contains match
        }
      }

      // Match in description
      if (description.includes(term)) {
        termRelevance += 0.4;
      }

      // Match in metadata/searchable text
      if (searchableText.includes(term)) {
        termRelevance += 0.2;
      }

      // Fuzzy matching for misspellings
      const fuzzyScore = this.calculateFuzzyMatch(term, title);
      termRelevance += fuzzyScore * 0.3;

      totalRelevance += Math.min(1, termRelevance);
    }

    return totalRelevance / queryTerms.length;
  }

  /**
   * Calculate product quality score
   */
  calculateQualityScore(product) {
    // Rating component (60% of quality score)
    const ratingScore = (product.rating || 0) / 5.0;

    // Return rate component (40% of quality score)
    const returnRate = product.analytics?.returnRate || 0.1; // Default 10%
    const returnScore = 1 - Math.min(1, returnRate);

    return ratingScore * 0.6 + returnScore * 0.4;
  }

  /**
   * Calculate popularity score
   */
  calculatePopularityScore(product) {
    const analytics = product.analytics || {};

    // Units sold component (70% of popularity)
    const unitsSold = analytics.unitsSold || 0;
    const maxUnitsSold = this.getMaxUnitsSold();
    const salesScore =
      maxUnitsSold > 0
        ? Math.log(unitsSold + 1) / Math.log(maxUnitsSold + 1)
        : 0;

    // Review count component (30% of popularity)
    const reviewCount = product.ratingCount || 0;
    const maxReviews = this.getMaxReviews();
    const reviewScore =
      maxReviews > 0 ? Math.log(reviewCount + 1) / Math.log(maxReviews + 1) : 0;

    return salesScore * 0.7 + reviewScore * 0.3;
  }

  /**
   * Calculate business score (stock, price competitiveness, profit)
   */
  calculateBusinessScore(product) {
    // Stock availability (50% of business score)
    const stockScore =
      product.stock > 0
        ? product.stock > 100
          ? 1.0
          : product.stock > 10
            ? 0.8
            : product.stock > 0
              ? 0.5
              : 0
        : 0;

    // Price competitiveness (30% of business score)
    const discount = product.calculateDiscount();
    const priceScore = Math.min(1, discount / 50); // Max score at 50% discount

    // Profit margin (20% of business score)
    const profitMargin = product.analytics?.profitMargin || 0.2; // Default 20%
    const profitScore = Math.min(1, profitMargin / 0.5); // Max score at 50% margin

    return stockScore * 0.5 + priceScore * 0.3 + profitScore * 0.2;
  }

  /**
   * Apply boost factors for trending, sales, etc.
   */
  applyBoostFactors(baseScore, product, searchQuery) {
    let boostedScore = baseScore;

    // Trending products boost
    if (product.analytics?.isTrending) {
      boostedScore *= 1.1;
    }

    // Flash sale boost
    if (product.analytics?.isOnSale) {
      boostedScore *= 1.15;
    }

    // Low stock urgency boost
    if (product.stock > 0 && product.stock <= 10) {
      boostedScore *= 1.05;
    }

    // High margin business boost
    const profitMargin = product.analytics?.profitMargin || 0;
    if (profitMargin > 0.3) {
      boostedScore *= 1.1;
    }

    // Brand preference boost (for popular brands)
    const popularBrands = [
      "apple",
      "samsung",
      "oneplus",
      "xiaomi",
      "dell",
      "hp",
    ];
    if (popularBrands.includes(product.brand?.toLowerCase())) {
      boostedScore *= 1.05;
    }

    // Price range preference boost (sweet spot for Indian market)
    if (product.price >= 5000 && product.price <= 30000) {
      boostedScore *= 1.1;
    }

    return boostedScore;
  }

  /**
   * Calculate fuzzy matching score for misspellings
   */
  calculateFuzzyMatch(term, text) {
    if (!term || !text) return 0;

    // Simple Levenshtein distance-based scoring
    const distance = this.levenshteinDistance(term, text);
    const maxLength = Math.max(term.length, text.length);

    if (maxLength === 0) return 0;

    const similarity = 1 - distance / maxLength;
    return similarity > 0.7 ? similarity : 0; // Only return score if similarity > 70%
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get sort function based on search query
   */
  getSortFunction(searchQuery) {
    switch (searchQuery.sortBy) {
      case "price_low":
        return (a, b) => a.price - b.price;
      case "price_high":
        return (a, b) => b.price - a.price;
      case "rating":
        return (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount;
      case "popularity":
        return (a, b) =>
          (b.analytics?.unitsSold || 0) - (a.analytics?.unitsSold || 0);
      case "newest":
        return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      case "relevance":
      default:
        return (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0);
    }
  }

  /**
   * Cache management
   */
  generateCacheKey(searchQuery) {
    const queryString = JSON.stringify(searchQuery.toJSON());
    return Buffer.from(queryString).toString("base64");
  }

  getFromCache(key) {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minute TTL
      return cached.data;
    }
    if (cached) {
      this.searchCache.delete(key);
    }
    return null;
  }

  addToCache(key, data) {
    // Implement simple LRU eviction
    if (this.searchCache.size >= this.maxCacheSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
      this.cacheStats.evictions++;
    }

    this.searchCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCacheHitRate() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return total > 0 ? Math.round((this.cacheStats.hits / total) * 100) : 0;
  }

  /**
   * Helper methods for scoring normalization
   */
  getMaxUnitsSold() {
    let max = 0;
    for (const product of this.productRepository.products.values()) {
      const unitsSold = product.analytics?.unitsSold || 0;
      if (unitsSold > max) max = unitsSold;
    }
    return max || 10000; // Default fallback
  }

  getMaxReviews() {
    let max = 0;
    for (const product of this.productRepository.products.values()) {
      if (product.ratingCount > max) max = product.ratingCount;
    }
    return max || 1000; // Default fallback
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(partialQuery, limit = 10) {
    const suggestions = new Map();
    const searchTerms = partialQuery.toLowerCase().split(/\s+/);
    const lastTerm = searchTerms[searchTerms.length - 1];

    // If the last term is too short, don't provide suggestions
    if (lastTerm.length < 2) {
      return [];
    }

    // Get all products from repository
    const products = Array.from(this.productRepository.products.values());

    // Extract suggestions from product titles, brands, and categories
    for (const product of products) {
      const searchableFields = [
        product.title,
        product.brand,
        product.category,
        ...(product.tags || []),
        ...(product.searchableText?.split(" ") || []),
      ];

      for (const field of searchableFields) {
        if (!field) continue;

        const words = field.toLowerCase().split(/\s+/);
        for (const word of words) {
          // Check if word starts with the partial query
          if (word.startsWith(lastTerm) && word.length >= lastTerm.length) {
            const existing = suggestions.get(word);
            suggestions.set(word, (existing || 0) + 1);
          }
        }
      }
    }

    // Convert to array and sort by popularity
    const suggestionArray = Array.from(suggestions.entries())
      .map(([suggestion, count]) => ({ suggestion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((s) => s.suggestion);

    return suggestionArray;
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      cacheStats: this.cacheStats,
      cacheSize: this.searchCache.size,
      cacheHitRate: this.getCacheHitRate(),
    };
  }
}

module.exports = SearchService;
