const ProductRepository = require("../../../src/repositories/ProductRepository");

describe("ProductRepository", () => {
  let repository;

  beforeEach(() => {
    repository = new ProductRepository();
  });

  describe("Basic CRUD Operations", () => {
    const sampleProduct = {
      title: "Test Product",
      description: "A test product",
      brand: "TestBrand",
      category: "TestCategory",
      price: 1000,
      stock: 50,
    };

    it("should add a product successfully", () => {
      const productId = repository.add(sampleProduct);

      expect(productId).toBeDefined();
      expect(repository.findById(productId)).toBeDefined();
      expect(repository.getStats().totalProducts).toBe(1);
    });

    it("should find product by ID", () => {
      const productId = repository.add(sampleProduct);
      const product = repository.findById(productId);

      expect(product).toBeDefined();
      expect(product.title).toBe("Test Product");
      expect(product.productId).toBe(productId);
    });

    it("should update product successfully", () => {
      const productId = repository.add(sampleProduct);
      const updates = { price: 1500, stock: 30 };

      const updated = repository.update(productId, updates);

      expect(updated).toBe(true);
      expect(repository.findById(productId).price).toBe(1500);
      expect(repository.findById(productId).stock).toBe(30);
    });

    it("should delete product successfully", () => {
      const productId = repository.add(sampleProduct);

      expect(repository.delete(productId)).toBe(true);
      expect(repository.findById(productId)).toBeNull();
      expect(repository.getStats().totalProducts).toBe(0);
    });

    it("should return false for non-existent operations", () => {
      expect(repository.findById("non-existent")).toBeNull();
      expect(repository.update("non-existent", {})).toBe(false);
      expect(repository.delete("non-existent")).toBe(false);
    });
  });

  describe("Bulk Operations", () => {
    const products = [
      {
        title: "Product 1",
        price: 1000,
        stock: 10,
        category: "Category1",
        brand: "Brand1",
      },
      {
        title: "Product 2",
        price: 2000,
        stock: 20,
        category: "Category2",
        brand: "Brand2",
      },
      {
        title: "Product 3",
        price: 3000,
        stock: 30,
        category: "Category1",
        brand: "Brand1",
      },
    ];

    it("should add multiple products", () => {
      const productIds = repository.addMany(products);

      expect(productIds).toHaveLength(3);
      expect(repository.getStats().totalProducts).toBe(3);
    });

    it("should find multiple products by IDs", () => {
      const productIds = repository.addMany(products);
      const foundProducts = repository.findMany(productIds);

      expect(foundProducts).toHaveLength(3);
      foundProducts.forEach((product, index) => {
        expect(product.title).toBe(products[index].title);
      });
    });

    it("should update multiple products", () => {
      const productIds = repository.addMany(products);
      const updates = { isActive: false };

      const updated = repository.updateMany(productIds, updates);

      expect(updated).toBe(true);
      productIds.forEach((id) => {
        expect(repository.findById(id).isActive).toBe(false);
      });
    });

    it("should delete multiple products", () => {
      const productIds = repository.addMany(products);

      const deleted = repository.deleteMany(productIds);

      expect(deleted).toBe(true);
      expect(repository.getStats().totalProducts).toBe(0);
    });
  });

  describe("Search and Filtering", () => {
    beforeEach(() => {
      const products = [
        {
          title: "iPhone 15 Pro",
          description: "Latest Apple smartphone",
          brand: "Apple",
          category: "Mobile",
          price: 100000,
          stock: 50,
          rating: 4.5,
        },
        {
          title: "Samsung Galaxy S24",
          description: "Android flagship phone",
          brand: "Samsung",
          category: "Mobile",
          price: 80000,
          stock: 30,
          rating: 4.3,
        },
        {
          title: "MacBook Pro",
          description: "Apple laptop for professionals",
          brand: "Apple",
          category: "Laptops",
          price: 200000,
          stock: 25,
          rating: 4.7,
        },
        {
          title: "Dell XPS 13",
          description: "Compact Windows laptop",
          brand: "Dell",
          category: "Laptops",
          price: 120000,
          stock: 40,
          rating: 4.2,
        },
      ];
      repository.addMany(products);
    });

    it("should find products by category", () => {
      const mobiles = repository.findByCategory("Mobile");
      expect(mobiles).toHaveLength(2);

      const laptops = repository.findByCategory("Laptops");
      expect(laptops).toHaveLength(2);
    });

    it("should find products by brand", () => {
      const appleProducts = repository.findByBrand("Apple");
      expect(appleProducts).toHaveLength(2);

      const samsungProducts = repository.findByBrand("Samsung");
      expect(samsungProducts).toHaveLength(1);
    });

    it("should find products in price range", () => {
      const midRange = repository.findInPriceRange(50000, 150000);
      expect(midRange).toHaveLength(3); // Galaxy S24, iPhone 15 Pro, Dell XPS 13

      const premium = repository.findInPriceRange(150000, 300000);
      expect(premium).toHaveLength(1); // MacBook Pro
    });

    it("should find products by minimum rating", () => {
      const highRated = repository.findByMinRating(4.5);
      expect(highRated).toHaveLength(2); // iPhone 15 Pro (4.5), MacBook Pro (4.7)

      const wellRated = repository.findByMinRating(4.0);
      expect(wellRated).toHaveLength(4); // All products
    });

    it("should search products by text", () => {
      const iphoneSearch = repository.search("iPhone");
      expect(iphoneSearch).toHaveLength(1);
      expect(iphoneSearch[0].title).toContain("iPhone");

      const appleSearch = repository.search("apple");
      expect(appleSearch.length).toBeGreaterThanOrEqual(2); // iPhone and MacBook
    });

    it("should get all products with pagination", () => {
      const page1 = repository.getAll(0, 2);
      expect(page1).toHaveLength(2);

      const page2 = repository.getAll(2, 2);
      expect(page2).toHaveLength(2);

      const allProducts = repository.getAll();
      expect(allProducts).toHaveLength(4);
    });
  });

  describe("Statistics and Analytics", () => {
    beforeEach(() => {
      const products = [
        {
          title: "Product 1",
          price: 1000,
          stock: 10,
          category: "Electronics",
          brand: "Brand1",
          rating: 4.5,
        },
        {
          title: "Product 2",
          price: 2000,
          stock: 0,
          category: "Electronics",
          brand: "Brand2",
          rating: 4.0,
        },
        {
          title: "Product 3",
          price: 3000,
          stock: 30,
          category: "Books",
          brand: "Brand1",
          rating: 3.5,
        },
        {
          title: "Product 4",
          price: 4000,
          stock: 40,
          category: "Books",
          brand: "Brand3",
          rating: 5.0,
          isActive: false,
        },
      ];
      repository.addMany(products);
    });

    it("should return correct statistics", () => {
      const stats = repository.getStats();

      expect(stats.totalProducts).toBe(4);
      expect(stats.activeProducts).toBe(3);
      expect(stats.outOfStockProducts).toBe(1);
      expect(stats.lowStockProducts).toBe(1); // Product 1 with stock 10
      expect(stats.categoryCounts).toEqual({
        Electronics: 2,
        Books: 2,
      });
      expect(stats.brandCounts).toEqual({
        Brand1: 2,
        Brand2: 1,
        Brand3: 1,
      });
      expect(stats.averagePrice).toBe(2500);
      expect(stats.averageRating).toBe(4.25);
    });

    it("should get category distribution", () => {
      const distribution = repository.getCategoryDistribution();

      expect(distribution).toHaveLength(2);
      expect(distribution.find((d) => d.category === "Electronics").count).toBe(
        2,
      );
      expect(distribution.find((d) => d.category === "Books").count).toBe(2);
    });

    it("should get brand distribution", () => {
      const distribution = repository.getBrandDistribution();

      expect(distribution).toHaveLength(3);
      expect(distribution.find((d) => d.brand === "Brand1").count).toBe(2);
    });

    it("should get price distribution", () => {
      const distribution = repository.getPriceDistribution();

      expect(distribution).toBeDefined();
      expect(distribution["0-1000"]).toBe(1);
      expect(distribution["1000-5000"]).toBe(3);
    });
  });

  describe("Index Management", () => {
    it("should rebuild indexes correctly", () => {
      const products = [
        {
          title: "Product 1",
          category: "Cat1",
          brand: "Brand1",
          price: 1000,
          stock: 10,
        },
        {
          title: "Product 2",
          category: "Cat2",
          brand: "Brand2",
          price: 2000,
          stock: 20,
        },
      ];

      repository.addMany(products);
      const statsBefore = repository.getStats();

      repository.rebuildIndexes();
      const statsAfter = repository.getStats();

      expect(statsAfter.totalProducts).toBe(statsBefore.totalProducts);
      expect(repository.findByCategory("Cat1")).toHaveLength(1);
      expect(repository.findByBrand("Brand1")).toHaveLength(1);
    });

    it("should clear all data", () => {
      const products = [
        { title: "Product 1", price: 1000, stock: 10 },
        { title: "Product 2", price: 2000, stock: 20 },
      ];

      repository.addMany(products);
      expect(repository.getStats().totalProducts).toBe(2);

      repository.clear();
      expect(repository.getStats().totalProducts).toBe(0);
      expect(repository.getAll()).toHaveLength(0);
    });
  });
});
