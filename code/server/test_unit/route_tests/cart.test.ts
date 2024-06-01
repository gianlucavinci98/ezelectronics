import { describe, test, expect, beforeEach, beforeAll, jest } from "@jest/globals"
import request from 'supertest'

import { app } from "../../index"
import { Cart } from "../../src/components/cart"
import CartController from "../../src/controllers/cartController"
import Authenticator from "../../src/routers/auth"
import { ProductNotAvailableError, ProductNotInCartError } from "../../src/errors/cartError"

const baseURL = "/ezelectronics/carts"

const agent = request.agent(app)

jest.mock('../../src/controllers/cartController')
jest.mock("../../src/routers/auth")

beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
    })
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
    })
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
    })
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
})

describe('GET /ezelectronics/carts', () => {
    test('success', async () => {
        const cart = new Cart("customer", false, "", 0, [], 1)
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart)

        const response = await agent.get(baseURL)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(
            { ...cart, id: undefined }
        )

        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error())

        const response = await agent.get(baseURL)

        expect(response.status).toBe(503)
    })
})

describe('POST /ezelectronics/carts', () => {
    test('success', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)

        const response = await agent.post(baseURL).send({ model: "model" })

        expect(response.status).toBe(200)

        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(undefined, "model")
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotAvailableError())

        const response = await agent.post(baseURL).send({ model: "model" })

        expect(response.status).toBe(409)

        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(undefined, "model")
    })
})

describe('PATCH /ezelectronics/carts', () => {
    test('success', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)

        const response = await agent.patch(baseURL)

        expect(response.status).toBe(200)

        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error())

        const response = await agent.patch(baseURL)

        expect(response.status).toBe(503)

        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
    })
})

describe('GET /ezelectronics/carts/history', () => {
    test('success', async () => {
        const cart = new Cart("customer", false, "", 0, [], 1)
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart])

        const response = await agent.get(baseURL + "/history")

        expect(response.status).toBe(200)
        expect(response.body).toEqual(
            [{ ...cart, id: undefined }]
        )

        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error())

        const response = await agent.get(baseURL + "/history")

        expect(response.status).toBe(503)
    })
})

describe('DELETE /ezelectronics/carts/products/:model', () => {
    test('success', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true)

        const response = await agent.delete(baseURL + "/products/model")

        expect(response.status).toBe(200)

        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model")
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError())

        const response = await agent.delete(baseURL + "/products/model")

        expect(response.status).toBe(404)

        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(undefined, "model")
    })
})

describe('DELETE /ezelectronics/carts/current', () => {
    test('success', async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true)

        const response = await agent.delete(baseURL + "/current")

        expect(response.status).toBe(200)

        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error())

        const response = await agent.delete(baseURL + "/current")

        expect(response.status).toBe(503)

        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1)
    })
})

describe('DELETE /ezelectronics/carts', () => {
    test('success', async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true)

        const response = await agent.delete(baseURL)

        expect(response.status).toBe(200)

        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error())

        const response = await agent.delete(baseURL)

        expect(response.status).toBe(503)

        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
    })
})

describe('GET /ezelectronics/carts/all', () => {
    test('success', async () => {
        const cart = new Cart("customer", false, "", 0, [], 1)
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart])

        const response = await agent.get(baseURL + "/all")

        expect(response.status).toBe(200)
        expect(response.body).toEqual(
            [{ ...cart, id: undefined }]
        )

        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1)
    })

    test("error", async () => {
        jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error())

        const response = await agent.get(baseURL + "/all")

        expect(response.status).toBe(503)
    })
})
