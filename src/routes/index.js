const express = require("express");
const productRoutes = require("./productRoutes");
const searchRoutes = require("./searchRoutes");

const router = express.Router();

// API version and service info
router.get("/", (req, res) => {
  res.json({
    service: "E-commerce Search Engine",
    version: "1.0.0",
    description:
      "Microservice for product search with advanced ranking algorithms",
    endpoints: {
      products: "/api/v1/product",
      search: "/api/v1/search",
      health: "/health",
    },
    documentation: "https://github.com/your-org/ecommerce-search-engine/wiki",
    support: "team@ecommerce.com",
  });
});

// Mount route modules
router.use("/product", productRoutes);
router.use("/search", searchRoutes);

module.exports = router;
