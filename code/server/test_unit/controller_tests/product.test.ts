import { describe, test, expect, beforeEach, afterAll, jest } from "@jest/globals"

import { Category, Product } from "../../src/components/product"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"

import { ProductNotFoundError, ProductAlreadyExistsError } from "../../src/errors/productError"

beforeEach(() => {
    jest.restoreAllMocks()
})

test("register products correctly inserts a new product", async () => {
    const productController = new ProductController()
    const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

    const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
    mock_getProduct.mockRejectedValueOnce(new ProductNotFoundError())

    const mock_registerProduct = jest.spyOn(ProductDAO.prototype, "registerProduct")
    mock_registerProduct.mockResolvedValueOnce()

    await expect(
        productController.registerProducts(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            product.arrivalDate
        )
    ).resolves.toBeUndefined()

    expect(mock_getProduct).toHaveBeenCalledTimes(1)
    expect(mock_getProduct).toHaveBeenCalledWith(product.model)

    expect(mock_registerProduct).toHaveBeenCalledTimes(1)
    expect(mock_registerProduct).toHaveBeenCalledWith(
        product.sellingPrice,
        product.model,
        product.category,
        product.arrivalDate,
        product.details,
        product.quantity
    )
})

test("register products throws an error if the product already exists", async () => {
    const productController = new ProductController()
    const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

    const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct")
    mock_getproduct.mockResolvedValueOnce(product)

    const mock_registerproduct = jest.spyOn(ProductDAO.prototype, "registerProduct")

    await expect(
        productController.registerProducts(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            product.arrivalDate
        )
    ).rejects.toThrow(ProductAlreadyExistsError)

    expect(mock_getproduct).toHaveBeenCalledTimes(1)
    expect(mock_getproduct).toHaveBeenCalledWith(product.model)

    expect(mock_registerproduct).toHaveBeenCalledTimes(0)
})

test("register products correctly defaults arrival date to today", async () => {
    const productController = new ProductController()
    const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

    const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
    mock_getProduct.mockRejectedValueOnce(new ProductNotFoundError())

    const mock_registerProduct = jest.spyOn(ProductDAO.prototype, "registerProduct")
    mock_registerProduct.mockResolvedValueOnce()

    await expect(
        productController.registerProducts(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            null
        )
    ).resolves.toBeUndefined()

    expect(mock_getProduct).toHaveBeenCalledTimes(1)
    expect(mock_getProduct).toHaveBeenCalledWith(product.model)

    const today = new Date().toISOString().split('T')[0]

    expect(mock_registerProduct).toHaveBeenCalledTimes(1)
    expect(mock_registerProduct).toHaveBeenCalledWith(
        product.sellingPrice,
        product.model,
        product.category,
        today,
        product.details,
        product.quantity
    )
})