class SearchQuery {
  constructor(params) {
    this.query = params.query || "";
    this.limit = Math.min(parseInt(params.limit) || 20, 100); // Max 100 results
    this.offset = Math.max(parseInt(params.offset) || 0, 0);
    this.sortBy = params.sortBy || "relevance";
    this.category = params.category;
    this.brand = params.brand;
    this.minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
    this.maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
    this.minRating = params.minRating ? parseFloat(params.minRating) : null;
    this.inStock = params.inStock === "true";
    this.priceRange = params.priceRange;
    this.ratingRange = params.ratingRange;

    this.validate();
    this.normalize();
  }

  validate() {
    if (this.minPrice && this.maxPrice && this.minPrice > this.maxPrice) {
      throw new Error("Minimum price cannot be greater than maximum price");
    }
    if (this.minRating && (this.minRating < 0 || this.minRating > 5)) {
      throw new Error("Rating must be between 0 and 5");
    }
    if (!this.isValidSortBy()) {
      throw new Error(
        "Invalid sortBy value. Allowed values: relevance, price_low, price_high, rating, popularity, newest",
      );
    }
  }

  normalize() {
    // Clean and normalize search query
    this.query = this.query.trim().toLowerCase();

    // Handle Hinglish and common misspellings
    this.query = this.normalizeHinglishQuery(this.query);
    this.query = this.correctCommonMisspellings(this.query);
  }

  normalizeHinglishQuery(query) {
    const hinglishMap = {
      sasta: "cheap",
      sastey: "cheap",
      saste: "cheap",
      accha: "good",
      achha: "good",
      acche: "good",
      best: "best",
      latest: "latest",
      new: "new",
      purana: "old",
      phone: "phone",
      mobile: "mobile",
      laptop: "laptop",
      headphone: "headphone",
      earphone: "earphone",
      cover: "cover",
      case: "case",
      charger: "charger",
      paisa: "rupees",
      rupees: "rupees",
      rs: "rupees",
      price: "price",
    };

    let normalizedQuery = query;
    for (const [hinglish, english] of Object.entries(hinglishMap)) {
      const regex = new RegExp(`\\b${hinglish}\\b`, "gi");
      normalizedQuery = normalizedQuery.replace(regex, english);
    }

    return normalizedQuery;
  }

  correctCommonMisspellings(query) {
    const misspellingMap = {
      ifone: "iphone",
      iphone: "iphone",
      samsang: "samsung",
      samsoong: "samsung",
      laptop: "laptop",
      leptop: "laptop",
      hedphone: "headphone",
      hedphones: "headphones",
      moblile: "mobile",
      mobil: "mobile",
      charjer: "charger",
      chargur: "charger",
      covr: "cover",
      cver: "cover",
    };

    let correctedQuery = query;
    for (const [misspelled, correct] of Object.entries(misspellingMap)) {
      const regex = new RegExp(`\\b${misspelled}\\b`, "gi");
      correctedQuery = correctedQuery.replace(regex, correct);
    }

    return correctedQuery;
  }

  getSearchTerms() {
    return this.query
      .split(/\s+/)
      .filter((term) => term.length > 1)
      .map((term) => term.replace(/[^a-z0-9]/gi, ""))
      .filter((term) => term.length > 1);
  }

  isValidSortBy() {
    const validSortOptions = [
      "relevance",
      "price_low",
      "price_high",
      "rating",
      "popularity",
      "newest",
    ];
    return validSortOptions.includes(this.sortBy);
  }

  getSortFunction() {
    switch (this.sortBy) {
      case "price_low":
        return (a, b) => a.price - b.price;
      case "price_high":
        return (a, b) => b.price - a.price;
      case "rating":
        return (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount;
      case "popularity":
        return (a, b) =>
          (b.analytics.unitsSold || 0) - (a.analytics.unitsSold || 0);
      case "newest":
        return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      case "relevance":
      default:
        return (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0);
    }
  }

  matchesFilters(product) {
    // Category filter
    if (
      this.category &&
      product.category.toLowerCase() !== this.category.toLowerCase()
    ) {
      return false;
    }

    // Brand filter
    if (
      this.brand &&
      product.brand.toLowerCase() !== this.brand.toLowerCase()
    ) {
      return false;
    }

    // Price range filter
    if (this.minPrice !== null && product.price < this.minPrice) {
      return false;
    }
    if (this.maxPrice !== null && product.price > this.maxPrice) {
      return false;
    }

    // Rating filter
    if (this.minRating !== null && product.rating < this.minRating) {
      return false;
    }

    // Stock filter
    if (this.inStock && product.stock <= 0) {
      return false;
    }

    return true;
  }

  toJSON() {
    return {
      query: this.query,
      limit: this.limit,
      offset: this.offset,
      sortBy: this.sortBy,
      category: this.category,
      brand: this.brand,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      minRating: this.minRating,
      inStock: this.inStock,
      priceRange: this.priceRange,
      ratingRange: this.ratingRange,
    };
  }
}

module.exports = SearchQuery;
