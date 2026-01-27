const express = require("express");
const ProductController = require("../controllers/ProductController");

const router = express.Router();

// Product CRUD operations
router.post("/", ProductController.createProduct.bind(ProductController));
router.get("/:id", ProductController.getProduct.bind(ProductController));
router.put("/:id", ProductController.updateProduct.bind(ProductController));
router.delete("/:id", ProductController.deleteProduct.bind(ProductController));

// Bulk operations
router.post(
  "/bulk",
  ProductController.bulkCreateProducts.bind(ProductController),
);

// Metadata operations
router.put(
  "/meta-data",
  ProductController.updateMetadata.bind(ProductController),
);

// Category and brand operations
router.get(
  "/category/:category",
  ProductController.getByCategory.bind(ProductController),
);
router.get(
  "/brand/:brand",
  ProductController.getByBrand.bind(ProductController),
);

// Get available categories and brands
router.get(
  "/categories",
  ProductController.getCategories.bind(ProductController),
);
router.get("/brands", ProductController.getBrands.bind(ProductController));

module.exports = router;
