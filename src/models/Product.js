const { v4: uuidv4 } = require("uuid");

class Product {
  constructor(data) {
    this.productId = data.productId || this.generateId();
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.subcategory = data.subcategory;
    this.brand = data.brand;
    this.model = data.model;
    this.price = data.price;
    this.mrp = data.mrp;
    this.currency = data.currency || "INR";
    this.rating = data.rating || 0;
    this.ratingCount = data.ratingCount || 0;
    this.stock = data.stock || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.imageUrls = data.imageUrls || [];
    this.metadata = data.metadata || {};
    this.analytics = data.analytics || {};
    this.searchableText = data.searchableText || this.generateSearchableText();
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    this.validate();
  }

  generateId() {
    return parseInt(
      Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
    );
  }

  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error("Product title is required");
    }
    if (!this.price || this.price <= 0) {
      throw new Error("Product price must be greater than 0");
    }
    if (this.rating < 0 || this.rating > 5) {
      throw new Error("Rating must be between 0 and 5");
    }
    if (this.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
  }

  generateSearchableText() {
    const searchFields = [
      this.title,
      this.description,
      this.brand,
      this.model,
      this.category,
      this.subcategory,
      ...(this.tags || []),
      ...Object.values(this.metadata || {}),
    ].filter(Boolean);

    return searchFields.join(" ").toLowerCase();
  }

  updateMetadata(newMetadata) {
    this.metadata = { ...this.metadata, ...newMetadata };
    this.searchableText = this.generateSearchableText();
    this.updatedAt = new Date();
  }

  updateAnalytics(analyticsData) {
    this.analytics = { ...this.analytics, ...analyticsData };
    this.updatedAt = new Date();
  }

  updateStock(quantity) {
    this.stock = Math.max(0, quantity);
    this.updatedAt = new Date();
  }

  calculateDiscount() {
    if (!this.mrp || this.mrp <= this.price) return 0;
    return Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }

  getStockStatus() {
    if (this.stock === 0) return "OUT_OF_STOCK";
    if (this.stock <= 10) return "LOW_STOCK";
    if (this.stock <= 50) return "MEDIUM_STOCK";
    return "HIGH_STOCK";
  }

  getPriceRange() {
    if (this.price < 1000) return "0-1000";
    if (this.price < 5000) return "1000-5000";
    if (this.price < 10000) return "5000-10000";
    if (this.price < 25000) return "10000-25000";
    if (this.price < 50000) return "25000-50000";
    if (this.price < 100000) return "50000-100000";
    return "100000+";
  }

  getRatingBucket() {
    if (this.rating >= 4.5) return "4.5+";
    if (this.rating >= 4.0) return "4.0-4.5";
    if (this.rating >= 3.5) return "3.5-4.0";
    if (this.rating >= 3.0) return "3.0-3.5";
    if (this.rating >= 2.0) return "2.0-3.0";
    return "below-2.0";
  }

  toSearchResult(query = "", relevanceScore = 0) {
    return {
      productId: this.productId,
      title: this.title,
      description: this.description,
      price: this.price,
      mrp: this.mrp,
      currency: this.currency,
      discount: this.calculateDiscount(),
      rating: this.rating,
      ratingCount: this.ratingCount,
      stock: this.stock,
      stockStatus: this.getStockStatus(),
      brand: this.brand,
      category: this.category,
      imageUrls: this.imageUrls.slice(0, 3), // Limit to 3 images
      metadata: this.metadata,
      relevanceScore: Math.round(relevanceScore * 100) / 100,
      tags: this.tags,
    };
  }

  toJSON() {
    return {
      productId: this.productId,
      title: this.title,
      description: this.description,
      category: this.category,
      subcategory: this.subcategory,
      brand: this.brand,
      model: this.model,
      price: this.price,
      mrp: this.mrp,
      currency: this.currency,
      rating: this.rating,
      ratingCount: this.ratingCount,
      stock: this.stock,
      isActive: this.isActive,
      imageUrls: this.imageUrls,
      metadata: this.metadata,
      analytics: this.analytics,
      searchableText: this.searchableText,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new Product(json);
  }
}

module.exports = Product;
