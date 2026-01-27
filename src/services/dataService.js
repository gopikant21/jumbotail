const InMemoryProductRepository = require("../repositories/ProductRepository");
const SearchService = require("./SearchService");
const logger = require("../utils/logger");
const fs = require("fs").promises;
const path = require("path");

/**
 * Data Service - Manages in-memory data store initialization and lifecycle
 */
class DataService {
  constructor() {
    this.productRepository = null;
    this.searchService = null;
    this.initialized = false;
  }

  /**
   * Initialize the in-memory data store
   */
  async initialize() {
    try {
      if (this.initialized) {
        logger.warn("Data service already initialized");
        return;
      }

      logger.info("Initializing data service...");

      // Initialize repository
      this.productRepository = new InMemoryProductRepository();

      // Initialize search service
      this.searchService = new SearchService(this.productRepository);

      // Load initial data
      await this.loadInitialData();

      this.initialized = true;
      logger.info("Data service initialized successfully", {
        productCount: this.productRepository.getStats().totalProducts,
        memoryUsage: this.productRepository.getStats().memoryUsage,
      });
    } catch (error) {
      logger.error("Failed to initialize data service", error);
      throw error;
    }
  }

  /**
   * Load initial data from various sources
   */
  async loadInitialData() {
    const startTime = Date.now();

    try {
      // Try to load from existing data file first
      const dataExists = await this.loadFromFile();

      if (!dataExists) {
        // Generate sample data if no existing data
        logger.info("No existing data found, generating sample products...");
        await this.generateSampleData();
      }

      logger.performance("Initial data loading completed", startTime, {
        productCount: this.productRepository.getStats().totalProducts,
      });
    } catch (error) {
      logger.error("Failed to load initial data", error);
      throw error;
    }
  }

