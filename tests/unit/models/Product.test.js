const Product = require("../../src/models/Product");

describe("Product Model", () => {
  describe("Constructor", () => {
    it("should create a valid product with required fields", () => {
      const productData = {
        title: "iPhone 15",
        price: 75000,
        stock: 100,
      };

      const product = new Product(productData);

      expect(product.title).toBe("iPhone 15");
      expect(product.price).toBe(75000);
      expect(product.stock).toBe(100);
      expect(product.productId).toBeDefined();
      expect(product.isActive).toBe(true);
      expect(product.currency).toBe("INR");
    });

    it("should generate searchable text automatically", () => {
      const productData = {
        title: "Samsung Galaxy S24",
        description: "Latest Samsung phone",
        brand: "Samsung",
        category: "Mobile",
        price: 65000,
        stock: 50,
      };

      const product = new Product(productData);

      expect(product.searchableText).toContain("samsung");
      expect(product.searchableText).toContain("galaxy");
      expect(product.searchableText).toContain("mobile");
    });

    it("should validate required fields", () => {
      expect(() => {
        new Product({ price: 1000, stock: 10 }); // Missing title
      }).toThrow("Product title is required");

      expect(() => {
        new Product({ title: "Test Product", stock: 10 }); // Missing price
      }).toThrow("Product price must be greater than 0");
    });

    it("should validate rating range", () => {
      expect(() => {
        new Product({
          title: "Test Product",
          price: 1000,
          stock: 10,
          rating: 6, // Invalid rating
        });
      }).toThrow("Rating must be between 0 and 5");
    });
  });

  describe("Methods", () => {
    let product;

    beforeEach(() => {
      product = new Product({
        title: "Test Laptop",
        description: "A great laptop for work",
        brand: "Dell",
        category: "Laptops",
        price: 45000,
        mrp: 50000,
        stock: 25,
        rating: 4.2,
        ratingCount: 150,
      });
    });

    it("should calculate discount correctly", () => {
      const discount = product.calculateDiscount();
      expect(discount).toBe(10); // (50000-45000)/50000 * 100
    });

    it("should return correct stock status", () => {
      product.stock = 0;
      expect(product.getStockStatus()).toBe("OUT_OF_STOCK");

      product.stock = 5;
      expect(product.getStockStatus()).toBe("LOW_STOCK");

      product.stock = 30;
      expect(product.getStockStatus()).toBe("MEDIUM_STOCK");

      product.stock = 100;
      expect(product.getStockStatus()).toBe("HIGH_STOCK");
    });

    it("should return correct price range", () => {
      product.price = 500;
      expect(product.getPriceRange()).toBe("0-1000");

      product.price = 3000;
      expect(product.getPriceRange()).toBe("1000-5000");

      product.price = 45000;
      expect(product.getPriceRange()).toBe("25000-50000");

      product.price = 150000;
      expect(product.getPriceRange()).toBe("100000+");
    });

    it("should return correct rating bucket", () => {
      product.rating = 4.8;
      expect(product.getRatingBucket()).toBe("4.5+");

      product.rating = 4.2;
      expect(product.getRatingBucket()).toBe("4.0-4.5");

      product.rating = 3.7;
      expect(product.getRatingBucket()).toBe("3.5-4.0");

      product.rating = 1.5;
      expect(product.getRatingBucket()).toBe("below-2.0");
    });

    it("should update metadata correctly", () => {
      const newMetadata = {
        processor: "Intel i7",
        ram: "16GB",
      };

      product.updateMetadata(newMetadata);

      expect(product.metadata.processor).toBe("Intel i7");
      expect(product.metadata.ram).toBe("16GB");
      expect(product.searchableText).toContain("intel");
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it("should convert to search result format", () => {
      const searchResult = product.toSearchResult("laptop", 0.85);

      expect(searchResult).toHaveProperty("productId", product.productId);
      expect(searchResult).toHaveProperty("title", product.title);
      expect(searchResult).toHaveProperty("discount", 10);
      expect(searchResult).toHaveProperty("stockStatus", "MEDIUM_STOCK");
      expect(searchResult).toHaveProperty("relevanceScore", 0.85);
      expect(searchResult).not.toHaveProperty("analytics"); // Should be filtered out
    });

    it("should serialize to JSON correctly", () => {
      const json = product.toJSON();

      expect(json).toHaveProperty("productId");
      expect(json).toHaveProperty("title", "Test Laptop");
      expect(json).toHaveProperty("createdAt");
      expect(json).toHaveProperty("updatedAt");
    });

    it("should create from JSON correctly", () => {
      const json = product.toJSON();
      const recreatedProduct = Product.fromJSON(json);

      expect(recreatedProduct.title).toBe(product.title);
      expect(recreatedProduct.price).toBe(product.price);
      expect(recreatedProduct.productId).toBe(product.productId);
    });
  });
});
