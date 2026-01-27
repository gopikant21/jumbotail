const express = require("express");
const SearchController = require("../controllers/SearchController");

const router = express.Router();

// Main search endpoint
router.get("/product", SearchController.searchProducts.bind(SearchController));

// Advanced search
router.post(
  "/advanced",
  SearchController.advancedSearch.bind(SearchController),
);

// Search suggestions and autocomplete
router.get(
  "/suggestions",
  SearchController.getSearchSuggestions.bind(SearchController),
);

// Trending searches
router.get(
  "/trending",
  SearchController.getTrendingSearches.bind(SearchController),
);

// Search filters for faceted search
router.get(
  "/filters",
  SearchController.getSearchFilters.bind(SearchController),
);

// Similar products
router.get(
  "/similar/:productId",
  SearchController.getSimilarProducts.bind(SearchController),
);

// Search analytics
router.get(
  "/analytics",
  SearchController.getSearchAnalytics.bind(SearchController),
);

module.exports = router;
