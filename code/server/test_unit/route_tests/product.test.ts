import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import request from 'supertest'

import ProductController from "../../src/controllers/productController"
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import { EditDateBeforeArrivalDateError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import { Category } from "../../src/components/product"

const baseURL = "/ezelectronics/products"

jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

const agent = request.agent(app)

beforeEach(() => {
    jest.clearAllMocks()
    jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
            isInt: () => ({}),
            isFloat: () => ({}),
            optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
        })),
        query: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
            isInt: () => ({}),
            isFloat: () => ({}),
            optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
        })),
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
            isInt: () => ({}),
            isFloat: () => ({}),
            optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
        })),
    }))
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return next();
    })
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
    })
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
    })
})

describe("POST /ezelectronics/products", () => {
    test("POST /ezelectronics/products success", async () => {
        const product = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "details",
            sellingPrice: 1.0,
            arrivalDate: "2021-01-01"
        }
        const mock_registerProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

        const response = await agent.post(baseURL).send(product)
        expect(response.status).toBe(200)

        expect(mock_registerProducts).toHaveBeenCalledTimes(1)
        expect(mock_registerProducts).toHaveBeenCalledWith(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            product.arrivalDate
        )
    })

    test("POST /ezelectronics/products success with no date", async () => {
        const product = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "details",
            sellingPrice: 1.0
        }
        const mock_registerProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

        const response = await agent.post(baseURL).send(product)
        expect(response.status).toBe(200)

        expect(mock_registerProducts).toHaveBeenCalledTimes(1)
        expect(mock_registerProducts).toHaveBeenCalledWith(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            undefined
        )
    })

    test("POST /ezelectronics/products error", async () => {
        const product = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "details",
            sellingPrice: 1.0,
            arrivalDate: "2021-01-01"
        }
        const mock_registerProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError())

        const response = await agent.post(baseURL).send(product)
        expect(response.status).toBe(409)

        expect(mock_registerProducts).toHaveBeenCalledTimes(1)
        expect(mock_registerProducts).toHaveBeenCalledWith(
            product.model,
            product.category,
            product.quantity,
            product.details,
            product.sellingPrice,
            product.arrivalDate
        )
    })

    test("POST /ezelectronics/products error date in the future", async () => {
        const product = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "details",
            sellingPrice: 1.0,
            arrivalDate: "2050-01-01"
        }
        const mock_registerProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

        const response = await agent.post(baseURL).send(product)
        expect(response.status).toBe(400)

        expect(mock_registerProducts).toHaveBeenCalledTimes(0)
    })
})

describe("PATCH /ezelectronics/products/:model", () => {
    test("PATCH /ezelectronics/products/:model success", async () => {
        const model = "model"
        const newQuantity = 1
        const mock_changeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(newQuantity + 5)

        const response = await agent.patch(`${baseURL}/${model}`).send({ quantity: newQuantity })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: newQuantity + 5 })

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(mock_changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, undefined)
    })

    test("PATCH /ezelectronics/products/:model success with date", async () => {
        const model = "model"
        const newQuantity = 1
        const changeDate = "2021-01-01"
        const mock_changeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(newQuantity + 5)

        const response = await agent.patch(`${baseURL}/${model}`).send({ quantity: newQuantity, changeDate })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: newQuantity + 5 })

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(mock_changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate)
    })

    test("PATCH /ezelectronics/products/:model error", async () => {
        const model = "model"
        const newQuantity = 1
        const mock_changeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new EditDateBeforeArrivalDateError())

        const response = await agent.patch(`${baseURL}/${model}`).send({ quantity: newQuantity })
        expect(response.status).toBe(400)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(mock_changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, undefined)
    })

    test("PATCH /ezelectronics/products/:model error date in the future", async () => {
        const model = "model"
        const newQuantity = 1
        const changeDate = "2050-01-01"
        const mock_changeProductQuantity = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(newQuantity + 5)

        const response = await agent.patch(`${baseURL}/${model}`).send({ quantity: newQuantity, changeDate })
        expect(response.status).toBe(400)

        expect(mock_changeProductQuantity).toHaveBeenCalledTimes(0)
    })
})

describe("PATCH /ezelectronics/products/:model/sell", () => {
    test("PATCH /ezelectronics/products/:model/sell success", async () => {
        const model = "model"
        const quantity = 1
        const mock_sellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(5)

        const response = await agent.patch(`${baseURL}/${model}/sell`).send({ quantity })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: 5 })

        expect(mock_sellProduct).toHaveBeenCalledTimes(1)
        expect(mock_sellProduct).toHaveBeenCalledWith(model, quantity, undefined)
    })

    test("PATCH /ezelectronics/products/:model/sell success with date", async () => {
        const model = "model"
        const quantity = 1
        const sellingDate = "2021-01-01"
        const mock_sellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(5)

        const response = await agent.patch(`${baseURL}/${model}/sell`).send({ quantity, sellingDate })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: 5 })

        expect(mock_sellProduct).toHaveBeenCalledTimes(1)
        expect(mock_sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    })

    test("PATCH /ezelectronics/products/:model/sell error", async () => {
        const model = "model"
        const quantity = 1
        const mock_sellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EditDateBeforeArrivalDateError())

        const response = await agent.patch(`${baseURL}/${model}/sell`).send({ quantity })
        expect(response.status).toBe(400)

        expect(mock_sellProduct).toHaveBeenCalledTimes(1)
        expect(mock_sellProduct).toHaveBeenCalledWith(model, quantity, undefined)
    })

    test("PATCH /ezelectronics/products/:model/sell error date in the future", async () => {
        const model = "model"
        const quantity = 1
        const sellingDate = "2050-01-01"
        const mock_sellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(5)

        const response = await agent.patch(`${baseURL}/${model}/sell`).send({ quantity, sellingDate })
        expect(response.status).toBe(400)

        expect(mock_sellProduct).toHaveBeenCalledTimes(0)
    })
})

