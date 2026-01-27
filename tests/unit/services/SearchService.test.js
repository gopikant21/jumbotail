const SearchService = require("../../../src/services/SearchService");
const ProductRepository = require("../../../src/repositories/ProductRepository");

describe("SearchService", () => {
  let searchService;
  let productRepository;

  beforeEach(() => {
    productRepository = new ProductRepository();
    searchService = new SearchService(productRepository);

    // Add sample products for testing
    const products = [
      {
        title: "iPhone 15 Pro Max",
        description: "Latest Apple smartphone with A17 Pro chip",
        brand: "Apple",
        category: "Mobile",
        price: 135000,
        mrp: 150000,
        stock: 50,
        rating: 4.8,
        ratingCount: 1200,
        metadata: {
          storage: "256GB",
          color: "Natural Titanium",
        },
      },
      {
        title: "Samsung Galaxy S24 Ultra",
        description: "Android flagship with S Pen and 200MP camera",
        brand: "Samsung",
        category: "Mobile",
        price: 125000,
        mrp: 140000,
        stock: 30,
        rating: 4.6,
        ratingCount: 800,
        metadata: {
          storage: "512GB",
          color: "Titanium Black",
        },
      },
      {
        title: "MacBook Pro 14 inch",
        description: "Professional laptop with M3 Pro chip",
        brand: "Apple",
        category: "Laptops",
        price: 200000,
        mrp: 220000,
        stock: 25,
        rating: 4.9,
        ratingCount: 500,
        metadata: {
          processor: "M3 Pro",
          ram: "18GB",
        },
      },
      {
        title: "Dell XPS 13 Plus",
        description: "Ultrabook with Intel 12th Gen processor",
        brand: "Dell",
        category: "Laptops",
        price: 120000,
        mrp: 135000,
        stock: 40,
        rating: 4.3,
        ratingCount: 300,
      },
      {
        title: "Sony WH-1000XM5",
        description: "Noise cancelling wireless headphones",
        brand: "Sony",
        category: "Audio",
        price: 30000,
        mrp: 35000,
        stock: 100,
        rating: 4.7,
        ratingCount: 2000,
      },
    ];

    productRepository.addMany(products);
  });

  describe("Basic Search", () => {
    it("should search for products by title", async () => {
      const results = await searchService.search("iPhone");

      expect(results.products).toHaveLength(1);
      expect(results.products[0].title).toContain("iPhone");
      expect(results.totalCount).toBe(1);
    });

    it("should search for products by brand", async () => {
      const results = await searchService.search("Apple");

      expect(results.products).toHaveLength(2);
      expect(results.products.every((p) => p.brand === "Apple")).toBe(true);
    });

    it("should search for products by category", async () => {
      const results = await searchService.search("Laptops");

      expect(results.products).toHaveLength(2);
      expect(results.products.every((p) => p.category === "Laptops")).toBe(
        true,
      );
    });

    it("should handle case-insensitive search", async () => {
      const results = await searchService.search("samsung");

      expect(results.products).toHaveLength(1);
      expect(results.products[0].brand).toBe("Samsung");
    });

    it("should handle partial matches", async () => {
      const results = await searchService.search("Pro");

      expect(results.products.length).toBeGreaterThanOrEqual(2);
      expect(results.products.some((p) => p.title.includes("Pro"))).toBe(true);
    });
  });

  describe("Search with Filters", () => {
    it("should filter by category", async () => {
      const results = await searchService.search("", {
        filters: { category: "Mobile" },
      });

      expect(results.products).toHaveLength(2);
      expect(results.products.every((p) => p.category === "Mobile")).toBe(true);
    });

    it("should filter by brand", async () => {
      const results = await searchService.search("", {
        filters: { brand: "Apple" },
      });

      expect(results.products).toHaveLength(2);
      expect(results.products.every((p) => p.brand === "Apple")).toBe(true);
    });

    it("should filter by price range", async () => {
      const results = await searchService.search("", {
        filters: {
          priceRange: { min: 100000, max: 200000 },
        },
      });

      expect(
        results.products.every((p) => p.price >= 100000 && p.price <= 200000),
      ).toBe(true);
    });

    it("should filter by minimum rating", async () => {
      const results = await searchService.search("", {
        filters: { minRating: 4.5 },
      });

      expect(results.products.every((p) => p.rating >= 4.5)).toBe(true);
    });

    it("should combine multiple filters", async () => {
      const results = await searchService.search("", {
        filters: {
          category: "Mobile",
          priceRange: { min: 100000, max: 150000 },
          minRating: 4.5,
        },
      });

      expect(
        results.products.every(
          (p) =>
            p.category === "Mobile" &&
            p.price >= 100000 &&
            p.price <= 150000 &&
            p.rating >= 4.5,
        ),
      ).toBe(true);
    });
  });

  describe("Sorting", () => {
    it("should sort by relevance (default)", async () => {
      const results = await searchService.search("Pro");

      expect(results.products).toHaveLength(2);
      // Results should be sorted by relevance score
      for (let i = 1; i < results.products.length; i++) {
        expect(results.products[i].relevanceScore).toBeLessThanOrEqual(
          results.products[i - 1].relevanceScore,
        );
      }
    });

    it("should sort by price ascending", async () => {
      const results = await searchService.search("", {
        sort: "price_asc",
      });

      for (let i = 1; i < results.products.length; i++) {
        expect(results.products[i].price).toBeGreaterThanOrEqual(
          results.products[i - 1].price,
        );
      }
    });

    it("should sort by price descending", async () => {
      const results = await searchService.search("", {
        sort: "price_desc",
      });

      for (let i = 1; i < results.products.length; i++) {
        expect(results.products[i].price).toBeLessThanOrEqual(
          results.products[i - 1].price,
        );
      }
    });

    it("should sort by rating", async () => {
      const results = await searchService.search("", {
        sort: "rating",
      });

      for (let i = 1; i < results.products.length; i++) {
        expect(results.products[i].rating).toBeLessThanOrEqual(
          results.products[i - 1].rating,
        );
      }
    });

    it("should sort by popularity", async () => {
      const results = await searchService.search("", {
        sort: "popularity",
      });

      for (let i = 1; i < results.products.length; i++) {
        expect(results.products[i].ratingCount).toBeLessThanOrEqual(
          results.products[i - 1].ratingCount,
        );
      }
    });
  });

  describe("Pagination", () => {
    it("should paginate results correctly", async () => {
      const page1 = await searchService.search("", {
        page: 1,
        limit: 2,
      });

      expect(page1.products).toHaveLength(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.totalPages).toBe(3); // 5 products / 2 per page = 3 pages

      const page2 = await searchService.search("", {
        page: 2,
        limit: 2,
      });

      expect(page2.products).toHaveLength(2);
      expect(page2.page).toBe(2);
    });

    it("should handle empty results", async () => {
      const results = await searchService.search("nonexistent");

      expect(results.products).toHaveLength(0);
      expect(results.totalCount).toBe(0);
      expect(results.totalPages).toBe(0);
    });
  });

  describe("Ranking Algorithm", () => {
    it("should calculate relevance score correctly", () => {
      const product = {
        title: "iPhone 15 Pro",
        searchableText: "iphone 15 pro apple mobile smartphone",
        rating: 4.5,
        ratingCount: 1000,
        stock: 50,
        price: 100000,
      };

      const score = searchService._calculateRelevanceScore(product, "iPhone");

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("should prioritize exact title matches", () => {
      const product1 = {
        title: "iPhone 15",
        searchableText: "iphone 15 apple mobile",
        rating: 4.0,
        ratingCount: 500,
        stock: 50,
        price: 80000,
      };

      const product2 = {
        title: "Samsung Galaxy with iPhone case",
        searchableText: "samsung galaxy iphone case mobile",
        rating: 4.5,
        ratingCount: 1000,
        stock: 50,
        price: 80000,
      };

      const score1 = searchService._calculateRelevanceScore(product1, "iPhone");
      const score2 = searchService._calculateRelevanceScore(product2, "iPhone");

      expect(score1).toBeGreaterThan(score2);
    });

    it("should handle Hinglish queries", async () => {
      // Add a product with Hinglish-friendly metadata
      productRepository.add({
        title: "Budget Smartphone",
        description: "Accha phone kam price mein",
        brand: "Xiaomi",
        category: "Mobile",
        price: 15000,
        stock: 100,
        rating: 4.0,
      });

      const results = await searchService.search("accha phone");

      expect(results.products.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Search Analytics", () => {
    it("should track search queries", async () => {
      await searchService.search("iPhone");
      await searchService.search("Samsung");
      await searchService.search("iPhone"); // Duplicate

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.totalSearches).toBe(3);
      expect(analytics.uniqueQueries).toBe(2);
      expect(analytics.topQueries).toContainEqual(
        expect.objectContaining({ query: "iphone", count: 2 }),
      );
    });

    it("should track zero-result queries", async () => {
      await searchService.search("nonexistent product");

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.zeroResultQueries).toContainEqual(
        expect.objectContaining({ query: "nonexistent product" }),
      );
    });
  });

  describe("Performance", () => {
    it("should complete search within performance threshold", async () => {
      const startTime = Date.now();

      await searchService.search("iPhone");

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it("should handle concurrent searches", async () => {
      const searches = [
        searchService.search("iPhone"),
        searchService.search("Samsung"),
        searchService.search("Laptop"),
        searchService.search("Audio"),
      ];

      const results = await Promise.all(searches);

      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(result).toHaveProperty("products");
        expect(result).toHaveProperty("totalCount");
      });
    });
  });

  describe("Cache Functionality", () => {
    it("should cache search results", async () => {
      // First search - cache miss
      const result1 = await searchService.search("iPhone");

      // Second search - cache hit
      const result2 = await searchService.search("iPhone");

      expect(result1).toEqual(result2);
    });

    it("should invalidate cache when products change", async () => {
      await searchService.search("iPhone");

      // Add a new iPhone product
      productRepository.add({
        title: "iPhone 14",
        brand: "Apple",
        category: "Mobile",
        price: 70000,
        stock: 25,
      });

      const results = await searchService.search("iPhone");
      expect(results.products).toHaveLength(2); // Should include the new product
    });
  });
});
