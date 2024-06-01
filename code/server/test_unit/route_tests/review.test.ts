import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import request from 'supertest'

import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import ReviewController from "../../src/controllers/reviewController"
import { Role } from "../../src/components/user"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"

const baseURL = "/ezelectronics/reviews"

jest.mock("../../src/controllers/reviewController")
jest.mock("../../src/routers/auth")

const agent = request.agent(app)

const testUser = { //Define a test user object returned by the route
    username: "username",
    name: "test",
    surname: "test",
    role: Role.CUSTOMER,
    address: "test",
    birthdate: "test",
}

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
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next()
    })
})

describe("POST /reviews/:model", () => {
    test("success", async () => {
        const data = {
            score: 5,
            comment: "Great product"
        }
        const mock_addReview = jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()

        const response = await agent.post(baseURL + "/model").send(data)
        expect(response.status).toBe(200)

        expect(mock_addReview).toHaveBeenCalledTimes(1)
        expect(mock_addReview).toHaveBeenCalledWith(
            "model",
            testUser,
            data.score,
            data.comment
        )
    })

    test("product not found error", async () => {
        const data = {
            score: 5,
            comment: "Great product"
        }
        const mock_addReview = jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError)

        const response = await agent.post(baseURL + "/model").send(data)
        expect(response.status).toBe(404)

        expect(mock_addReview).toHaveBeenCalledTimes(1)
        expect(mock_addReview).toHaveBeenCalledWith(
            "model",
            testUser,
            data.score,
            data.comment
        )
    })

    test("existing review error", async () => {
        const data = {
            score: 5,
            comment: "Great product"
        }
        const mock_addReview = jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError)

        const response = await agent.post(baseURL + "/model").send(data)
        expect(response.status).toBe(409)

        expect(mock_addReview).toHaveBeenCalledTimes(1)
        expect(mock_addReview).toHaveBeenCalledWith(
            "model",
            testUser,
            data.score,
            data.comment
        )
    })
})

describe("GET /reviews/:model", () => {
    test("success", async () => {
        const mock_getProductReviews = jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([])

        const response = await agent.get(baseURL + "/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])

        expect(mock_getProductReviews).toHaveBeenCalledTimes(1)
        expect(mock_getProductReviews).toHaveBeenCalledWith("model")
    })

    test("product not found error", async () => {
        const mock_getProductReviews = jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new ProductNotFoundError)

        const response = await agent.get(baseURL + "/model")
        expect(response.status).toBe(404)

        expect(mock_getProductReviews).toHaveBeenCalledTimes(1)
        expect(mock_getProductReviews).toHaveBeenCalledWith("model")
    })
})

describe("DELETE /reviews/:model", () => {
    test("success", async () => {
        const mock_deleteReview = jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()

        const response = await agent.delete(baseURL + "/model")
        expect(response.status).toBe(200)

        expect(mock_deleteReview).toHaveBeenCalledTimes(1)
        expect(mock_deleteReview).toHaveBeenCalledWith("model", testUser)
    })

    test("product not found error", async () => {
        const mock_deleteReview = jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError)

        const response = await agent.delete(baseURL + "/model")
        expect(response.status).toBe(404)

        expect(mock_deleteReview).toHaveBeenCalledTimes(1)
        expect(mock_deleteReview).toHaveBeenCalledWith("model", testUser)
    })

    test("no review on product error", async () => {
        const mock_deleteReview = jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError)

        const response = await agent.delete(baseURL + "/model")
        expect(response.status).toBe(404)

        expect(mock_deleteReview).toHaveBeenCalledTimes(1)
        expect(mock_deleteReview).toHaveBeenCalledWith("model", testUser)
    })
})

describe("DELETE /reviews/:model/all", () => {
    test("success", async () => {
        const mock_deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()

        const response = await agent.delete(baseURL + "/model/all")
        expect(response.status).toBe(200)

        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledWith("model")
    })

    test("product not found error", async () => {
        const mock_deleteReviewsOfProduct = jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError)

        const response = await agent.delete(baseURL + "/model/all")
        expect(response.status).toBe(404)

        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledWith("model")
    })
})

describe("DELETE /reviews", () => {
    test("success", async () => {
        const mock_deleteAllReviews = jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()

        const response = await agent.delete(baseURL)
        expect(response.status).toBe(200)

        expect(mock_deleteAllReviews).toHaveBeenCalledTimes(1)
    })
})