  /**
   * Load products from JSON file
   */
  async loadFromFile() {
    try {
      const dataPath = path.join(process.cwd(), "data", "products.json");
      const fileExists = await fs
        .access(dataPath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        return false;
      }

      logger.info("Loading products from file...", { dataPath });
      const data = await fs.readFile(dataPath, "utf8");
      const products = JSON.parse(data);

      if (Array.isArray(products) && products.length > 0) {
        const result = await this.productRepository.bulkLoad(products);
        logger.info("Products loaded from file", {
          totalProducts: products.length,
          successCount: result.successCount,
          errorCount: result.errorCount,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.warn("Failed to load products from file", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Generate sample data for bootstrapping
   */
  async generateSampleData() {
    const sampleProducts = this.createSampleProducts();
    const result = await this.productRepository.bulkLoad(sampleProducts);

    // Save to file for future loads
    await this.saveToFile(sampleProducts);

    logger.info("Sample data generated", {
      totalGenerated: sampleProducts.length,
      successCount: result.successCount,
      errorCount: result.errorCount,
    });
  }

  /**
   * Create sample product data
   */
  createSampleProducts() {
    const products = [];

    // Mobile phones
    const mobilePhones = this.createMobilePhones();
    products.push(...mobilePhones);

    // Laptops
    const laptops = this.createLaptops();
    products.push(...laptops);

    // Accessories
    const accessories = this.createAccessories();
    products.push(...accessories);

    // Audio devices
    const audioDevices = this.createAudioDevices();
    products.push(...audioDevices);

    return products;
  }

  createMobilePhones() {
    const brands = [
      "Apple",
      "Samsung",
      "OnePlus",
      "Xiaomi",
      "Realme",
      "Oppo",
      "Vivo",
    ];
    const models = {
      Apple: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"],
      Samsung: ["Galaxy S23", "Galaxy S24", "Galaxy A54", "Galaxy M34"],
      OnePlus: ["OnePlus 11", "OnePlus 12", "OnePlus Nord"],
      Xiaomi: ["Mi 13", "Redmi Note 12", "Poco F5"],
      Realme: ["Realme GT 6", "Realme 11 Pro"],
      Oppo: ["Oppo Reno 10", "Oppo F23"],
      Vivo: ["Vivo V29", "Vivo Y56"],
    };

    const colors = ["Black", "White", "Blue", "Red", "Green", "Gold", "Silver"];
    const storageOptions = ["64GB", "128GB", "256", "512GB"];
    const ramOptions = ["4GB", "6GB", "8GB", "12GB", "16GB"];

    const products = [];

    for (const brand of brands) {
      for (const model of models[brand] || []) {
        for (let i = 0; i < 3; i++) {
          // 3 variants per model
          const color = colors[Math.floor(Math.random() * colors.length)];
          const storage =
            storageOptions[Math.floor(Math.random() * storageOptions.length)];
          const ram = ramOptions[Math.floor(Math.random() * ramOptions.length)];

          const basePrice = this.getMobileBasePrice(brand, model);
          const price = basePrice + Math.floor(Math.random() * 10000);
          const mrp = price + Math.floor(Math.random() * 5000) + 1000;

          products.push({
            title: `${brand} ${model} ${storage} ${color}`,
            description: `${brand} ${model} smartphone with ${storage} storage, ${ram} RAM in ${color} color. Latest Android/iOS with premium camera and display.`,
            category: "Mobile Phones",
            subcategory: "Smartphones",
            brand: brand,
            model: model,
            price: price,
            mrp: mrp,
            currency: "INR",
            rating: Math.round((3 + Math.random() * 2) * 10) / 10, // 3-5 rating
            ratingCount: Math.floor(Math.random() * 5000) + 100,
            stock: Math.floor(Math.random() * 500) + 10,
            imageUrls: [
              `https://example.com/images/${brand.toLowerCase()}-${model.toLowerCase()}-${color.toLowerCase()}.jpg`,
            ],
            metadata: {
              storage: storage,
              ram: ram,
              color: color,
              screenSize: this.getRandomScreenSize(),
              battery: this.getRandomBattery(),
              camera: this.getRandomCamera(),
              processor: this.getRandomProcessor(brand),
            },
            analytics: {
              unitsSold: Math.floor(Math.random() * 10000) + 100,
              returnRate: Math.random() * 0.15, // 0-15%
              profitMargin: 0.1 + Math.random() * 0.3, // 10-40%
              isTrending: Math.random() > 0.8,
              isOnSale: Math.random() > 0.9,
            },
            tags: [
              "mobile",
              "phone",
              "smartphone",
              brand.toLowerCase(),
              model.toLowerCase(),
              color.toLowerCase(),
            ],
          });
        }
      }
    }

    return products;
  }

  createLaptops() {
    const brands = ["Dell", "HP", "Lenovo", "Asus", "Acer", "Apple"];
    const models = {
      Dell: ["Inspiron 15", "XPS 13", "Latitude 14", "Vostro 15"],
      HP: ["Pavilion 15", "Envy 13", "Elite Book", "Omen 15"],
      Lenovo: ["ThinkPad E14", "IdeaPad 3", "Legion 5", "Yoga 7"],
      Asus: ["VivoBook 15", "ZenBook 14", "ROG Strix", "TUF Gaming"],
      Acer: ["Aspire 5", "Swift 3", "Nitro 5", "Predator Helios"],
      Apple: ["MacBook Air M2", "MacBook Pro 14", "MacBook Pro 16"],
    };

    const products = [];

    for (const brand of brands) {
      for (const model of models[brand] || []) {
        for (let i = 0; i < 2; i++) {
          // 2 variants per model
          const basePrice = this.getLaptopBasePrice(brand, model);
          const price = basePrice + Math.floor(Math.random() * 20000);
          const mrp = price + Math.floor(Math.random() * 10000) + 2000;

          products.push({
            title: `${brand} ${model} Laptop`,
            description: `${brand} ${model} laptop with Intel/AMD processor, SSD storage, and modern display for work and entertainment.`,
            category: "Laptops",
            subcategory: "Business Laptops",
            brand: brand,
            model: model,
            price: price,
            mrp: mrp,
            currency: "INR",
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5-5 rating
            ratingCount: Math.floor(Math.random() * 3000) + 50,
            stock: Math.floor(Math.random() * 200) + 5,
            imageUrls: [
              `https://example.com/images/${brand.toLowerCase()}-${model.toLowerCase()}.jpg`,
            ],
            metadata: {
              processor: this.getRandomLaptopProcessor(),
              ram: this.getRandomLaptopRam(),
              storage: this.getRandomLaptopStorage(),
              screenSize: this.getRandomLaptopScreen(),
              graphics: this.getRandomGraphics(),
              os: this.getRandomOS(brand),
            },
            analytics: {
              unitsSold: Math.floor(Math.random() * 5000) + 50,
              returnRate: Math.random() * 0.12,
              profitMargin: 0.08 + Math.random() * 0.25,
              isTrending: Math.random() > 0.85,
              isOnSale: Math.random() > 0.92,
            },
            tags: [
              "laptop",
              "computer",
              "notebook",
              brand.toLowerCase(),
              model.toLowerCase(),
            ],
          });
        }
      }
    }

    return products;
  }

  createAccessories() {
    const accessories = [
      {
        type: "Phone Case",
        brands: ["Apple", "Samsung", "OnePlus"],
        priceRange: [500, 2000],
      },
      {
        type: "Screen Guard",
        brands: ["Universal", "Apple", "Samsung"],
        priceRange: [200, 1000],
      },
      {
        type: "Charger",
        brands: ["Apple", "Samsung", "OnePlus", "Universal"],
        priceRange: [800, 3000],
      },
      {
        type: "Power Bank",
        brands: ["Mi", "Realme", "Ambrane", "Syska"],
        priceRange: [1000, 5000],
      },
      {
        type: "Cable",
        brands: ["Apple", "Samsung", "Universal"],
        priceRange: [300, 1500],
      },
    ];

    const products = [];

    for (const accessory of accessories) {
      for (const brand of accessory.brands) {
        for (let i = 0; i < 5; i++) {
          // 5 variants per accessory type
          const price =
            accessory.priceRange[0] +
            Math.floor(
              Math.random() *
                (accessory.priceRange[1] - accessory.priceRange[0]),
            );
          const mrp = price + Math.floor(Math.random() * 500) + 100;

          products.push({
            title: `${brand} ${accessory.type}`,
            description: `High-quality ${accessory.type.toLowerCase()} compatible with ${brand} devices and other smartphones.`,
            category: "Accessories",
            subcategory: "Mobile Accessories",
            brand: brand,
            model: accessory.type,
            price: price,
            mrp: mrp,
            currency: "INR",
            rating: Math.round((3.0 + Math.random() * 2) * 10) / 10,
            ratingCount: Math.floor(Math.random() * 2000) + 20,
            stock: Math.floor(Math.random() * 1000) + 50,
            imageUrls: [
              `https://example.com/images/${brand.toLowerCase()}-${accessory.type.toLowerCase().replace(" ", "-")}.jpg`,
            ],
            metadata: {
              compatibility: this.getCompatibility(brand),
              material: this.getRandomMaterial(),
              warranty: this.getRandomWarranty(),
            },
            analytics: {
              unitsSold: Math.floor(Math.random() * 15000) + 500,
              returnRate: Math.random() * 0.08,
              profitMargin: 0.15 + Math.random() * 0.4,
              isTrending: Math.random() > 0.8,
              isOnSale: Math.random() > 0.85,
            },
            tags: [
              "accessory",
              accessory.type.toLowerCase(),
              brand.toLowerCase(),
              "mobile",
            ],
          });
        }
      }
    }

    return products;
  }

  createAudioDevices() {
    const brands = [
      "Sony",
      "JBL",
      "Boat",
      "Sennheiser",
      "Audio-Technica",
      "Realme",
      "Mi",
    ];
    const types = [
      "Wireless Earbuds",
      "Bluetooth Headphones",
      "Wired Headphones",
      "Bluetooth Speaker",
    ];

    const products = [];

    for (const brand of brands) {
      for (const type of types) {
        for (let i = 0; i < 3; i++) {
          // 3 variants per type
          const basePrice = this.getAudioBasePrice(type);
          const price = basePrice + Math.floor(Math.random() * basePrice * 0.5);
          const mrp = price + Math.floor(Math.random() * 2000) + 500;

          products.push({
            title: `${brand} ${type}`,
            description: `Premium ${type.toLowerCase()} from ${brand} with excellent sound quality and modern features.`,
            category: "Audio",
            subcategory: type,
            brand: brand,
            model: type,
            price: price,
            mrp: mrp,
            currency: "INR",
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            ratingCount: Math.floor(Math.random() * 4000) + 100,
            stock: Math.floor(Math.random() * 300) + 20,
            imageUrls: [
              `https://example.com/images/${brand.toLowerCase()}-${type.toLowerCase().replace(" ", "-")}.jpg`,
            ],
            metadata: {
              connectivity: this.getAudioConnectivity(type),
              batteryLife: this.getRandomBatteryLife(type),
              features: this.getAudioFeatures(),
            },
            analytics: {
              unitsSold: Math.floor(Math.random() * 8000) + 200,
              returnRate: Math.random() * 0.1,
              profitMargin: 0.12 + Math.random() * 0.35,
              isTrending: Math.random() > 0.75,
              isOnSale: Math.random() > 0.88,
            },
            tags: ["audio", type.toLowerCase(), brand.toLowerCase(), "music"],
          });
        }
      }
    }

    return products;
  }

  // Helper methods for generating realistic product data
  getMobileBasePrice(brand, model) {
    const prices = {
      Apple: 70000,
      Samsung: 25000,
      OnePlus: 30000,
      Xiaomi: 15000,
      Realme: 12000,
      Oppo: 18000,
      Vivo: 16000,
    };
    return prices[brand] || 20000;
  }

  getLaptopBasePrice(brand, model) {
    const prices = {
      Dell: 45000,
      HP: 40000,
      Lenovo: 42000,
      Asus: 35000,
      Acer: 30000,
      Apple: 80000,
    };
    return prices[brand] || 40000;
  }

  getAudioBasePrice(type) {
    const prices = {
      "Wireless Earbuds": 2000,
      "Bluetooth Headphones": 3000,
      "Wired Headphones": 1500,
      "Bluetooth Speaker": 2500,
    };
    return prices[type] || 2000;
  }

  getRandomScreenSize() {
    const sizes = ["6.1 inches", "6.4 inches", "6.7 inches", "6.8 inches"];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getRandomBattery() {
    const batteries = ["4000mAh", "4500mAh", "5000mAh", "5500mAh"];
    return batteries[Math.floor(Math.random() * batteries.length)];
  }

  getRandomCamera() {
    const cameras = ["48MP", "64MP", "108MP", "200MP"];
    return cameras[Math.floor(Math.random() * cameras.length)];
  }

  getRandomProcessor(brand) {
    const processors = {
      Apple: ["A16 Bionic", "A17 Pro", "A18 Bionic"],
      default: [
        "Snapdragon 778G",
        "Snapdragon 888",
        "MediaTek Dimensity 1200",
        "Exynos 2200",
      ],
    };
    const options = processors[brand] || processors.default;
    return options[Math.floor(Math.random() * options.length)];
  }

  getRandomLaptopProcessor() {
    const processors = [
      "Intel i5-12th Gen",
      "Intel i7-13th Gen",
      "AMD Ryzen 5 5600H",
      "AMD Ryzen 7 6800H",
      "Apple M2",
    ];
    return processors[Math.floor(Math.random() * processors.length)];
  }

  getRandomLaptopRam() {
    const rams = ["8GB", "16GB", "32GB"];
    return rams[Math.floor(Math.random() * rams.length)];
  }

  getRandomLaptopStorage() {
    const storages = ["512GB SSD", "1TB SSD", "256GB SSD + 1TB HDD"];
    return storages[Math.floor(Math.random() * storages.length)];
  }

  getRandomLaptopScreen() {
    const screens = ["14 inches", "15.6 inches", "13.3 inches", "16 inches"];
    return screens[Math.floor(Math.random() * screens.length)];
  }

  getRandomGraphics() {
    const graphics = [
      "Integrated",
      "NVIDIA GTX 1650",
      "NVIDIA RTX 3060",
      "AMD Radeon",
    ];
    return graphics[Math.floor(Math.random() * graphics.length)];
  }

  getRandomOS(brand) {
    return brand === "Apple" ? "macOS" : "Windows 11";
  }

  getCompatibility(brand) {
    if (brand === "Universal") return "Most smartphones";
    return `${brand} devices and compatible smartphones`;
  }

  getRandomMaterial() {
    const materials = ["Silicone", "TPU", "Leather", "Metal", "Plastic"];
    return materials[Math.floor(Math.random() * materials.length)];
  }

  getRandomWarranty() {
    const warranties = ["6 months", "1 year", "2 years"];
    return warranties[Math.floor(Math.random() * warranties.length)];
  }

  getAudioConnectivity(type) {
    if (type.includes("Wireless") || type.includes("Bluetooth"))
      return "Bluetooth 5.0";
    if (type.includes("Wired")) return "3.5mm jack";
    return "Bluetooth 5.0";
  }

  getRandomBatteryLife(type) {
    if (type.includes("Earbuds")) return "6-8 hours";
    if (type.includes("Headphones")) return "20-30 hours";
    if (type.includes("Speaker")) return "10-12 hours";
    return "N/A";
  }

  getAudioFeatures() {
    const features = [
      "Noise Cancellation",
      "Water Resistant",
      "Fast Charging",
      "Voice Assistant",
    ];
    return features.filter(() => Math.random() > 0.5);
  }

  /**
   * Save products to file
   */
  async saveToFile(products) {
    try {
      const dataPath = path.join(process.cwd(), "data", "products.json");
      await fs.writeFile(dataPath, JSON.stringify(products, null, 2));
      logger.info("Products saved to file", {
        dataPath,
        count: products.length,
      });
    } catch (error) {
      logger.warn("Failed to save products to file", { error: error.message });
    }
  }

  /**
   * Get the product repository instance
   */
  getProductRepository() {
    if (!this.initialized) {
      throw new Error("Data service not initialized");
    }
    return this.productRepository;
  }

  /**
   * Get the search service instance
   */
  getSearchService() {
    if (!this.initialized) {
      throw new Error("Data service not initialized");
    }
    return this.searchService;
  }

  /**
   * Get service statistics
   */
  getStats() {
    if (!this.initialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      repository: this.productRepository.getStats(),
      search: this.searchService.getStats(),
    };
  }
}

// Create singleton instance
const dataService = new DataService();

// Export initialization function and service getter
module.exports = {
  initializeStore: () => dataService.initialize(),
  getDataService: () => dataService,
};
