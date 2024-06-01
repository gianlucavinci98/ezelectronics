import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ProductDAO from "../../src/dao/productDAO"
import { Category } from "../../src/components/product"
import ReviewDAO from "../../src/dao/reviewDAO"
import { Role } from "../../src/components/user"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError } from "../../src/errors/reviewError"

jest.mock("../../src/dao/reviewDAO")
jest.mock("../../src/dao/productDAO")

beforeEach(() => {
    jest.clearAllMocks()
})

const reviewController = new ReviewController()

describe("ReviewController.addReview", () => {
    test("success", async () => {
        const date = new Date().toISOString().split('T')[0]
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: date,
            details: "details",
            quantity: 10,
        })
        const mock_existingReview = jest.spyOn(ReviewDAO.prototype, "existingReview").mockResolvedValueOnce(false)
        const mock_addReview = jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce()

        await reviewController.addReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, "Great product")

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_existingReview).toHaveBeenCalledTimes(1)
        expect(mock_addReview).toHaveBeenCalledTimes(1)
        expect(mock_addReview).toHaveBeenCalledWith("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, date, "Great product")
    })

    test("product not found", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        await expect(reviewController.addReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, "Great product")).rejects.toThrow(new ProductNotFoundError)
    })

    test("existing review", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: new Date().toISOString().split('T')[0],
            details: "details",
            quantity: 10,
        })
        jest.spyOn(ReviewDAO.prototype, "existingReview").mockResolvedValueOnce(true)
        await expect(reviewController.addReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, "Great product")).rejects.toThrow(new ExistingReviewError)
    })
})

describe("ReviewController.getProductReviews", () => {
    test("success", async () => {
        const date = new Date().toISOString().split('T')[0]
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: date,
            details: "details",
            quantity: 10,
        })
        const mock_getProductReviews = jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce([])

        await reviewController.getProductReviews("model")

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_getProductReviews).toHaveBeenCalledTimes(1)
        expect(mock_getProductReviews).toHaveBeenCalledWith("model")
    })

    test("product not found", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        await expect(reviewController.getProductReviews("model")).rejects.toThrow(new ProductNotFoundError)
    })
})

describe("ReviewController.deleteReview", () => {
    test("success", async () => {
        const date = new Date().toISOString().split('T')[0]
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: date,
            details: "details",
            quantity: 10,
        })
        const mock_existingReview = jest.spyOn(ReviewDAO.prototype, "existingReview").mockResolvedValueOnce(true)
        const mock_deleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce()

        await reviewController.deleteReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteReview).toHaveBeenCalledTimes(1)
        expect(mock_deleteReview).toHaveBeenCalledWith("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })
    })

    test("product not found", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        await expect(reviewController.deleteReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).rejects.toThrow(new ProductNotFoundError)
    })

    test("no review on product", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: new Date().toISOString().split('T')[0],
            details: "details",
            quantity: 10,
        })
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new Error())
        await expect(reviewController.deleteReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).rejects.toThrow(new Error())
    })
})

describe("ReviewController.deleteReviewsOfProduct", () => {
    test("success", async () => {
        const date = new Date().toISOString().split('T')[0]
        const mock_getProduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce({
            model: "model",
            sellingPrice: 100,
            category: Category.SMARTPHONE,
            arrivalDate: date,
            details: "details",
            quantity: 10,
        })
        const mock_deleteReviewsOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()

        await reviewController.deleteReviewsOfProduct("model")

        expect(mock_getProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mock_deleteReviewsOfProduct).toHaveBeenCalledWith("model")
    })

    test("product not found", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        await expect(reviewController.deleteReviewsOfProduct("model")).rejects.toThrow(new ProductNotFoundError)
    })
})

describe("ReviewController.deleteAllReviews", () => {
    test("success", async () => {
        const mock_deleteAll = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce()

        await reviewController.deleteAllReviews()

        expect(mock_deleteAll).toHaveBeenCalledTimes(1)
    })
})
