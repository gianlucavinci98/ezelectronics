import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import db from "../../src/db/db"
import ProductDAO from "../../src/dao/productDAO"
import { Category, Product } from "../../src/components/product"
import { ProductNotFoundError } from "../../src/errors/productError"

// Helper function to generate a unique model name for products
const generateUniqueModel = () => {
    return `model_${Math.floor(Math.random() * 100000)}`
}

beforeAll(() => {
    // Add any setup logic here if needed
})

afterAll(() => {
    // Add any teardown logic here if needed
})

test("get product returns the correct product", async () => {
    const productDAO = new ProductDAO()
    const model = generateUniqueModel();
    const product = new Product(100, model, Category.APPLIANCE, "2020-01-01", "details", 10);

    // Insert the product into the database
    await productDAO.registerProduct(product.sellingPrice, product.model, product.category, product.arrivalDate || new Date().toISOString().split('T')[0], product.details, product.quantity)

    // Retrieve the product from the database
    const result = await productDAO.getProduct(product.model)

    // Verify that the retrieved product matches the original product
    expect(result).toEqual(product)

    // Clean up: Delete the product from the database
    await productDAO.deleteProduct(product.model)
})

test("get product returns an error if the product does not exist", async () => {
    const productDAO = new ProductDAO()

    // Attempt to retrieve a non-existent product
    await expect(productDAO.getProduct("nonexistent_model")).rejects.toThrow(ProductNotFoundError)
})

test("register product correctly inserts a new product", async () => {
    const productDAO = new ProductDAO()
    const model = generateUniqueModel();
    const product = new Product(100, model, Category.APPLIANCE, "2020-01-01", "details", 10);

    // Register the product
    await productDAO.registerProduct(product.sellingPrice, product.model, product.category, product.arrivalDate || new Date().toISOString().split('T')[0], product.details, product.quantity)

    // Retrieve the product from the database
    const result = await productDAO.getProduct(model)

    // Verify that the retrieved product matches the original product
    expect(result).toEqual(product)

    // Clean up: Delete the product from the database
    await productDAO.deleteProduct(model)
})

test("changeProductQuantity updates product quantity correctly", async () => {
    const productDAO = new ProductDAO();
    const model = generateUniqueModel();
    const initialQuantity = 10;
    const newQuantity = 5;

    // Insert a product with initial quantity
    await productDAO.registerProduct(100, model, Category.APPLIANCE, "2020-01-01", "details", initialQuantity)

    // Increase the product quantity
    await productDAO.changeProductQuantity(model, newQuantity);

    // Verify that the quantity has been updated correctly
    let product = await productDAO.getProduct(model)
    expect(product?.quantity).toEqual(initialQuantity + newQuantity);

    // Decrease the product quantity
    await productDAO.changeProductQuantity(model, -newQuantity);

    // Verify that the quantity has been updated correctly after reduction
    product = await productDAO.getProduct(model)
    expect(product?.quantity).toEqual(initialQuantity);

    // Clean up: Delete the product from the database
    await productDAO.deleteProduct(model)
})

test("deleteAllProducts deletes all products", async () => {
    const productDAO = new ProductDAO()
    const model1 = generateUniqueModel();
    const model2 = generateUniqueModel();

    // Insert two products
    await productDAO.registerProduct(100, model1, Category.APPLIANCE, "2020-01-01", "details", 10)
    await productDAO.registerProduct(200, model2, Category.APPLIANCE, "2020-02-02", "details", 20)

    // Delete all products
    await productDAO.deleteAllProducts()

    // Verify that there are no products left in the database
    const products = await productDAO.getProducts()
    expect(products.length).toEqual(0)
})

test("deleteProduct deletes the product with the specified model", async () => {
    const productDAO = new ProductDAO();
    const model = generateUniqueModel();
    const product = new Product(100, model, Category.APPLIANCE, "2020-01-01", "details", 10);

    // Register the product first
    await productDAO.registerProduct(product.sellingPrice, product.model, product.category, product.arrivalDate || new Date().toISOString().split('T')[0], product.details, product.quantity);

    // Delete the product
    const result = await productDAO.deleteProduct(product.model);

    // Verify that the product is successfully deleted
    expect(result).toBe(true);

    // Verify that the product is no longer in the database
    expect(productDAO.getProduct(product.model)).rejects.toThrowError(ProductNotFoundError);
})
