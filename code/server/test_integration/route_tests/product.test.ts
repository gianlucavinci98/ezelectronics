import { test, expect, describe, beforeAll, afterEach, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import UserDAO from "../../src/dao/userDAO"
import db from "../../src/db/db"
import { User, Role } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"
import { login, logout, dbGet, dbRun } from "../utilities"
import TestAgent from "supertest/lib/agent"

const baseURL = "/ezelectronics"
const productsBaseURL = baseURL + "/products"
const sessionsBaseURL = baseURL + "/sessions"


const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")

const agent: TestAgent = request.agent(app)

async function cleanProducts() {
    await dbRun("DELETE FROM product", [])
}


beforeAll(async () => {
    cleanup()
    const userDAO = new UserDAO()
    await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
    await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
    await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)
})

afterAll(async () => {
    cleanup()
})

afterEach(async () => {
    await logout(agent)
    await cleanProducts()
})

describe("Products registration API tests", () => {
    test("test successful", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test without login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("test with customer login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        await login(customer.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("test with admin login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        await login(admin.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(200)

        const sql = "SELECT * FROM product WHERE model = ?"
        await expect(dbGet(sql, [product.model])).resolves.toEqual(product)
    })

    test("test with empty model", async () => {
        const product = { model: "", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("test with missing model", async () => {
        const product = { category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)
    })

    test("test with wrong category", async () => {
        const product = { model: "testProduct", category: "wrong", arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("test with missing category", async () => {
        const product = { model: "testProduct", arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("quantity less than 1", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 0, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("quantity not an integer", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: "notAnInteger", sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("quantity float", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 1.5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("quantity missing", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("details missing", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("details empty", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("sellingPrice missing", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("sellingPrice less than 0", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: -1 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)
    })

    test("sellingPrice not a number", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: "notANumber" }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("arrivalDate missing", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, arrivalDate: new Date().toISOString().split('T')[0] })
    })

    test("arrivalDate null", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: null as null, details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, arrivalDate: new Date().toISOString().split('T')[0] })
    })

    test("arrivalDate not a date", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "notADate", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("arrivalDate in the future", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2050-01-01", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(400)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("arrivalDate in wrong format", async () => {
        const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "01-01-2020", details: "details", quantity: 5, sellingPrice: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("model already exists", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)

        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        expect(dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])).resolves.toBeUndefined()

        const product2 = new Product(100, product.model, Category.LAPTOP, "2021-01-01", "details2", 50)

        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL).send(product2)
        expect(response.status).toBe(409)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })
})

describe("Patch product quantity API tests", () => {
    test("test successful", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    test("test without login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10 }
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with customer login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10 }
        await login(customer.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with admin login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10 }
        await login(admin.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    test("test product not found", async () => {
        const patch = { quantity: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/notFound").send(patch)
        expect(response.status).toBe(404)
    })

    test("test quantity less than 1", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 0 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test quantity not an integer", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: "notAnInteger" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test quantity float", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 1.5 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test quantity missing", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = {}
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test quantity negative", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: -1 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with changeDate", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: "2020-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    test("test with changeDate in the future", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: "2050-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(400)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with changeDate in wrong format", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: "01-01-2020" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with changeDate not a date", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: "notADate" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with changeDate null", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: null as null }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    test("test with changeDate before product arrivalDate", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2021-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10, changeDate: "2020-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        expect(response.status).toBe(400)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })
})

describe("Patch product sell API tests", () => {
    test("test success", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    test("test product quantity is 0", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 0)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(409)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test product quantity less than requested quantity", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 10 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(409)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test without login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5 }
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with customer login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5 }
        await login(customer.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(401)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("test with admin login", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5 }
        await login(admin.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    test("quantity not an integer", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: "notAnInteger" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("quantity float", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 1.5 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("quantity missing", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = {}
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("quantity 0", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 0 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("quantity negative", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: -1 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("with selling date", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: "2020-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    test("with selling date in the future", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: "2050-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(400)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("with selling date in wrong format", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: "01-01-2020" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("with selling date not a date", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: "notADate" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(422)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("with selling date null", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: null as null }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    test("with selling date before arrival date", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2021-01-01", "details", 10)
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        const patch = { quantity: 5, sellingDate: "2020-01-01" }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        expect(response.status).toBe(400)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    test("product not found", async () => {
        const patch = { quantity: 5 }
        await login(manager.username, "password", agent)
        const response = await agent.patch(productsBaseURL + "/notFound/sell").send(patch)
        expect(response.status).toBe(404)
    })
})

describe("Get all products API tests", () => {
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 20),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 25),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 30),
    ]

    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    test("test success no grouping", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL)
        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual(expect.arrayContaining(products))
    })

    test("test without login", async () => {
        const response = await agent.get(productsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(productsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(productsBaseURL)
        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual(expect.arrayContaining(products))
    })

    test("test success with grouping by category", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=category&category=${Category.SMARTPHONE}`)
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.category === Category.SMARTPHONE)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test with category invalid", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=category&category=invalid`)
        expect(response.status).toBe(422)
    })

    test("test with missing category", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=category`)
        expect(response.status).toBe(422)
    })

    test("test with category and model", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=category&category=${Category.SMARTPHONE}&model=testProduct1`)
        expect(response.status).toBe(422)

        const response2 = await agent.get(productsBaseURL + `?grouping=model&category=${Category.SMARTPHONE}&model=testProduct1`)
        expect(response2.status).toBe(422)
    })

    test("test with grouping invalid", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=invalid`)
        expect(response.status).toBe(422)
    })

    test("test with grouping missing", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?category=${Category.SMARTPHONE}`)
        expect(response.status).toBe(422)

        const response2 = await agent.get(productsBaseURL + `?model=testProduct1`)
        expect(response2.status).toBe(422)
    })

    test("test success with grouping by model", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=model&model=testProduct1`)
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.model === "testProduct1")

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test with model missing", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=model`)
        expect(response.status).toBe(422)
    })

    test("test missing product", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + `?grouping=model&model=testProductNotExists`)
        expect(response.status).toBe(404)
    })
})

describe("Get available products API tests", () => {
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 0),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 0),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 0),
    ]

    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    test("test success no grouping", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available")
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.quantity > 0)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test without login", async () => {
        const response = await agent.get(productsBaseURL + "/available")
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available")
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.quantity > 0)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available")
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.quantity > 0)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test success with grouping by category", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=category&category=" + Category.SMARTPHONE)
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.category === Category.SMARTPHONE && product.quantity > 0)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test with category invalid", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=category&category=invalid")
        expect(response.status).toBe(422)
    })

    test("test with missing category", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=category")
        expect(response.status).toBe(422)
    })

    test("test with category and model", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=category&category=" + Category.SMARTPHONE + "&model=testProduct1")
        expect(response.status).toBe(422)

        const response2 = await agent.get(productsBaseURL + "/available?grouping=model&category=" + Category.SMARTPHONE + "&model=testProduct1")
        expect(response2.status).toBe(422)
    })

    test("test with grouping invalid", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=invalid")
        expect(response.status).toBe(422)
    })

    test("test with grouping missing", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?category=" + Category.SMARTPHONE)
        expect(response.status).toBe(422)

        const response2 = await agent.get(productsBaseURL + "/available?model=testProduct1")
        expect(response2.status).toBe(422)
    })

    test("test success with grouping by model", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProduct1")
        expect(response.status).toBe(200)

        const expected = products.filter(product => product.model === "testProduct1" && product.quantity > 0)

        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    test("test with model missing", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=model")
        expect(response.status).toBe(422)
    })

    test("test missing product", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProductNotExists")
        expect(response.status).toBe(404)
    })

    test("test with grouping by product and product not available", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProduct4")
        expect(response.status).toBe(404)
    })
})

describe("Delete product API tests", () => {
    let product: Product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])
    })

    test("test success", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(productsBaseURL + "/" + product.model)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    test("test without login", async () => {
        const response = await agent.delete(productsBaseURL + "/testProduct")
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(productsBaseURL + "/testProduct")
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(productsBaseURL + "/testProduct")
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT * FROM product WHERE model = ?", ["testProduct"])).resolves.toBeUndefined()
    })

    test("test product not found", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(productsBaseURL + "/notFound")
        expect(response.status).toBe(404)
    })
})

describe("Delete all products API tests", () => {
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 20),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 25),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 30),
    ]

    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    test("test success", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(productsBaseURL)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT COUNT(*) FROM product", [])).resolves.toEqual({ "COUNT(*)": 0 })
    })

    test("test without login", async () => {
        const response = await agent.delete(productsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(productsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(productsBaseURL)
        expect(response.status).toBe(200)

        await expect(dbGet("SELECT COUNT(*) FROM product", [])).resolves.toEqual({ "COUNT(*)": 0 })
    })
})
