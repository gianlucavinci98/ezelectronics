import { describe, test, expect, beforeEach, beforeAll, jest } from "@jest/globals"

import { Category, Product } from "../../src/components/product"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"

import { ProductNotFoundError, ProductAlreadyExistsError, EditDateBeforeArrivalDateError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"

jest.mock("../../src/dao/productDAO")

beforeEach(() => {
    jest.clearAllMocks()
})

describe("ProductController tests", () => {
    let productController: ProductController

    beforeAll(() => {
        productController = new ProductController()
    })

    test("register products correctly inserts a new product", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new ProductNotFoundError())

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
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)

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
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new ProductNotFoundError())

        const mock_registerProduct = jest.spyOn(ProductDAO.prototype, "registerProduct").mockResolvedValueOnce()

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

    test("changeProductQuantity correctly increases the quantity of a product", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);
        const newQuantity = 5

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)
            .mockResolvedValueOnce(new Product(product.sellingPrice, product.model, product.category, product.arrivalDate, product.details, product.quantity + newQuantity))

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce()

        await expect(
            productController.changeProductQuantity(
                product.model,
                newQuantity,
                null
            )
        ).resolves.toBe(product.quantity + newQuantity)

        expect(mock_getProduct).toHaveBeenCalledTimes(2)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(mock_changeProductQuantity).toHaveBeenCalledWith(product.model, newQuantity)
    })

    test("changeProductQuantity throws an error if the change date is before the arrival date", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2022-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        const newQuantity = 5
        await expect(
            productController.changeProductQuantity(
                product.model,
                newQuantity,
                "2021-12-31"
            )
        ).rejects.toThrow(EditDateBeforeArrivalDateError)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("sellProduct correctly decreases the quantity of a product", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);
        const quantityToSell = 5

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)
            .mockResolvedValueOnce(new Product(product.sellingPrice, product.model, product.category, product.arrivalDate, product.details, product.quantity - quantityToSell))

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce()

        const newQuantity = await productController.sellProduct(product.model, quantityToSell, null)

        expect(newQuantity).toBe(product.quantity - quantityToSell)

        expect(mock_getProduct).toHaveBeenCalledTimes(2)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(mock_changeProductQuantity).toHaveBeenCalledWith(product.model, -quantityToSell)
    })

    test("sellProduct throws an error if the selling date is before the arrival date", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2022-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        const quantityToSell = 5
        await expect(
            productController.sellProduct(product.model, quantityToSell, "2021-01-01")
        ).rejects.toThrow(EditDateBeforeArrivalDateError)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("sellProduct throws an error if the product stock is empty", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 0);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        const quantityToSell = 5
        await expect(
            productController.sellProduct(product.model, quantityToSell, null)
        ).rejects.toThrow(EmptyProductStockError)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("sellProduct throws an error if the quantity to sell is greater than the product stock", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
            .mockResolvedValueOnce(product)

        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        const quantityToSell = 15
        await expect(
            productController.sellProduct(product.model, quantityToSell, null)
        ).rejects.toThrow(LowProductStockError)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("getProducts returns all products when no grouping is provided", async () => {
        const mock_getProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([])
        const mock_getProductsByCategory = jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")

        await productController.getProducts(null, null, null)

        expect(mock_getProducts).toHaveBeenCalledTimes(1)
        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
        expect(mock_getProduct).toHaveBeenCalledTimes(0)
    })

    test("getProducts returns products by category when grouping is 'category'", async () => {
        const mock_getProductsByCategory = jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([])
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct")
        const mock_getProducts = jest.spyOn(ProductDAO.prototype, "getProducts")

        await productController.getProducts("category", Category.SMARTPHONE, null)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getProductsByCategory).toHaveBeenCalledWith(Category.SMARTPHONE)
        expect(mock_getProduct).toHaveBeenCalledTimes(0)
        expect(mock_getProducts).toHaveBeenCalledTimes(0)
    })

    test("getProducts returns a product by model when grouping is 'model'", async () => {
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10))
        const mock_getProducts = jest.spyOn(ProductDAO.prototype, "getProducts")
        const mock_getProductsByCategory = jest.spyOn(ProductDAO.prototype, "getProductsByCategory")

        await productController.getProducts("model", null, "model")

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith("model")
        expect(mock_getProducts).toHaveBeenCalledTimes(0)
        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("getAvailableProducts returns all products when no grouping is provided", async () => {
        const mock_getAvailableProducts = jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([])
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductDAO.prototype, "getAvailableProductsByCategory")
        const mock_getProductAvailable = jest.spyOn(ProductDAO.prototype, "getProductAvailable")

        await productController.getAvailableProducts(null, null, null)

        expect(mock_getAvailableProducts).toHaveBeenCalledTimes(1)
        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
        expect(mock_getProductAvailable).toHaveBeenCalledTimes(0)
    })

    test("getAvailableProducts returns products by category when grouping is 'category'", async () => {
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductDAO.prototype, "getAvailableProductsByCategory").mockResolvedValueOnce([])
        const mock_getProductAvailable = jest.spyOn(ProductDAO.prototype, "getProductAvailable")
        const mock_getAvailableProducts = jest.spyOn(ProductDAO.prototype, "getAvailableProducts")

        await productController.getAvailableProducts("category", Category.SMARTPHONE, null)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledWith(Category.SMARTPHONE)
        expect(mock_getProductAvailable).toHaveBeenCalledTimes(0)
        expect(mock_getAvailableProducts).toHaveBeenCalledTimes(0)
    })

    test("getAvailableProducts returns a product by model when grouping is 'model'", async () => {
        const mock_getProductAvailable = jest.spyOn(ProductDAO.prototype, "getProductAvailable").mockResolvedValueOnce(new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10))
        const mock_getAvailableProducts = jest.spyOn(ProductDAO.prototype, "getAvailableProducts")
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductDAO.prototype, "getAvailableProductsByCategory")

        await productController.getAvailableProducts("model", null, "model")

        expect(mock_getProductAvailable).toHaveBeenCalledTimes(1)
        expect(mock_getProductAvailable).toHaveBeenCalledWith("model")
        expect(mock_getAvailableProducts).toHaveBeenCalledTimes(0)
        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("deleteAllProducts deletes all products", async () => {
        const mock_deleteAllProducts = jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

        await expect(productController.deleteAllProducts()).resolves.toBe(true)

        expect(mock_deleteAllProducts).toHaveBeenCalledTimes(1)
    })

    test("deleteProduct deletes a product by model", async () => {
        const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_deleteProduct = jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true)

        await expect(productController.deleteProduct(product.model)).resolves.toBe(true)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith(product.model)

        expect(mock_deleteProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteProduct).toHaveBeenCalledWith(product.model)
    })

    test("deleteProduct throws an error if the product does not exist", async () => {
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new ProductNotFoundError())
        const mock_deleteProduct = jest.spyOn(ProductDAO.prototype, "deleteProduct")

        await expect(productController.deleteProduct("model")).rejects.toThrow(ProductNotFoundError)

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProduct).toHaveBeenCalledWith("model")

        expect(mock_deleteProduct).toHaveBeenCalledTimes(0)
    })
})