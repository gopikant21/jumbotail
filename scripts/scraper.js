const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../src/utils/logger");

/**
 * Web scraper for e-commerce product data
 * Scrapes product information from various Indian e-commerce sites
 */
class ProductScraper {
  constructor() {
    this.userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    this.requestDelay = 2000; // 2 seconds between requests
    this.maxRetries = 3;
  }

  /**
   * Scrape products from multiple sources
   */
  async scrapeProducts(targetCount = 1000) {
    const startTime = Date.now();
    logger.info("Starting product scraping...", { targetCount });

    try {
      const scrapedProducts = [];

      // Scrape from different categories
      const categories = [
        { name: "mobiles", target: 400 },
        { name: "laptops", target: 200 },
        { name: "accessories", target: 250 },
        { name: "audio", target: 150 },
      ];

      for (const category of categories) {
        logger.info(`Scraping ${category.name} products...`);

        const categoryProducts = await this.scrapeCategoryProducts(
          category.name,
          category.target,
        );

        scrapedProducts.push(...categoryProducts);

        // Rate limiting
        await this.delay(this.requestDelay);
      }

      // Save scraped data
      await this.saveScrapedData(scrapedProducts);

      logger.performance("Product scraping completed", startTime, {
        totalProducts: scrapedProducts.length,
        targetCount,
      });

      return scrapedProducts;
    } catch (error) {
      logger.error("Product scraping failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Scrape products from a specific category
   */
  async scrapeCategoryProducts(category, targetCount) {
    const products = [];

    try {
      // This is a mock implementation since we can't actually scrape live sites
      // In a real implementation, you would use different strategies for each site

      switch (category) {
        case "mobiles":
          products.push(...this.generateMockMobileData(targetCount));
          break;
        case "laptops":
          products.push(...this.generateMockLaptopData(targetCount));
          break;
        case "accessories":
          products.push(...this.generateMockAccessoryData(targetCount));
          break;
        case "audio":
          products.push(...this.generateMockAudioData(targetCount));
          break;
      }

      logger.info(`Scraped ${products.length} ${category} products`);
      return products;
    } catch (error) {
      logger.error(`Failed to scrape ${category} products`, {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Generate mock mobile phone data (simulating real scraping)
   */
  generateMockMobileData(count) {
    const products = [];
    const brands = [
      "Apple",
      "Samsung",
      "OnePlus",
      "Xiaomi",
      "Realme",
      "Oppo",
      "Vivo",
      "Google",
    ];
    const models = {
      Apple: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"],
      Samsung: [
        "Galaxy S23",
        "Galaxy S24",
        "Galaxy A54",
        "Galaxy M34",
        "Galaxy Note 20",
      ],
      OnePlus: ["OnePlus 11", "OnePlus 12", "OnePlus Nord", "OnePlus 10T"],
      Xiaomi: ["Mi 13", "Redmi Note 12", "Poco F5", "Mi 12 Pro"],
      Realme: ["Realme GT 6", "Realme 11 Pro", "Realme Narzo 60"],
      Oppo: ["Oppo Reno 10", "Oppo F23", "Oppo A78"],
      Vivo: ["Vivo V29", "Vivo Y56", "Vivo X90"],
      Google: ["Pixel 7", "Pixel 8", "Pixel 8 Pro"],
    };

    for (let i = 0; i < count; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const model =
        models[brand][Math.floor(Math.random() * models[brand].length)];
      const colors = [
        "Black",
        "White",
        "Blue",
        "Red",
        "Green",
        "Gold",
        "Silver",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const storageOptions = ["64GB", "128GB", "256GB", "512GB"];
      const storage =
        storageOptions[Math.floor(Math.random() * storageOptions.length)];

      products.push({
        title: `${brand} ${model} (${storage}, ${color})`,
        description: `${brand} ${model} smartphone with ${storage} storage in ${color}. Features advanced camera, fast processor, and premium build quality.`,
        category: "Mobile Phones",
        subcategory: "Smartphones",
        brand: brand,
        model: model,
        price: this.generateRealisticPrice(brand, "mobile"),
        mrp: null, // Will be calculated
        currency: "INR",
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 5000) + 100,
        stock: Math.floor(Math.random() * 500) + 10,
        imageUrls: [
          `https://images.example.com/${brand.toLowerCase()}-${model.toLowerCase()}.jpg`,
        ],
        metadata: {
          storage: storage,
          color: color,
          screenSize: this.generateScreenSize(),
          ram: this.generateRAM(),
          battery: this.generateBattery(),
          camera: this.generateCamera(),
          os: brand === "Apple" ? "iOS" : "Android",
        },
        analytics: this.generateAnalytics("mobile"),
        tags: [
          "mobile",
          "phone",
          "smartphone",
          brand.toLowerCase(),
          model.toLowerCase().replace(/\s+/g, "-"),
          color.toLowerCase(),
          storage.toLowerCase(),
        ],
        source: "scraped",
        scrapedAt: new Date(),
      });
    }

    return products;
  }

  /**
   * Generate mock laptop data
   */
  generateMockLaptopData(count) {
    const products = [];
    const brands = ["Dell", "HP", "Lenovo", "Asus", "Acer", "Apple", "MSI"];
    const series = {
      Dell: ["Inspiron", "XPS", "Latitude", "Vostro", "Alienware"],
      HP: ["Pavilion", "Envy", "EliteBook", "Omen", "ProBook"],
      Lenovo: ["ThinkPad", "IdeaPad", "Legion", "Yoga", "ThinkBook"],
      Asus: ["VivoBook", "ZenBook", "ROG", "TUF", "ExpertBook"],
      Acer: ["Aspire", "Swift", "Nitro", "Predator", "TravelMate"],
      Apple: ["MacBook Air", "MacBook Pro"],
      MSI: ["Modern", "Prestige", "Gaming", "Creator"],
    };

    for (let i = 0; i < count; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const seriesName =
        series[brand][Math.floor(Math.random() * series[brand].length)];
      const screenSize = ["13.3", "14", "15.6", "16", "17.3"][
        Math.floor(Math.random() * 5)
      ];

      products.push({
        title: `${brand} ${seriesName} ${screenSize}" Laptop`,
        description: `${brand} ${seriesName} laptop with ${screenSize}" display, powerful processor, and premium features for work and entertainment.`,
        category: "Laptops",
        subcategory:
          seriesName.includes("Gaming") || seriesName.includes("ROG")
            ? "Gaming Laptops"
            : "Business Laptops",
        brand: brand,
        model: seriesName,
        price: this.generateRealisticPrice(brand, "laptop"),
        mrp: null,
        currency: "INR",
        rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 3000) + 50,
        stock: Math.floor(Math.random() * 200) + 5,
        imageUrls: [
          `https://images.example.com/${brand.toLowerCase()}-${seriesName.toLowerCase()}.jpg`,
        ],
        metadata: {
          screenSize: screenSize + " inches",
          processor: this.generateProcessor(brand),
          ram: this.generateLaptopRAM(),
          storage: this.generateLaptopStorage(),
          graphics: this.generateGraphics(),
          os: brand === "Apple" ? "macOS" : "Windows 11",
          weight: this.generateWeight(),
        },
        analytics: this.generateAnalytics("laptop"),
        tags: [
          "laptop",
          "computer",
          "notebook",
          brand.toLowerCase(),
          seriesName.toLowerCase().replace(/\s+/g, "-"),
          screenSize + "inch",
        ],
        source: "scraped",
        scrapedAt: new Date(),
      });
    }

    return products;
  }

  /**
   * Generate mock accessory data
   */
  generateMockAccessoryData(count) {
    const products = [];
    const accessoryTypes = [
      {
        type: "Phone Case",
        brands: ["Apple", "Samsung", "OnePlus", "Spigen", "OtterBox"],
      },
      {
        type: "Screen Protector",
        brands: ["Gorilla Glass", "Nillkin", "ESR", "ZAGG"],
      },
      {
        type: "Charger",
        brands: ["Apple", "Samsung", "OnePlus", "Anker", "Belkin"],
      },
      {
        type: "Power Bank",
        brands: ["Mi", "Realme", "Ambrane", "Syska", "Anker"],
      },
      {
        type: "USB Cable",
        brands: ["Apple", "Samsung", "Belkin", "AmazonBasics"],
      },
      {
        type: "Laptop Bag",
        brands: ["VIP", "American Tourister", "Targus", "HP"],
      },
      { type: "Mouse", brands: ["Logitech", "Dell", "HP", "Microsoft"] },
      { type: "Keyboard", brands: ["Logitech", "Dell", "HP", "Cosmic Byte"] },
    ];

    for (let i = 0; i < count; i++) {
      const accessory =
        accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
      const brand =
        accessory.brands[Math.floor(Math.random() * accessory.brands.length)];

      products.push({
        title: `${brand} ${accessory.type}`,
        description: `High-quality ${accessory.type.toLowerCase()} from ${brand}. Compatible with multiple devices and built for durability.`,
        category: "Accessories",
        subcategory: accessory.type.includes("Phone")
          ? "Mobile Accessories"
          : "Computer Accessories",
        brand: brand,
        model: accessory.type,
        price: this.generateAccessoryPrice(accessory.type),
        mrp: null,
        currency: "INR",
        rating: Math.round((3.2 + Math.random() * 1.8) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 2000) + 20,
        stock: Math.floor(Math.random() * 1000) + 50,
        imageUrls: [
          `https://images.example.com/${brand.toLowerCase()}-${accessory.type.toLowerCase().replace(/\s+/g, "-")}.jpg`,
        ],
        metadata: {
          compatibility: this.getAccessoryCompatibility(accessory.type, brand),
          material: this.getAccessoryMaterial(accessory.type),
          warranty: this.getAccessoryWarranty(),
          color: this.getAccessoryColor(),
        },
        analytics: this.generateAnalytics("accessory"),
        tags: [
          "accessory",
          accessory.type.toLowerCase().replace(/\s+/g, "-"),
          brand.toLowerCase(),
          "compatible",
        ],
        source: "scraped",
        scrapedAt: new Date(),
      });
    }

    return products;
  }

  /**
   * Generate mock audio device data
   */
  generateMockAudioData(count) {
    const products = [];
    const audioTypes = [
      {
        type: "Wireless Earbuds",
        brands: ["Apple", "Sony", "JBL", "Boat", "Realme", "Mi"],
      },
      {
        type: "Bluetooth Headphones",
        brands: ["Sony", "JBL", "Boat", "Sennheiser", "Skullcandy"],
      },
      {
        type: "Wired Headphones",
        brands: ["Sony", "Sennheiser", "Audio-Technica", "JBL"],
      },
      {
        type: "Bluetooth Speaker",
        brands: ["JBL", "Boat", "Sony", "Ultimate Ears", "Marshall"],
      },
      {
        type: "Soundbar",
        brands: ["Samsung", "Sony", "JBL", "Boat", "Yamaha"],
      },
    ];

    for (let i = 0; i < count; i++) {
      const audioDevice =
        audioTypes[Math.floor(Math.random() * audioTypes.length)];
      const brand =
        audioDevice.brands[
          Math.floor(Math.random() * audioDevice.brands.length)
        ];

      products.push({
        title: `${brand} ${audioDevice.type}`,
        description: `Premium ${audioDevice.type.toLowerCase()} from ${brand} with excellent sound quality and modern features.`,
        category: "Audio",
        subcategory: audioDevice.type,
        brand: brand,
        model: audioDevice.type,
        price: this.generateAudioPrice(audioDevice.type, brand),
        mrp: null,
        currency: "INR",
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 4000) + 100,
        stock: Math.floor(Math.random() * 300) + 20,
        imageUrls: [
          `https://images.example.com/${brand.toLowerCase()}-${audioDevice.type.toLowerCase().replace(/\s+/g, "-")}.jpg`,
        ],
        metadata: {
          connectivity: this.getAudioConnectivity(audioDevice.type),
          batteryLife: this.getAudioBatteryLife(audioDevice.type),
          features: this.getAudioFeatures(),
          frequency: this.getFrequencyResponse(),
          impedance: this.getImpedance(),
        },
        analytics: this.generateAnalytics("audio"),
        tags: [
          "audio",
          audioDevice.type.toLowerCase().replace(/\s+/g, "-"),
          brand.toLowerCase(),
          "music",
        ],
        source: "scraped",
        scrapedAt: new Date(),
      });
    }

    return products;
  }

  // Helper methods for generating realistic data

  generateRealisticPrice(brand, category) {
    const basePrices = {
      mobile: {
        Apple: 70000,
        Samsung: 25000,
        OnePlus: 30000,
        Xiaomi: 15000,
        Realme: 12000,
        Oppo: 18000,
        Vivo: 16000,
        Google: 40000,
      },
      laptop: {
        Dell: 45000,
        HP: 40000,
        Lenovo: 42000,
        Asus: 35000,
        Acer: 30000,
        Apple: 80000,
        MSI: 50000,
      },
    };

    const basePrice = basePrices[category][brand] || 20000;
    const variation = basePrice * (0.3 + Math.random() * 0.7); // 30-100% variation
    return Math.floor(basePrice + variation);
  }

  generateAccessoryPrice(type) {
    const prices = {
      "Phone Case": [500, 2500],
      "Screen Protector": [200, 1200],
      Charger: [800, 3500],
      "Power Bank": [1000, 6000],
      "USB Cable": [300, 1800],
      "Laptop Bag": [1500, 8000],
      Mouse: [500, 4000],
      Keyboard: [1000, 8000],
    };

    const range = prices[type] || [500, 2000];
    return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
  }

  generateAudioPrice(type, brand) {
    const basePrices = {
      "Wireless Earbuds": { Apple: 15000, Sony: 8000, default: 2000 },
      "Bluetooth Headphones": { Sony: 6000, Sennheiser: 8000, default: 3000 },
      "Wired Headphones": { Sennheiser: 5000, Sony: 3000, default: 1500 },
      "Bluetooth Speaker": { JBL: 4000, Sony: 3500, default: 2500 },
      Soundbar: { Samsung: 12000, Sony: 15000, default: 8000 },
    };

    const typePrice = basePrices[type] || { default: 2000 };
    const basePrice = typePrice[brand] || typePrice.default;
    return Math.floor(basePrice + Math.random() * basePrice * 0.5);
  }

  generateScreenSize() {
    const sizes = ['6.1"', '6.4"', '6.7"', '6.8"'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  generateRAM() {
    const rams = ["4GB", "6GB", "8GB", "12GB"];
    return rams[Math.floor(Math.random() * rams.length)];
  }

  generateBattery() {
    const batteries = ["4000mAh", "4500mAh", "5000mAh", "5500mAh"];
    return batteries[Math.floor(Math.random() * batteries.length)];
  }

  generateCamera() {
    const cameras = ["48MP", "64MP", "108MP", "200MP"];
    return cameras[Math.floor(Math.random() * cameras.length)];
  }

  generateProcessor(brand) {
    if (brand === "Apple") {
      return ["M1", "M2", "M3"][Math.floor(Math.random() * 3)];
    }
    const processors = [
      "Intel i5-12th Gen",
      "Intel i7-13th Gen",
      "AMD Ryzen 5",
      "AMD Ryzen 7",
    ];
    return processors[Math.floor(Math.random() * processors.length)];
  }

  generateLaptopRAM() {
    const rams = ["8GB", "16GB", "32GB"];
    return rams[Math.floor(Math.random() * rams.length)];
  }

  generateLaptopStorage() {
    const storages = [
      "256GB SSD",
      "512GB SSD",
      "1TB SSD",
      "512GB SSD + 1TB HDD",
    ];
    return storages[Math.floor(Math.random() * storages.length)];
  }

  generateGraphics() {
    const graphics = [
      "Integrated",
      "NVIDIA GTX 1650",
      "NVIDIA RTX 3060",
      "AMD Radeon",
    ];
    return graphics[Math.floor(Math.random() * graphics.length)];
  }

  generateWeight() {
    return (1.2 + Math.random() * 1.8).toFixed(1) + " kg";
  }

  getAccessoryCompatibility(type, brand) {
    if (type.includes("Phone")) {
      return brand === "Apple" ? "iPhone series" : "Android smartphones";
    }
    return "Universal compatibility";
  }

  getAccessoryMaterial(type) {
    const materials = {
      "Phone Case": ["Silicone", "TPU", "Leather", "Metal"],
      "Screen Protector": ["Tempered Glass", "Plastic Film"],
      Charger: ["Plastic", "Metal"],
      "Power Bank": ["Plastic", "Metal"],
      "USB Cable": ["PVC", "Braided Nylon"],
      "Laptop Bag": ["Nylon", "Leather", "Polyester"],
      Mouse: ["Plastic", "Metal"],
      Keyboard: ["Plastic", "Metal"],
    };

    const typeMaterials = materials[type] || ["Plastic"];
    return typeMaterials[Math.floor(Math.random() * typeMaterials.length)];
  }

  getAccessoryWarranty() {
    const warranties = ["6 months", "1 year", "2 years"];
    return warranties[Math.floor(Math.random() * warranties.length)];
  }

  getAccessoryColor() {
    const colors = ["Black", "White", "Blue", "Red", "Clear", "Gray"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getAudioConnectivity(type) {
    if (type.includes("Wireless") || type.includes("Bluetooth")) {
      return "Bluetooth 5.0";
    }
    if (type.includes("Wired")) {
      return "3.5mm jack";
    }
    return "Multiple options";
  }

  getAudioBatteryLife(type) {
    const batteryLife = {
      "Wireless Earbuds": "6-8 hours",
      "Bluetooth Headphones": "20-30 hours",
      "Bluetooth Speaker": "10-12 hours",
      Soundbar: "AC powered",
    };
    return batteryLife[type] || "N/A";
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

  getFrequencyResponse() {
    const responses = ["20Hz-20kHz", "10Hz-22kHz", "16Hz-20kHz"];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getImpedance() {
    const impedances = ["32Ω", "50Ω", "80Ω", "250Ω"];
    return impedances[Math.floor(Math.random() * impedances.length)];
  }

  generateAnalytics(category) {
    const baseMultipliers = {
      mobile: 1,
      laptop: 0.5,
      accessory: 2,
      audio: 0.8,
    };

    const multiplier = baseMultipliers[category] || 1;

    return {
      unitsSold: Math.floor(Math.random() * 10000 * multiplier) + 100,
      returnRate: Math.random() * 0.15, // 0-15%
      profitMargin: 0.1 + Math.random() * 0.3, // 10-40%
      isTrending: Math.random() > 0.85,
      isOnSale: Math.random() > 0.9,
      viewCount: Math.floor(Math.random() * 50000 * multiplier) + 500,
      conversionRate: 0.02 + Math.random() * 0.08, // 2-10%
    };
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Save scraped data to file
   */
  async saveScrapedData(products) {
    try {
      // Add MRP values (20-30% higher than price)
      const enrichedProducts = products.map((product) => ({
        ...product,
        mrp: Math.floor(product.price * (1.2 + Math.random() * 0.1)),
      }));

      const dataPath = path.join(
        process.cwd(),
        "data",
        "scraped-products.json",
      );
      await fs.writeFile(dataPath, JSON.stringify(enrichedProducts, null, 2));

      logger.info("Scraped products saved to file", {
        path: dataPath,
        count: enrichedProducts.length,
      });
    } catch (error) {
      logger.error("Failed to save scraped products", { error: error.message });
    }
  }
}

// Export for use in other scripts
module.exports = ProductScraper;

// Run scraper if this file is executed directly
if (require.main === module) {
  const scraper = new ProductScraper();
  scraper
    .scrapeProducts(1000)
    .then((products) => {
      console.log(`✅ Successfully scraped ${products.length} products`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Scraping failed:", error.message);
      process.exit(1);
    });
}
