const Joi = require("joi");
const { getDataService } = require("../services/dataService");
const { ValidationError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Search Controller - Handles search-related API endpoints
 */
class SearchController {
  constructor() {
    // Validation schema for search query
    this.searchSchema = Joi.object({
      query: Joi.string().max(200).allow(""),
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0),
      sortBy: Joi.string()
        .valid(
          "relevance",
          "price_low",
          "price_high",
          "rating",
          "popularity",
          "newest",
        )
        .default("relevance"),
      category: Joi.string().max(100),
      brand: Joi.string().max(100),
      minPrice: Joi.number().positive(),
      maxPrice: Joi.number().positive(),
      minRating: Joi.number().min(0).max(5),
      inStock: Joi.boolean(),
      priceRange: Joi.string(),
      ratingRange: Joi.string(),
    });

    this.suggestionsSchema = Joi.object({
      query: Joi.string().min(1).max(50).required(),
      limit: Joi.number().integer().min(1).max(20).default(10),
    });
  }

  /**
   * Search products with advanced ranking
   * GET /api/v1/search/product
   */
  async searchProducts(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate query parameters
      const { error, value } = this.searchSchema.validate(req.query);
      if (error) {
        throw new ValidationError("Invalid search parameters", error.details);
      }

      // Log search query for analytics
      logger.info("Search query received", {
        query: value.query,
        filters: {
          category: value.category,
          brand: value.brand,
          priceRange: `${value.minPrice || 0}-${value.maxPrice || "max"}`,
          minRating: value.minRating,
        },
        pagination: {
          limit: value.limit,
          offset: value.offset,
        },
        sortBy: value.sortBy,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      });

      // Perform search
      const dataService = getDataService();
      const searchService = dataService.getSearchService();
      const results = await searchService.search(value);

      // Log search performance
      logger.performance("Search completed", startTime, {
        query: value.query,
        resultsCount: results.data.length,
        totalResults: results.totalResults,
        executionTime: results.executionTime,
      });

      res.json({
        ...results,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   * GET /api/v1/search/suggestions
   */
  async getSearchSuggestions(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate query parameters
      const { error, value } = this.suggestionsSchema.validate(req.query);
      if (error) {
        throw new ValidationError(
          "Invalid suggestion parameters",
          error.details,
        );
      }

      const dataService = getDataService();
      const searchService = dataService.getSearchService();
      const suggestions = await searchService.getSuggestions(
        value.query,
        value.limit,
      );

      logger.performance("Search suggestions generated", startTime, {
        query: value.query,
        suggestionsCount: suggestions.length,
      });

      res.json({
        data: suggestions,
        query: value.query,
        count: suggestions.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trending/popular searches
   * GET /api/v1/search/trending
   */
  async getTrendingSearches(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 20);

      // This would typically come from analytics data
      // For now, return some hardcoded popular searches
      const trendingSearches = [
        { query: "iPhone", count: 1245, trend: "up" },
        { query: "Samsung Galaxy", count: 987, trend: "up" },
        { query: "Laptop", count: 756, trend: "stable" },
        { query: "Wireless earbuds", count: 634, trend: "up" },
        { query: "Phone cover", count: 523, trend: "down" },
        { query: "Charger", count: 445, trend: "stable" },
        { query: "Headphones", count: 387, trend: "up" },
        { query: "Power bank", count: 298, trend: "stable" },
        { query: "Bluetooth speaker", count: 234, trend: "up" },
        { query: "Screen guard", count: 187, trend: "stable" },
      ].slice(0, limit);

      res.json({
        data: trendingSearches,
        count: trendingSearches.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search filters for faceted search
   * GET /api/v1/search/filters
   */
  async getSearchFilters(req, res, next) {
    try {
      const query = req.query.query || "";

      const dataService = getDataService();
      const repository = dataService.getProductRepository();

      // Get available filters
      const categories = repository.getCategories();
      const brands = repository.getBrands();

      // Price ranges
      const priceRanges = [
        { label: "Under ₹1,000", value: "0-1000", min: 0, max: 1000 },
        { label: "₹1,000 - ₹5,000", value: "1000-5000", min: 1000, max: 5000 },
        {
          label: "₹5,000 - ₹10,000",
          value: "5000-10000",
          min: 5000,
          max: 10000,
        },
        {
          label: "₹10,000 - ₹25,000",
          value: "10000-25000",
          min: 10000,
          max: 25000,
        },
        {
          label: "₹25,000 - ₹50,000",
          value: "25000-50000",
          min: 25000,
          max: 50000,
        },
        { label: "₹50,000+", value: "50000+", min: 50000, max: null },
      ];

      // Rating ranges
      const ratingRanges = [
        { label: "4.5+ Stars", value: "4.5+", min: 4.5, max: 5 },
        { label: "4.0+ Stars", value: "4.0+", min: 4.0, max: 5 },
        { label: "3.5+ Stars", value: "3.5+", min: 3.5, max: 5 },
        { label: "3.0+ Stars", value: "3.0+", min: 3.0, max: 5 },
      ];

      res.json({
        data: {
          categories: categories.map((cat) => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            value: cat,
          })),
          brands: brands.map((brand) => ({
            label: brand.charAt(0).toUpperCase() + brand.slice(1),
            value: brand,
          })),
          priceRanges,
          ratingRanges,
        },
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Advanced search with multiple filters
   * POST /api/v1/search/advanced
   */
  async advancedSearch(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate request body
      const searchParams = {
        ...req.query,
        ...req.body,
      };

      const { error, value } = this.searchSchema.validate(searchParams);
      if (error) {
        throw new ValidationError(
          "Invalid advanced search parameters",
          error.details,
        );
      }

      // Perform advanced search
      const dataService = getDataService();
      const searchService = dataService.getSearchService();
      const results = await searchService.search(value);

      // Add search analytics
      results.analytics = {
        searchType: "advanced",
        filterCount: Object.values(value).filter(
          (v) => v !== undefined && v !== null && v !== "",
        ).length,
        executionTime: results.executionTime,
      };

      logger.performance("Advanced search completed", startTime, {
        query: value.query,
        filtersApplied: results.analytics.filterCount,
        resultsCount: results.data.length,
        totalResults: results.totalResults,
      });

      res.json({
        ...results,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get similar products (based on current product)
   * GET /api/v1/search/similar/:productId
   */
  async getSimilarProducts(req, res, next) {
    try {
      const productId = parseInt(req.params.productId);
      const limit = Math.min(parseInt(req.query.limit) || 10, 20);

      if (isNaN(productId)) {
        throw new ValidationError("Invalid product ID");
      }

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const product = await repository.getById(productId);

      if (!product) {
        throw new NotFoundError("Product");
      }

      // Find similar products based on category, brand, price range
      const searchParams = {
        query: `${product.brand} ${product.category}`,
        category: product.category,
        minPrice: product.price * 0.7,
        maxPrice: product.price * 1.3,
        limit: limit + 1, // +1 to exclude current product
        sortBy: "relevance",
      };

      const searchService = dataService.getSearchService();
      const results = await searchService.search(searchParams);

      // Remove current product from results
      const similarProducts = results.data.filter(
        (p) => p.productId !== productId,
      );

      res.json({
        data: similarProducts.slice(0, limit),
        baseProduct: {
          productId: product.productId,
          title: product.title,
          category: product.category,
          brand: product.brand,
          price: product.price,
        },
        count: similarProducts.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search analytics and statistics
   * GET /api/v1/search/analytics
   */
  async getSearchAnalytics(req, res, next) {
    try {
      const dataService = getDataService();
      const searchService = dataService.getSearchService();
      const repository = dataService.getProductRepository();

      const analytics = {
        search: searchService.getStats(),
        repository: repository.getStats(),
        system: {
          uptime: Math.floor(process.uptime()),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
        },
      };

      res.json({
        data: analytics,
        timestamp: new Date().toISOString(),
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
