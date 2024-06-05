import { describe, test, expect, beforeAll, afterEach, jest } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Role } from "../../src/components/user"

jest.mock("../../src/db/db")

afterEach(() => {
    jest.clearAllMocks()
})

const reviewDAO = new ReviewDAO()

describe("ReviewDAO.existingReview", () => {
    test("success and found", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementationOnce((query, params, callback) => {
            callback(undefined, Object)
            return {} as any
        })
        await expect(reviewDAO.existingReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).resolves.toBe(true)

        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), ["model", "test"], expect.any(Function))
    })

    test("success and not found", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementationOnce((query, params, callback) => {
            callback(undefined, undefined)
            return {} as any
        })
        await expect(reviewDAO.existingReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).resolves.toBe(false)

        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), ["model", "test"], expect.any(Function))
    })

    test("error", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementationOnce((query, params, callback) => {
            callback(new Error(), undefined)
            return {} as any
        })
        await expect(reviewDAO.existingReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).rejects.toThrow()

        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), ["model", "test"], expect.any(Function))
    })
})

describe("ReviewDAO.getProductReviews", () => {
    test("success", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementationOnce((query, params, callback) => {
            callback(undefined, [])
            return {} as any
        })
        await expect(reviewDAO.getProductReviews("model")).resolves.toEqual([])

        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), ["model"], expect.any(Function))
    })

    test("error", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementationOnce((query, params, callback) => {
            callback(new Error(), [])
            return {} as any
        })
        await expect(reviewDAO.getProductReviews("model")).rejects.toThrow()

        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), ["model"], expect.any(Function))
    })
})

describe("ReviewDAO.addReview", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(undefined)
            return {} as any
        })
        await expect(reviewDAO.addReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, "2024-01-01", "comment")).resolves.toBeUndefined()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model", "test", 5, "2024-01-01", "comment"], expect.any(Function))
    })

    test("error", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(reviewDAO.addReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        }, 5, "2024-01-01", "comment")).rejects.toThrow()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model", "test", 5, "2024-01-01", "comment"], expect.any(Function))
    })
})

describe("ReviewDAO.deleteReview", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(undefined)
            return {} as any
        })
        await expect(reviewDAO.deleteReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).resolves.toBeUndefined()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model", "test"], expect.any(Function))
    })

    test("error", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(reviewDAO.deleteReview("model", {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "",
            birthdate: "",
        })).rejects.toThrow()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model", "test"], expect.any(Function))
    })
})

describe("ReviewDAO.deleteReviewsOfProduct", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(undefined)
            return {} as any
        })
        await expect(reviewDAO.deleteReviewsOfProduct("model")).resolves.toBeUndefined()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model"], expect.any(Function))
    })

    test("error", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(reviewDAO.deleteReviewsOfProduct("model")).rejects.toThrow()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), ["model"], expect.any(Function))
    })
})

describe("ReviewDAO.deleteAllReviews", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, callback) => {
            callback(undefined)
            return {} as any
        })
        await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
    })

    test("error", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((query, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow()

        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
    })
})
