const Product = require("../models/Product");
const logger = require("../utils/logger");

/**
 * In-Memory Product Repository
 * Provides high-performance storage and retrieval of products using native JavaScript data structures
 */
class InMemoryProductRepository {
  constructor() {
    // Core storage
    this.products = new Map(); // productId -> Product
    this.nextId = 1;

    // Search indexes for O(1) and O(log n) lookups
    this.searchIndex = new Map(); // searchTerm -> Set<productId>
    this.categoryIndex = new Map(); // category -> Set<productId>
    this.brandIndex = new Map(); // brand -> Set<productId>
    this.priceRangeIndex = new Map(); // priceRange -> Set<productId>
    this.ratingBucketIndex = new Map(); // ratingBucket -> Set<productId>
    this.stockStatusIndex = new Map(); // stockStatus -> Set<productId>

    // Performance tracking
    this.stats = {
      totalProducts: 0,
      totalIndexEntries: 0,
      lastUpdated: new Date(),
      memoryUsage: 0,
    };
  }

  /**
   * Add a new product to the repository
   */
  async add(productData) {
    try {
      // Create product instance
      const product = new Product({
        ...productData,
        productId: productData.productId || this.nextId++,
      });

      // Store product
      this.products.set(product.productId, product);

      // Update all indexes
      this.updateIndexes(product);

      // Update stats
      this.updateStats();

      logger.info("Product added to repository", {
        productId: product.productId,
        title: product.title,
        totalProducts: this.stats.totalProducts,
      });

      return product.productId;
    } catch (error) {
      logger.error("Failed to add product to repository", {
        error: error.message,
        productData,
      });
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async update(productId, updateData) {
    try {
      const existingProduct = this.products.get(productId);
      if (!existingProduct) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Remove old indexes
      this.removeFromIndexes(existingProduct);

      // Update product data
      const updatedProduct = new Product({
        ...existingProduct.toJSON(),
        ...updateData,
        productId,
        updatedAt: new Date(),
      });

      // Store updated product
      this.products.set(productId, updatedProduct);

      // Update indexes with new data
      this.updateIndexes(updatedProduct);

      this.updateStats();

      logger.info("Product updated in repository", {
        productId,
        changes: Object.keys(updateData),
      });

      return updatedProduct;
    } catch (error) {
      logger.error("Failed to update product in repository", {
        error: error.message,
        productId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Update product metadata
   */
  async updateMetadata(productId, metadata) {
    try {
      const product = this.products.get(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Remove old search indexes
      this.removeFromSearchIndex(product);

      // Update metadata
      product.updateMetadata(metadata);

      // Rebuild search indexes
      this.addToSearchIndex(product);

      this.updateStats();

      logger.info("Product metadata updated", {
        productId,
        metadataKeys: Object.keys(metadata),
      });

      return product;
    } catch (error) {
      logger.error("Failed to update product metadata", {
        error: error.message,
        productId,
        metadata,
      });
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getById(productId) {
    const product = this.products.get(productId);
    if (!product) {
      return null;
    }
    return product;
  }

  /**
   * Get multiple products by IDs
   */
  async getByIds(productIds) {
    const products = [];
    for (const id of productIds) {
      const product = this.products.get(id);
      if (product) {
        products.push(product);
      }
    }
    return products;
  }

  /**
   * Search products by text query
   */
  async search(query, options = {}) {
    const startTime = Date.now();
    const searchTerms = this.extractSearchTerms(query);
    const matchingProductIds = new Set();

    // Find products matching search terms
    for (const term of searchTerms) {
      const productIds = this.searchIndex.get(term);
      if (productIds) {
        for (const id of productIds) {
          matchingProductIds.add(id);
        }
      }
    }

    // Convert to products
    let products = Array.from(matchingProductIds)
      .map((id) => this.products.get(id))
      .filter(Boolean);

    // Apply filters
    if (options.category) {
      const categoryIds =
        this.categoryIndex.get(options.category.toLowerCase()) || new Set();
      products = products.filter((p) => categoryIds.has(p.productId));
    }

    if (options.brand) {
      const brandIds =
        this.brandIndex.get(options.brand.toLowerCase()) || new Set();
      products = products.filter((p) => brandIds.has(p.productId));
    }

    if (options.priceRange) {
      const priceIds =
        this.priceRangeIndex.get(options.priceRange) || new Set();
      products = products.filter((p) => priceIds.has(p.productId));
    }

    if (options.ratingRange) {
      const ratingIds =
        this.ratingBucketIndex.get(options.ratingRange) || new Set();
      products = products.filter((p) => ratingIds.has(p.productId));
    }

    if (options.inStock) {
      const stockIds = this.stockStatusIndex.get("HIGH_STOCK") || new Set();
      const mediumStockIds =
        this.stockStatusIndex.get("MEDIUM_STOCK") || new Set();
      const lowStockIds = this.stockStatusIndex.get("LOW_STOCK") || new Set();

      products = products.filter(
        (p) =>
          stockIds.has(p.productId) ||
          mediumStockIds.has(p.productId) ||
          lowStockIds.has(p.productId),
      );
    }

    const duration = Date.now() - startTime;
    logger.performance("Product search completed", startTime, {
      query,
      resultsCount: products.length,
      searchTerms: searchTerms.length,
    });

    return products;
  }

  /**
   * Get products by category
   */
  async getByCategory(category, limit = 100) {
    const productIds =
      this.categoryIndex.get(category.toLowerCase()) || new Set();
    const products = Array.from(productIds)
      .slice(0, limit)
      .map((id) => this.products.get(id))
      .filter(Boolean);

    return products;
  }

  /**
   * Get products by brand
   */
  async getByBrand(brand, limit = 100) {
    const productIds = this.brandIndex.get(brand.toLowerCase()) || new Set();
    const products = Array.from(productIds)
      .slice(0, limit)
      .map((id) => this.products.get(id))
      .filter(Boolean);

    return products;
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.categoryIndex.keys()).sort();
  }

  /**
   * Get all brands
   */
  getBrands() {
    return Array.from(this.brandIndex.keys()).sort();
  }

  /**
   * Get repository statistics
   */
  getStats() {
    return {
      ...this.stats,
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  /**
   * Clear all data (for testing or reset)
   */
  clear() {
    this.products.clear();
    this.searchIndex.clear();
    this.categoryIndex.clear();
    this.brandIndex.clear();
    this.priceRangeIndex.clear();
    this.ratingBucketIndex.clear();
    this.stockStatusIndex.clear();
    this.nextId = 1;
    this.updateStats();

    logger.info("Repository cleared");
  }

  /**
   * Update all indexes for a product
   */
  updateIndexes(product) {
    this.addToSearchIndex(product);
    this.addToCategoryIndex(product);
    this.addToBrandIndex(product);
    this.addToPriceRangeIndex(product);
    this.addToRatingBucketIndex(product);
    this.addToStockStatusIndex(product);
  }

  /**
   * Remove product from all indexes
   */
  removeFromIndexes(product) {
    this.removeFromSearchIndex(product);
    this.removeFromCategoryIndex(product);
    this.removeFromBrandIndex(product);
    this.removeFromPriceRangeIndex(product);
    this.removeFromRatingBucketIndex(product);
    this.removeFromStockStatusIndex(product);
  }

  /**
   * Add product to search index
   */
  addToSearchIndex(product) {
    const terms = this.extractSearchTerms(product.searchableText);
    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term).add(product.productId);
    }
  }

  /**
   * Remove product from search index
   */
  removeFromSearchIndex(product) {
    const terms = this.extractSearchTerms(product.searchableText);
    for (const term of terms) {
      const productIds = this.searchIndex.get(term);
      if (productIds) {
        productIds.delete(product.productId);
        if (productIds.size === 0) {
          this.searchIndex.delete(term);
        }
      }
    }
  }

  /**
   * Add to category index
   */
  addToCategoryIndex(product) {
    if (product.category) {
      const category = product.category.toLowerCase();
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category).add(product.productId);
    }
  }

  removeFromCategoryIndex(product) {
    if (product.category) {
      const category = product.category.toLowerCase();
      const productIds = this.categoryIndex.get(category);
      if (productIds) {
        productIds.delete(product.productId);
        if (productIds.size === 0) {
          this.categoryIndex.delete(category);
        }
      }
    }
  }

  addToBrandIndex(product) {
    if (product.brand) {
      const brand = product.brand.toLowerCase();
      if (!this.brandIndex.has(brand)) {
        this.brandIndex.set(brand, new Set());
      }
      this.brandIndex.get(brand).add(product.productId);
    }
  }

  removeFromBrandIndex(product) {
    if (product.brand) {
      const brand = product.brand.toLowerCase();
      const productIds = this.brandIndex.get(brand);
      if (productIds) {
        productIds.delete(product.productId);
        if (productIds.size === 0) {
          this.brandIndex.delete(brand);
        }
      }
    }
  }

  addToPriceRangeIndex(product) {
    const priceRange = product.getPriceRange();
    if (!this.priceRangeIndex.has(priceRange)) {
      this.priceRangeIndex.set(priceRange, new Set());
    }
    this.priceRangeIndex.get(priceRange).add(product.productId);
  }

  removeFromPriceRangeIndex(product) {
    const priceRange = product.getPriceRange();
    const productIds = this.priceRangeIndex.get(priceRange);
    if (productIds) {
      productIds.delete(product.productId);
      if (productIds.size === 0) {
        this.priceRangeIndex.delete(priceRange);
      }
    }
  }

  addToRatingBucketIndex(product) {
    const ratingBucket = product.getRatingBucket();
    if (!this.ratingBucketIndex.has(ratingBucket)) {
      this.ratingBucketIndex.set(ratingBucket, new Set());
    }
    this.ratingBucketIndex.get(ratingBucket).add(product.productId);
  }

  removeFromRatingBucketIndex(product) {
    const ratingBucket = product.getRatingBucket();
    const productIds = this.ratingBucketIndex.get(ratingBucket);
    if (productIds) {
      productIds.delete(product.productId);
      if (productIds.size === 0) {
        this.ratingBucketIndex.delete(ratingBucket);
      }
    }
  }

  addToStockStatusIndex(product) {
    const stockStatus = product.getStockStatus();
    if (!this.stockStatusIndex.has(stockStatus)) {
      this.stockStatusIndex.set(stockStatus, new Set());
    }
    this.stockStatusIndex.get(stockStatus).add(product.productId);
  }

  removeFromStockStatusIndex(product) {
    const stockStatus = product.getStockStatus();
    const productIds = this.stockStatusIndex.get(stockStatus);
    if (productIds) {
      productIds.delete(product.productId);
      if (productIds.size === 0) {
        this.stockStatusIndex.delete(stockStatus);
      }
    }
  }

  /**
   * Extract search terms from text
   */
  extractSearchTerms(text) {
    if (!text) return [];

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 1)
      .map((term) => term.replace(/[^a-z0-9]/g, ""))
      .filter((term) => term.length > 1);
  }

  /**
   * Update repository statistics
   */
  updateStats() {
    this.stats.totalProducts = this.products.size;
    this.stats.totalIndexEntries =
      this.searchIndex.size +
      this.categoryIndex.size +
      this.brandIndex.size +
      this.priceRangeIndex.size +
      this.ratingBucketIndex.size +
      this.stockStatusIndex.size;
    this.stats.lastUpdated = new Date();
  }

  /**
   * Calculate approximate memory usage
   */
  calculateMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };
  }

  /**
   * Bulk load products (for initial setup)
   */
  async bulkLoad(products) {
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    for (const productData of products) {
      try {
        await this.add(productData);
        successCount++;
      } catch (error) {
        errorCount++;
        logger.warn("Failed to load product during bulk load", {
          error: error.message,
          productData: productData.title || "Unknown product",
        });
      }
    }

    logger.performance("Bulk load completed", startTime, {
      totalProducts: products.length,
      successCount,
      errorCount,
      finalCount: this.stats.totalProducts,
    });

    return { successCount, errorCount };
  }
}

module.exports = InMemoryProductRepository;
