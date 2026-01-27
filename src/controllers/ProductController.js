const Joi = require("joi");
const { getDataService } = require("../services/dataService");
const {
  ValidationError,
  NotFoundError,
} = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Product Controller - Handles product-related API endpoints
 */
class ProductController {
  constructor() {
    // Validation schemas
    this.createProductSchema = Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(2000).required(),
      category: Joi.string().max(100),
      subcategory: Joi.string().max(100),
      brand: Joi.string().max(100),
      model: Joi.string().max(100),
      price: Joi.number().positive().required(),
      mrp: Joi.number().positive().min(Joi.ref("price")),
      currency: Joi.string().valid("INR", "USD").default("INR"),
      rating: Joi.number().min(0).max(5),
      ratingCount: Joi.number().min(0),
      stock: Joi.number().min(0).required(),
      imageUrls: Joi.array().items(Joi.string().uri()),
      metadata: Joi.object(),
      tags: Joi.array().items(Joi.string().max(50)),
    });

    this.updateProductSchema = Joi.object({
      title: Joi.string().min(3).max(200),
      description: Joi.string().max(2000),
      category: Joi.string().max(100),
      subcategory: Joi.string().max(100),
      brand: Joi.string().max(100),
      model: Joi.string().max(100),
      price: Joi.number().positive(),
      mrp: Joi.number().positive(),
      currency: Joi.string().valid("INR", "USD"),
      rating: Joi.number().min(0).max(5),
      ratingCount: Joi.number().min(0),
      stock: Joi.number().min(0),
      imageUrls: Joi.array().items(Joi.string().uri()),
      metadata: Joi.object(),
      tags: Joi.array().items(Joi.string().max(50)),
      isActive: Joi.boolean(),
    });

    this.updateMetadataSchema = Joi.object({
      productId: Joi.number().positive().required(),
      metadata: Joi.object().required(),
    });

    this.bulkProductSchema = Joi.object({
      products: Joi.array()
        .items(this.createProductSchema)
        .min(1)
        .max(100)
        .required(),
    });
  }

  /**
   * Create a new product
   * POST /api/v1/product
   */
  async createProduct(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate request body
      const { error, value } = this.createProductSchema.validate(req.body);
      if (error) {
        throw new ValidationError("Invalid product data", error.details);
      }

      // Get repository
      const dataService = getDataService();
      const repository = dataService.getProductRepository();

      // Create product
      const productId = await repository.add(value);

      logger.performance("Product created", startTime, {
        productId,
        title: value.title,
      });

      res.status(201).json({
        productId,
        status: "success",
        message: "Product created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/v1/product/:id
   */
  async getProduct(req, res, next) {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError("Invalid product ID");
      }

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const product = await repository.getById(productId);

      if (!product) {
        throw new NotFoundError("Product");
      }

      res.json({
        data: product.toJSON(),
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/v1/product/:id
   */
  async updateProduct(req, res, next) {
    try {
      const startTime = Date.now();
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError("Invalid product ID");
      }

      // Validate request body
      const { error, value } = this.updateProductSchema.validate(req.body);
      if (error) {
        throw new ValidationError("Invalid product data", error.details);
      }

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const updatedProduct = await repository.update(productId, value);

      logger.performance("Product updated", startTime, {
        productId,
        changes: Object.keys(value),
      });

      res.json({
        data: updatedProduct.toJSON(),
        status: "success",
        message: "Product updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product metadata
   * PUT /api/v1/product/meta-data
   */
  async updateMetadata(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate request body
      const { error, value } = this.updateMetadataSchema.validate(req.body);
      if (error) {
        throw new ValidationError("Invalid metadata", error.details);
      }

      const { productId, metadata } = value;

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const updatedProduct = await repository.updateMetadata(
        productId,
        metadata,
      );

      logger.performance("Product metadata updated", startTime, {
        productId,
        metadataKeys: Object.keys(metadata),
      });

      res.json({
        productId: updatedProduct.productId,
        metadata: updatedProduct.metadata,
        status: "success",
        message: "Metadata updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/v1/product/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError("Invalid product ID");
      }

      const dataService = getDataService();
      const repository = dataService.getProductRepository();

      // Soft delete by setting isActive to false
      const updatedProduct = await repository.update(productId, {
        isActive: false,
      });

      logger.info("Product deleted (soft delete)", { productId });

      res.json({
        productId,
        status: "success",
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create products
   * POST /api/v1/product/bulk
   */
  async bulkCreateProducts(req, res, next) {
    try {
      const startTime = Date.now();

      // Validate request body
      const { error, value } = this.bulkProductSchema.validate(req.body);
      if (error) {
        throw new ValidationError("Invalid bulk product data", error.details);
      }

      const dataService = getDataService();
      const repository = dataService.getProductRepository();

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const productData of value.products) {
        try {
          const productId = await repository.add(productData);
          results.push({
            productId,
            status: "success",
            title: productData.title,
          });
          successCount++;
        } catch (error) {
          results.push({
            status: "error",
            error: error.message,
            title: productData.title,
          });
          errorCount++;
        }
      }

      logger.performance("Bulk product creation completed", startTime, {
        totalProducts: value.products.length,
        successCount,
        errorCount,
      });

      res.status(201).json({
        results,
        summary: {
          total: value.products.length,
          successful: successCount,
          failed: errorCount,
        },
        status: "completed",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by category
   * GET /api/v1/product/category/:category
   */
  async getByCategory(req, res, next) {
    try {
      const category = req.params.category;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const products = await repository.getByCategory(category, limit);

      res.json({
        data: products.map((p) => p.toSearchResult()),
        category,
        count: products.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by brand
   * GET /api/v1/product/brand/:brand
   */
  async getByBrand(req, res, next) {
    try {
      const brand = req.params.brand;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const products = await repository.getByBrand(brand, limit);

      res.json({
        data: products.map((p) => p.toSearchResult()),
        brand,
        count: products.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available categories
   * GET /api/v1/product/categories
   */
  async getCategories(req, res, next) {
    try {
      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const categories = repository.getCategories();

      res.json({
        data: categories,
        count: categories.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available brands
   * GET /api/v1/product/brands
   */
  async getBrands(req, res, next) {
    try {
      const dataService = getDataService();
      const repository = dataService.getProductRepository();
      const brands = repository.getBrands();

      res.json({
        data: brands,
        count: brands.length,
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
