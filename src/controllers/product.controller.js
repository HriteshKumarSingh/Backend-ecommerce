import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.product.js";
import apiFunctionality from "../utils/apiFunctionality.js";
import { v2 as cloudinary } from 'cloudinary';
import { User } from "../models/user.model.js";

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
  const updateFields = {};

  if (!name && !description && !price && !stock && !category && (!req.files || req.files.length === 0)) {
    throw new apiError(400, "at least one field is required to update");
  }

  if (name) updateFields.name = name.trim();
  if (description) updateFields.description = description.trim();
  if (price) updateFields.price = price;
  if (stock) updateFields.stock = stock;
  if (category) updateFields.category = category.trim();

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "product not found");
  }

  if (req.files && req.files.length > 0) {
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const imagePath = file.path;
      const uploadedImage = await uploadOnCloudinary(imagePath);

      if (!uploadedImage) {
        throw new apiError(500, "failed to upload the new images");
      }

      uploadedImages.push({
        public_id: uploadedImage.public_id,
        url: uploadedImage.url,
      });
    }

    updateFields.images = uploadedImages;
  }


  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedProduct) {
    throw new apiError(500, "product details could not be updated, please try again later");
  }

  return res
  .status(200)
  .json(new apiResponse(200, "product details updated successfully", updatedProduct));
});

// Delete product --Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!productId) {
    throw new apiError(400, "product ID is required");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "product not found");
  }

  try {
    for (const image of product.images) {
      if (image.public_id) {
        const result = await cloudinary.uploader.destroy(image.public_id, { resource_type: "image" });
        if (result.result !== "ok") {
          throw new Error(`failed to delete image with public_id: ${image.public_id}`);
        }
      }
    }
  } catch (error) {
    throw new apiError(500, "failed to delete images from Cloudinary" , error.message);
  }

  await Product.findByIdAndDelete(productId);

  return res
  .status(200)
  .json(new apiResponse(200, "product deleted successfully"));
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
  .json(new apiResponse(200, "product details retrieved successfully", product));
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
  .json(new apiResponse(200, "products retrieved successfully", paginatedProducts, filteredProductsCount));
});

// Create review and update review
const productReview = asyncHandler(async (req, res) => {
  const { rating, comment, productId } = req.body;

  if (!rating || !comment || !productId) {
    throw new apiError(400, "please provide values for all required fields");
  }

  const fullname = req.user.firstName + " " + req.user.lastName

  const review = {
    user: req.user._id,
    name: fullname,
    rating: Number(rating),
    comment: comment.trim(),
  };

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "product not found");
  }

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment.trim();
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  return res
  .status(200)
  .json(new apiResponse(200, "review added/updated successfully", product));
});

// Delete review
const deleteReview = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  if (!productId) {
    throw new apiError(400, "please provide product id");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "product not found");
  }

  const existingReview = product.reviews.find(
    (rev) => rev.user.toString() === userId.toString()
  );

  if (!existingReview) {
    throw new apiError(404, "review not found for this user");
  }

  product.reviews = product.reviews.filter(
    (rev) => rev.user.toString() !== userId.toString()
  );

  product.numberOfReviews = product.reviews.length;

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = product.reviews.length > 0 ? avg / product.reviews.length : 0;

  await product.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, "review deleted successfully", product));
});

// Delete review --Admin
const adminDeleteReview = asyncHandler(async(req , res) => {
  const productId = req.params.productId;
  const userId = req.params.userId;

  if (!productId || !userId) {
    throw new apiError(400, "please provide product id and user id");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "product not found");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new apiError(404, "user not found");
  }

  const existingReview = product.reviews.find(
    (rev) => rev.user.toString() === userId.toString()
  );

  if (!existingReview) {
    throw new apiError(404, "review not found for this user");
  }

  product.reviews = product.reviews.filter(
    (rev) => rev.user.toString() !== userId.toString()
  );

  product.numberOfReviews = product.reviews.length;

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = product.reviews.length > 0 ? avg / product.reviews.length : 0;

  await product.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, "review deleted successfully", product));
})

// Show all review of a product --Admin
const allReview = asyncHandler(async(req , res) => {
  const productId = req.params.id

  if(!productId){
    throw new apiError(400, "please provide product id")
  }

  const product = await Product.findById(productId)

  if(!product){
    throw new apiError(404, "product not found")
  }

  const reviews = product.reviews

  if(!reviews || reviews.length === 0){
    throw new apiError(404, "no review added for this product")
  }

  return res
  .status(200)
  .json(new apiResponse(200, "product reviews retrieved successfully", reviews))
})

export {
  createProduct,
  searchProduct,
  allProducts,
  singleProduct,
  updateProduct,
  deleteProduct,
  productReview,
  allReview,
  deleteReview,
  adminDeleteReview
};