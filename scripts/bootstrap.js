require("dotenv").config();
const ProductScraper = require("./scraper");
const {
  initializeStore,
  getDataService,
} = require("../src/services/dataService");
const logger = require("../src/utils/logger");

/**
 * Bootstrap script to initialize the e-commerce search engine with data
 */
class BootstrapService {
  constructor() {
    this.scraper = new ProductScraper();
  }

  /**
   * Main bootstrap process
   */
  async bootstrap() {
    const startTime = Date.now();

    try {
      logger.info("🚀 Starting e-commerce search engine bootstrap...");

      // Step 1: Initialize the in-memory data store
      logger.info("📦 Initializing data store...");
      await initializeStore();
      logger.info("✅ Data store initialized");

      // Step 2: Check if we need to scrape new data
      const dataService = getDataService();
      const currentStats = dataService.getStats();

      if (currentStats.repository.totalProducts < 100) {
        logger.info("📊 Insufficient data, starting scraping process...");

        // Step 3: Scrape fresh product data
        const scrapedProducts = await this.scraper.scrapeProducts(1000);
        logger.info(`🔍 Scraped ${scrapedProducts.length} products`);

        // Step 4: Load scraped data into store
        const repository = dataService.getProductRepository();
        const loadResult = await repository.bulkLoad(scrapedProducts);

        logger.info("📥 Bulk load completed", {
          successful: loadResult.successCount,
          failed: loadResult.errorCount,
        });
      } else {
        logger.info(
          `✅ Sufficient data available (${currentStats.repository.totalProducts} products)`,
        );
      }

      // Step 5: Display final statistics
      const finalStats = dataService.getStats();
      this.displayBootstrapSummary(finalStats, Date.now() - startTime);

      logger.info("🎉 Bootstrap completed successfully!");
      return true;
    } catch (error) {
      logger.error("❌ Bootstrap failed", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Display bootstrap summary
   */
  displayBootstrapSummary(stats, duration) {
    const summary = `
╔══════════════════════════════════════════════════════════════╗
║                    🛒 E-COMMERCE SEARCH ENGINE               ║
║                      Bootstrap Summary                       ║
╠══════════════════════════════════════════════════════════════╣
║ Total Products: ${stats.repository.totalProducts.toString().padEnd(43)} ║
║ Search Index Entries: ${stats.repository.totalIndexEntries.toString().padEnd(37)} ║
║ Memory Usage: ${stats.repository.memoryUsage.heapUsed}MB / ${stats.repository.memoryUsage.heapTotal}MB${" ".repeat(20)} ║
║ Cache Hit Rate: ${stats.search.cacheHitRate}%${" ".repeat(40)} ║
║ Bootstrap Time: ${Math.round(duration / 1000)}s${" ".repeat(40)} ║
╠══════════════════════════════════════════════════════════════╣
║ 🔍 Search API: http://localhost:3000/api/v1/search/product   ║
║ 📦 Product API: http://localhost:3000/api/v1/product        ║
║ 🩺 Health Check: http://localhost:3000/health              ║
║ 📚 API Docs: http://localhost:3000/api/v1                  ║
╚══════════════════════════════════════════════════════════════╝
    `;

    console.log(summary);

    // Log individual category statistics
    const repository = getDataService().getProductRepository();
    const categories = repository.getCategories();

    logger.info("📊 Category breakdown:");
    for (const category of categories) {
      const categoryProducts = repository.getByCategory(category, 1000);
      logger.info(`  • ${category}: ${categoryProducts.length} products`);
    }

    // Log brand statistics
    const brands = repository.getBrands();
    logger.info("🏷️ Brand breakdown:");
    for (const brand of brands.slice(0, 10)) {
      // Top 10 brands
      const brandProducts = repository.getByBrand(brand, 1000);
      logger.info(`  • ${brand}: ${brandProducts.length} products`);
    }
  }

  /**
   * Verify bootstrap integrity
   */
  async verifyBootstrap() {
    try {
      logger.info("🔍 Verifying bootstrap integrity...");

      const dataService = getDataService();
      const searchService = dataService.getSearchService();

      // Test basic search functionality
      const testQueries = [
        "iPhone",
        "Samsung",
        "laptop",
        "headphones",
        "charger",
      ];

      for (const query of testQueries) {
        const results = await searchService.search({ query, limit: 5 });
        logger.info(
          `✅ Search test "${query}": ${results.data.length} results`,
        );
      }

      // Test category filtering
      const repository = dataService.getProductRepository();
      const categories = repository.getCategories();

      for (const category of categories.slice(0, 3)) {
        const categoryResults = await repository.getByCategory(category, 10);
        logger.info(
          `✅ Category test "${category}": ${categoryResults.length} results`,
        );
      }

      logger.info("✅ Bootstrap verification completed successfully");
      return true;
    } catch (error) {
      logger.error("❌ Bootstrap verification failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate sample search queries for testing
   */
  generateSampleQueries() {
    return [
      // Basic product searches
      "iPhone 15",
      "Samsung Galaxy S24",
      "OnePlus 12",
      "MacBook Pro",
      "Dell laptop",
      "wireless earbuds",
      "bluetooth headphones",
      "phone charger",
      "laptop bag",
      "power bank",

      // Price-based searches (Indian context)
      "phone under 20000",
      "laptop under 50000",
      "earbuds under 5000",

      // Hinglish searches
      "sasta iPhone",
      "accha laptop",
      "best phone",

      // Misspelled searches
      "Ifone 15",
      "Samsang phone",
      "hedphones",

      // Attribute-based searches
      "iPhone 15 blue",
      "laptop 16GB RAM",
      "phone 128GB storage",
      "gaming headphones",
      "wireless mouse",

      // Category searches
      "mobile phones",
      "laptops",
      "accessories",
      "audio devices",
    ];
  }
}

// Export for use in other scripts
module.exports = BootstrapService;

// Run bootstrap if this file is executed directly
if (require.main === module) {
  const bootstrap = new BootstrapService();

  bootstrap
    .bootstrap()
    .then(() => bootstrap.verifyBootstrap())
    .then(() => {
      console.log("\n🎉 Bootstrap completed successfully!");
      console.log("🚀 You can now start the server with: npm start");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Bootstrap failed:", error.message);
      process.exit(1);
    });
}
