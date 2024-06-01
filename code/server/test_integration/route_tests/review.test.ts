import { test, describe, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals"
import TestAgent from "supertest/lib/agent"
import { Category, Product } from "../../src/components/product"
import { Role, User } from "../../src/components/user"
import request from "supertest"
import { app } from "../../index"
import { cleanup, dbAll, dbGet, dbRun, login, logout } from "../utilities"
import UserDAO from "../../src/dao/userDAO"

const baseURL = "/ezelectronics"
const reviewsBaseURL = baseURL + "/reviews"

const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const customer2: User = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "customer", "2021-01-02")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")
const products: Product[] = [
    new Product(10, "product1", Category.SMARTPHONE, "2020-01-01", "details", 10),
    new Product(20, "product2", Category.LAPTOP, "2020-01-01", "details", 20),
]

const agent: TestAgent = request.agent(app)

async function cleanDB() {
    await dbRun("DELETE FROM review", [])
}

async function insertReviews() {
    await dbRun("INSERT INTO review (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)", [products[0].model, customer.username, 5, "comment1", "2021-01-01"])
    await dbRun("INSERT INTO review (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)", [products[0].model, customer2.username, 5, "comment2", "2022-01-01"])
    await dbRun("INSERT INTO review (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)", [products[1].model, customer.username, 5, "comment3", "2023-01-01"])
}

beforeAll(async () => {
    await cleanup()
    const userDAO = new UserDAO()
    await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
    await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
    await userDAO.createUser(customer2.username, customer2.name, customer2.surname, "password", customer2.role)
    await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)
    await Promise.all(products.map((product) => {
        dbRun(
            "INSERT INTO product (model, sellingPrice, arrivalDate, details, quantity, category) VALUES (?, ?, ?, ?, ?, ?)",
            [product.model, product.sellingPrice, product.arrivalDate, product.details, product.quantity, product.category]
        )
    }))
})

afterAll(async () => {
    await cleanup()
})

afterEach(async () => {
    await logout(agent)
    await cleanDB()
})

describe("POST /reviews/:model", () => {
    test("should add a review", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review", [])).resolves.toEqual({ model: products[0].model, user: customer.username, score: 5, comment: "comment", date: (new Date()).toISOString().split("T")[0] })
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a manager", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is an admin", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        expect(response.status).toBe(401)
    })

    test("should return 404 if the product does not exist", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(reviewsBaseURL + "/nonexistent").send({ score: 5, comment: "comment" })
        expect(response.status).toBe(404)
    })

    test("should return 409 if the user has already reviewed the product", async () => {
        await login(customer.username, "password", agent)
        await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        const response = await agent.post(reviewsBaseURL + "/" + products[0].model).send({ score: 5, comment: "comment" })
        expect(response.status).toBe(409)
    })
})

describe("GET /reviews/:model", () => {
    beforeEach(async () => {
        await insertReviews()
    })

    const stdTest = async () => {
        const response = await agent.get(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([{ model: products[0].model, user: customer.username, score: 5, comment: "comment1", date: "2021-01-01" }, { model: products[0].model, user: customer2.username, score: 5, comment: "comment2", date: "2022-01-01" }])
    }

    test("should return the reviews of a product", async () => {
        await login(customer.username, "password", agent)
        await stdTest()
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await agent.get(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("test called by a manager", async () => {
        await login(manager.username, "password", agent)
        await stdTest()
    })

    test("test called by an admin", async () => {
        await login(admin.username, "password", agent)
        await stdTest()
    })

    test("should return 404 if the product does not exist", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(reviewsBaseURL + "/nonexistent")
        expect(response.status).toBe(404)
    })
})

describe("DELETE /reviews/:model", () => {
    beforeEach(async () => {
        await insertReviews()
    })

    test("should delete the review of the current user", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review WHERE user = ? AND model = ?", [customer.username, products[0].model])).resolves.toBeUndefined()
    })

    test("should not delete the review of another user", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review WHERE user = ? AND model = ?", [customer.username, products[0].model])).resolves.toEqual({ model: products[0].model, user: customer.username, score: 5, comment: "comment1", date: "2021-01-01" })
    })

    test("should not delete the review on another product", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[1].model)
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review WHERE user = ? AND model = ?", [customer.username, products[0].model])).resolves.toEqual({ model: products[0].model, user: customer.username, score: 5, comment: "comment1", date: "2021-01-01" })
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a manager", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is an admin", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("should return 404 if the product does not exist", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/nonexistent")
        expect(response.status).toBe(404)
    })

    test("should return 404 if the user has not reviewed the product", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[1].model)
        expect(response.status).toBe(404)
    })
})

describe("DELETE /reviews/:model/all", () => {
    beforeEach(async () => {
        await insertReviews()
    })

    test("should delete all reviews of the product", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model + "/all")
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review WHERE model = ?", [products[0].model])).resolves.toBeUndefined()
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model + "/all")
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a customer", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model + "/all")
        expect(response.status).toBe(401)
    })

    test("test if user is a manager", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[0].model + "/all")
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review WHERE model = ?", [products[0].model])).resolves.toBeUndefined()
    })

    test("should return 404 if the product does not exist", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/nonexistent/all")
        expect(response.status).toBe(404)
    })

    test("should not delete reviews of another product", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL + "/" + products[1].model + "/all")
        expect(response.status).toBe(200)
        expect(dbAll("SELECT * FROM review WHERE model = ?", [products[0].model])).resolves.toEqual([{ model: products[0].model, user: customer.username, score: 5, comment: "comment1", date: "2021-01-01" }, { model: products[0].model, user: customer2.username, score: 5, comment: "comment2", date: "2022-01-01" }])
    })
})

describe("DELETE /reviews", () => {
    beforeEach(async () => {
        await insertReviews()
    })

    test("should delete all reviews", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL)
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review", [])).resolves.toBeUndefined()
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await agent.delete(reviewsBaseURL)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a customer", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test if user is a manager", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(reviewsBaseURL)
        expect(response.status).toBe(200)
        expect(dbGet("SELECT * FROM review", [])).resolves.toBeUndefined()
    })
})