describe("GET /ezelectronics/products", () => {
    test("GET /ezelectronics/products success", async () => {
        const mock_getProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])

        const response = await agent.get(baseURL)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getProducts).toHaveBeenCalledTimes(1)
        expect(mock_getProducts).toHaveBeenCalledWith(undefined, undefined, undefined)
    })

    test("GET /ezelectronics/products error", async () => {
        const mock_getProducts = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await agent.get(baseURL)
        expect(response.status).toBe(404)

        expect(mock_getProducts).toHaveBeenCalledTimes(1)
    })

    test("GET /ezelectronics/products error grouping by category with missing category", async () => {
        const grouping = "category"
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?grouping=${grouping}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products error grouping by category with model specified", async () => {
        const grouping = "category"
        const model = "model"
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?grouping=${grouping}&model=${model}&category=${Category.SMARTPHONE}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products error grouping by model with missing model", async () => {
        const grouping = "model"
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?grouping=${grouping}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products error grouping by model with category specified", async () => {
        const grouping = "model"
        const category = Category.SMARTPHONE
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?grouping=${grouping}&model=model&category=${category}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products error no grouping with category specified", async () => {
        const category = Category.SMARTPHONE
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?category=${category}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products error no grouping with model specified", async () => {
        const model = "model"
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts")

        const response = await agent.get(`${baseURL}?model=${model}`)
        expect(response.status).toBe(422)

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products success grouping by category", async () => {
        const grouping = "category"
        const category = Category.SMARTPHONE
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])

        const response = await agent.get(`${baseURL}?grouping=${grouping}&category=${category}`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getProductsByCategory).toHaveBeenCalledWith(grouping, category, undefined)
    })

    test("GET /ezelectronics/products success grouping by model", async () => {
        const grouping = "model"
        const model = "model"
        const mock_getProductsByCategory = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])

        const response = await agent.get(`${baseURL}?grouping=${grouping}&model=${model}`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getProductsByCategory).toHaveBeenCalledWith(grouping, undefined, model)
    })
})

describe("GET /ezelectronics/products/available", () => {
    test("GET /ezelectronics/products/available success", async () => {
        const mock_getAvailableProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([])

        const response = await agent.get(`${baseURL}/available`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getAvailableProducts).toHaveBeenCalledTimes(1)
        expect(mock_getAvailableProducts).toHaveBeenCalledWith(undefined, undefined, undefined)
    })

    test("GET /ezelectronics/products/available error", async () => {
        const mock_getAvailableProducts = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await agent.get(`${baseURL}/available`)
        expect(response.status).toBe(404)

        expect(mock_getAvailableProducts).toHaveBeenCalledTimes(1)
    })

    test("GET /ezelectronics/products/available error grouping by category with missing category", async () => {
        const grouping = "category"
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available error grouping by category with model specified", async () => {
        const grouping = "category"
        const model = "model"
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}&model=${model}&category=${Category.SMARTPHONE}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available error grouping by model with missing model", async () => {
        const grouping = "model"
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available error grouping by model with category specified", async () => {
        const grouping = "model"
        const category = Category.SMARTPHONE
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}&model=model&category=${category}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available error no grouping with category specified", async () => {
        const category = Category.SMARTPHONE
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?category=${category}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available error no grouping with model specified", async () => {
        const model = "model"
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts")

        const response = await agent.get(`${baseURL}/available?model=${model}`)
        expect(response.status).toBe(422)

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(0)
    })

    test("GET /ezelectronics/products/available success grouping by category", async () => {
        const grouping = "category"
        const category = Category.SMARTPHONE
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([])

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}&category=${category}`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledWith(grouping, category, undefined)
    })

    test("GET /ezelectronics/products/available success grouping by model", async () => {
        const grouping = "model"
        const model = "model"
        const mock_getAvailableProductsByCategory = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([])

        const response = await agent.get(`${baseURL}/available?grouping=${grouping}&model=${model}`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledTimes(1)
        expect(mock_getAvailableProductsByCategory).toHaveBeenCalledWith(grouping, undefined, model)
    })
})

describe("DELETE /ezelectronics/products/:model", () => {
    test("DELETE /ezelectronics/products/:model success", async () => {
        const model = "model"
        const mock_deleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)

        const response = await agent.delete(`${baseURL}/${model}`)
        expect(response.status).toBe(200)

        expect(mock_deleteProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteProduct).toHaveBeenCalledWith(model)
    })

    test("DELETE /ezelectronics/products/:model error", async () => {
        const model = "model"
        const mock_deleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await agent.delete(`${baseURL}/${model}`)
        expect(response.status).toBe(404)

        expect(mock_deleteProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteProduct).toHaveBeenCalledWith(model)
    })
})

describe("DELETE /ezelectronics/products", () => {
    test("DELETE /ezelectronics/products success", async () => {
        const mock_deleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

        const response = await agent.delete(baseURL)
        expect(response.status).toBe(200)

        expect(mock_deleteAllProducts).toHaveBeenCalledTimes(1)
    })

    test("DELETE /ezelectronics/products error", async () => {
        const mock_deleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new ProductNotFoundError())

        const response = await agent.delete(baseURL)
        expect(response.status).toBe(404)

        expect(mock_deleteAllProducts).toHaveBeenCalledTimes(1)
    })
})
