import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.product.js";
import apiFunctionality from "../utils/apiFunctionality.js";
import { v2 as cloudinary } from 'cloudinary';

// Create product --Admin
const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { name, description, price, stock, category } = req.body;

  if (
    [name, description, price, stock, category].some(
      (fields) => fields.trim() === ""
    )
  ) {
    throw new apiError(400, "please provide values for all required fields");
  }

  let images = [];

  if (req.files && req.files.length > 0) {
    for (let file of req.files) {
      const result = await uploadOnCloudinary(file.path);
      if (result) {
        images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }
  } else {
    throw new apiError(400, "please upload product images");
  }

  const createdProduct = await Product.create({
    name,
    description,
    price,
    stock,
    category,
    images,
    user: userId,
  });

  if (!createdProduct) {
    throw new apiError(500, "unable to create product, please try again later");
  }

  return res
    .status(201)
    .json(new apiResponse(201, "product created successfully", createdProduct));
});

// Products --Admin (show all products)
const allProducts = asyncHandler(async (req, res) => {
  const resultPerPage = 10;
  const productQuery = new apiFunctionality(Product.find(), req.query).search();

  let products = await productQuery.query.clone();

  if (!products || products.length === 0) {
    throw new apiError(400, "no products available");
  }

  const filteredProductsCount = products.length;
  productQuery.pagination(resultPerPage);
  const paginatedProducts = await productQuery.query;

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "products retrieved successfully",
        paginatedProducts,
        filteredProductsCount
      )
    );
});

// Update product --Admin
const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, stock, category } = req.body;

  if (!name && !description && !price && !stock && !category) {
    throw new apiError(400, "at least one field is required to update");
  }

  const updateFields = {};

  if (name) updateFields.name = name.trim();
  if (description) updateFields.description = description.trim();
  if (price) updateFields.price = price;
  if (stock) updateFields.stock = stock;
  if (category) updateFields.category = category.trim();

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedProduct) {
    throw new apiError(
      500,
      "product details could not be updated, please try again later"
    );
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "product details updated successfully",
        updatedProduct
      )
    );
});

// Delete product --Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!productId) {
    throw new apiError(400, "Product ID is required");
  }

  // Find the product by ID
  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  // Delete images from Cloudinary
  try {
    for (const image of product.images) {
      if (image.public_id) {
        const result = await cloudinary.uploader.destroy(image.public_id, { resource_type: "image" });
        if (result.result !== "ok") {
          console.error(`Failed to delete image with public_id: ${image.public_id}`, result);
          throw new Error(`Failed to delete image with public_id: ${image.public_id}`);
        }
      }
    }
  } catch (error) {
    console.error("Cloudinary Error:", error.message); // Log detailed error
    throw new apiError(500, "Failed to delete images from Cloudinary");
  }

  // Delete the product from the database
  await Product.findByIdAndDelete(productId);

  return res
    .status(200)
    .json(new apiResponse(200, "Product deleted successfully"));
});

// Single product (show a single product)
const singleProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!productId) {
    throw new apiError(400, "please provide product id");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "no products available");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, "product details retrieved successfully", product)
    );
});

// All/Search/Filter/Pagination product
const searchProduct = asyncHandler(async (req, res) => {
  const resultPerPage = 10;
  const productQuery = new apiFunctionality(Product.find(), req.query)
    .search()
    .filter();

  let products = await productQuery.query.clone();

  if (!products || products.length === 0) {
    throw new apiError(400, "no products available");
  }

  const filteredProductsCount = products.length;
  productQuery.pagination(resultPerPage);
  const paginatedProducts = await productQuery.query;

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "products retrieved successfully",
        paginatedProducts,
        filteredProductsCount
      )
    );
});

export {
  createProduct,
  searchProduct,
  allProducts,
  singleProduct,
  updateProduct,
  deleteProduct
};
