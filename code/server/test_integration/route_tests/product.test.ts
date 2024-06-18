import { test, expect, describe, beforeAll, afterEach, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { login, logout, dbGet, dbRun, cleanup } from "../utilities"
import TestAgent from "supertest/lib/agent"

const baseURL = "/ezelectronics"
const productsBaseURL = baseURL + "/products"


const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")

const agent: TestAgent = request.agent(app)

async function cleanProducts() {
    await dbRun("DELETE FROM product", [])
}

beforeAll(async () => {
    await cleanup()
    const userDAO = new UserDAO()
    await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
    await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
    await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)
})

afterAll(async () => {
    await cleanup()
})

afterEach(async () => {
    await logout(agent)
    await cleanProducts()
})

// Tests for the "POST /ezelectronics/products" endpoint
describe("Products registration API tests", () => {
    // Test case for a successful product registration by a manager
    test("test successful", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a POST request to add the product
        const response = await agent.post(productsBaseURL).send(product)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)

        // Verify the product was added to the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to register a product without being logged in
    test("test without login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Send a POST request to add the product without logging in
        const response = await agent.post(productsBaseURL).send(product)
        // Check if the response status is 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Verify the product was not added to the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    // Test case for attempting to register a product with a customer login
    test("test with customer login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Log in as customer
        await login(customer.username, "password", agent)
        // Send a POST request to add the product
        const response = await agent.post(productsBaseURL).send(product)
        // Check if the response status is 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Verify the product was not added to the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    // Test case for a successful product registration by an admin
    test("test with admin login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Log in as admin
        await login(admin.username, "password", agent)
        // Send a POST request to add the product
        const response = await agent.post(productsBaseURL).send(product)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)

        // Verify the product was added to the database
        const sql = "SELECT * FROM product WHERE model = ?"
        await expect(dbGet(sql, [product.model])).resolves.toEqual(product)
    })

    describe("wrong input parameters", () => {
        // Test case for attempting to register a product with an empty model field
        test("test with empty model", async () => {
            // Create a new product instance with an empty model field
            const product = { model: "", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a missing model field
        test("test with missing model", async () => {
            // Create a new product instance without a model field
            const product = { category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test case for attempting to register a product with an invalid category
        test("test with wrong category", async () => {
            // Create a new product instance with an invalid category field
            const product = { model: "testProduct", category: "wrong", arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a missing category field
        test("test with missing category", async () => {
            // Create a new product instance without a category field
            const product = { model: "testProduct", arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a quantity less than 1
        test("quantity less than 1", async () => {
            // Create a new product instance with a quantity less than 1
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 0, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a quantity that is not an integer
        test("quantity not an integer", async () => {
            // Create a new product instance with a non-integer quantity
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: "notAnInteger", sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a quantity that is a float
        test("quantity float", async () => {
            // Create a new product instance with a float quantity
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 1.5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a missing quantity field
        test("quantity missing", async () => {
            // Create a new product instance without a quantity field
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for product registration with missing details
        test("details missing", async () => {
            // Create a product with missing details and login as manager
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", quantity: 5, sellingPrice: 10 }
            await login(manager.username, "password", agent)
            // Send a POST request to register the product
            const response = await agent.post(productsBaseURL).send(product)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Expect the product not to be in the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for product registration with empty details
        test("details empty", async () => {
            // Create a product with empty details and login as manager
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "", quantity: 5, sellingPrice: 10 }
            await login(manager.username, "password", agent)
            // Send a POST request to register the product
            const response = await agent.post(productsBaseURL).send(product)
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)

            // Expect the product to be in the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
        })

        // Test case for product registration with missing selling price
        test("sellingPrice missing", async () => {
            // Create a product with missing selling price and login as manager
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5 }
            await login(manager.username, "password", agent)
            // Send a POST request to register the product
            const response = await agent.post(productsBaseURL).send(product)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Expect the product not to be in the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for product registration with selling price less than 0
        test("sellingPrice less than 0", async () => {
            // Create a product with selling price less than 0 and login as manager
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: -1 }
            await login(manager.username, "password", agent)
            // Send a POST request to register the product
            const response = await agent.post(productsBaseURL).send(product)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test case for attempting to register a product with a non-numeric selling price
        test("sellingPrice not a number", async () => {
            // Create a new product instance with a non-numeric selling price
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2020-01-01", details: "details", quantity: 5, sellingPrice: "notANumber" }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with a missing arrivalDate field
        test("arrivalDate missing", async () => {
            // Create a new product instance without an arrivalDate field
            const product = { model: "testProduct", category: Category.SMARTPHONE, details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 200 (OK)
            expect(response.status).toBe(200)

            // Verify the product was added to the database with the current date as arrivalDate
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, arrivalDate: new Date().toISOString().split('T')[0] })
        })

        // Test case for attempting to register a product with a null arrivalDate field
        test("arrivalDate null", async () => {
            // Create a new product instance with a null arrivalDate field
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: null as null, details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 200 (OK)
            expect(response.status).toBe(200)

            // Verify the product was added to the database with the current date as arrivalDate
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, arrivalDate: new Date().toISOString().split('T')[0] })
        })

        // Test case for attempting to register a product with an invalid arrivalDate field
        test("arrivalDate not a date", async () => {
            // Create a new product instance with an invalid arrivalDate field
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "notADate", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with an arrival date in the future
        test("arrivalDate in the future", async () => {
            // Create a new product instance with a future arrivalDate field
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "2050-01-01", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 400 (Bad Request)
            expect(response.status).toBe(400)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })

        // Test case for attempting to register a product with an arrival date in the wrong format
        test("arrivalDate in wrong format", async () => {
            // Create a new product instance with an invalid arrivalDate format
            const product = { model: "testProduct", category: Category.SMARTPHONE, arrivalDate: "01-01-2020", details: "details", quantity: 5, sellingPrice: 10 }
            // Log in as manager
            await login(manager.username, "password", agent)
            // Send a POST request to add the product
            const response = await agent.post(productsBaseURL).send(product)
            // Check if the response status is 422 (Unprocessable Entity)
            expect(response.status).toBe(422)

            // Verify the product was not added to the database
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
        })
    })

    // Test case for attempting to register a product with a model that already exists in the database
    test("model already exists", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)

        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        expect(dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])).resolves.toBeUndefined()

        // Create a new product instance with the same model but different details
        const product2 = new Product(100, product.model, Category.LAPTOP, "2021-01-01", "details2", 50)

        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a POST request to add the product
        const response = await agent.post(productsBaseURL).send(product2)
        // Check if the response status is 409 (Conflict)
        expect(response.status).toBe(409)

        // Verify the original product remains in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })
})

// Tests for the "PATCH /ezelectronics/products/:model" endpoint
describe("Patch product quantity API tests", () => {
    // Test case for successful product quantity patch
    test("test successful", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object to update the quantity
        const patch = { quantity: 10 }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)
        // Check if the response body contains the updated quantity
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        // Verify the product's quantity was updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    // Test case for patching product quantity without logging in
    test("test without login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object to update the quantity
        const patch = { quantity: 10 }
        // Send a PATCH request without logging in
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for patching product quantity with customer login
    test("test with customer login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object to update the quantity
        const patch = { quantity: 10 }
        // Log in as customer
        await login(customer.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for patching product quantity with admin login
    test("test with admin login", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object to update the quantity
        const patch = { quantity: 10 }
        // Log in as admin
        await login(admin.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)
        // Check if the response body contains the updated quantity
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        // Verify the product's quantity was updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    // Test case for attempting to patch a product that does not exist
    test("test product not found", async () => {
        // Create a patch object to update the quantity
        const patch = { quantity: 10 }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to a non-existent product
        const response = await agent.patch(productsBaseURL + "/notFound").send(patch)
        // Check if the response status is 404 (Not Found)
        expect(response.status).toBe(404)
    })

    // Test case for attempting to patch product quantity with a value less than 1
    test("test quantity less than 1", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with an invalid quantity (less than 1)
        const patch = { quantity: 0 }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a non-integer value
    test("test quantity not an integer", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a non-integer quantity
        const patch = { quantity: "notAnInteger" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a float value
    test("test quantity float", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a float quantity
        const patch = { quantity: 1.5 }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a missing quantity field
    test("test quantity missing", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object without the quantity field
        const patch = {}
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a negative value
    test("test quantity negative", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a negative quantity
        const patch = { quantity: -1 }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a valid changeDate
    test("test with changeDate", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a valid changeDate
        const patch = { quantity: 10, changeDate: "2020-01-01" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)
        // Check if the response body contains the updated quantity
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        // Verify the product's quantity was updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    // Test case for attempting to patch product quantity with a future changeDate
    test("test with changeDate in the future", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a future changeDate
        const patch = { quantity: 10, changeDate: "2050-01-01" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 400 (Bad Request)
        expect(response.status).toBe(400)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a changeDate in the wrong format
    test("test with changeDate in wrong format", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a changeDate in the wrong format
        const patch = { quantity: 10, changeDate: "01-01-2020" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a changeDate that is not a date
    test("test with changeDate not a date", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a non-date changeDate
        const patch = { quantity: 10, changeDate: "notADate" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test case for attempting to patch product quantity with a null changeDate
    test("test with changeDate null", async () => {
        // Create a new product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a null changeDate
        const patch = { quantity: 10, changeDate: null as null }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 200 (OK)
        expect(response.status).toBe(200)
        // Check if the response body contains the updated quantity
        expect(response.body).toEqual({ quantity: product.quantity + patch.quantity })

        // Verify the product's quantity was updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity + patch.quantity })
    })

    // Test case for attempting to patch product quantity with a changeDate before the product's arrival date
    test("test with changeDate before product arrivalDate", async () => {
        // Create a new product instance with a later arrival date
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2021-01-01", "details", 5)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Create a patch object with a changeDate before the product's arrival date
        const patch = { quantity: 10, changeDate: "2020-01-01" }
        // Log in as manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to update the product quantity
        const response = await agent.patch(productsBaseURL + "/" + product.model).send(patch)
        // Check if the response status is 400 (Bad Request)
        expect(response.status).toBe(400)

        // Verify the product's quantity was not updated in the database
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })
})

// Tests for the "PATCH /ezelectronics/products/:model/sell" endpoint
describe("Patch product sell API tests", () => {
    // Test for successfully selling a product
    test("test success", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // SQL query to insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        // Execute the SQL query
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define the quantity to be sold
        const patch = { quantity: 5 }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a PATCH request to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to reflect the updated quantity
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    describe("unavailable", () => {
        // Test for selling a product with quantity 0
        test("test product quantity is 0", async () => {
            // Create a product instance with quantity 0
            const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 0)
            // Insert the product into the database
            const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
            await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

            // Define the quantity to be sold
            const patch = { quantity: 5 }
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Attempt to sell the product
            const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
            // Expect the response status to be 409 (Conflict)
            expect(response.status).toBe(409)

            // Expect the database entry to remain unchanged
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
        })

        // Test for selling a product with quantity less than requested quantity
        test("test product quantity less than requested quantity", async () => {
            // Create a product instance with quantity 5
            const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
            // Insert the product into the database
            const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
            await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

            // Define the quantity to be sold (more than available)
            const patch = { quantity: 10 }
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Attempt to sell the product
            const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
            // Expect the response status to be 409 (Conflict)
            expect(response.status).toBe(409)

            // Expect the database entry to remain unchanged
            await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
        })
    })

    // Test for attempting to sell a product without logging in
    test("test without login", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define the quantity to be sold
        const patch = { quantity: 5 }
        // Attempt to sell the product without logging in
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for attempting to sell a product with customer login
    test("test with customer login", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define the quantity to be sold
        const patch = { quantity: 5 }
        // Log in as a customer
        await login(customer.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for successfully selling a product with admin login
    test("test with admin login", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define the quantity to be sold
        const patch = { quantity: 5 }
        // Log in as an admin
        await login(admin.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to reflect the updated quantity
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    // Test for selling a product with a non-integer quantity
    test("quantity not an integer", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a non-integer quantity to be sold
        const patch = { quantity: "notAnInteger" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with a float quantity
    test("quantity float", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a float quantity to be sold
        const patch = { quantity: 1.5 }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with missing quantity
    test("quantity missing", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object without quantity
        const patch = {}
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with quantity 0
    test("quantity 0", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity 0
        const patch = { quantity: 0 }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with negative quantity
    test("quantity negative", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with negative quantity
        const patch = { quantity: -1 }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with a selling date
    test("with selling date", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and selling date
        const patch = { quantity: 5, sellingDate: "2020-01-01" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to reflect the updated quantity
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    // Test for selling a product with a selling date in the future
    test("with selling date in the future", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and a future selling date
        const patch = { quantity: 5, sellingDate: "2050-01-01" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(400)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with a selling date in the wrong format
    test("with selling date in wrong format", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and a selling date in the wrong format
        const patch = { quantity: 5, sellingDate: "01-01-2020" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with a non-date selling date
    test("with selling date not a date", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and a non-date selling date
        const patch = { quantity: 5, sellingDate: "notADate" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product with a null selling date
    test("with selling date null", async () => {
        // Create a product instance
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and a null selling date
        const patch = { quantity: 5, sellingDate: null as null }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to reflect the updated quantity
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual({ ...product, quantity: product.quantity - patch.quantity })
    })

    // Test for selling a product with a selling date before the product's arrival date
    test("with selling date before arrival date", async () => {
        // Create a product instance with a later arrival date
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2021-01-01", "details", 10)
        // Insert the product into the database
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])

        // Define a patch object with quantity and a selling date before the product's arrival date
        const patch = { quantity: 5, sellingDate: "2020-01-01" }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell the product
        const response = await agent.patch(productsBaseURL + `/${product.model}/sell`).send(patch)
        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(400)

        // Expect the database entry to remain unchanged
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toEqual(product)
    })

    // Test for selling a product that does not exist
    test("product not found", async () => {
        // Define a patch object with quantity
        const patch = { quantity: 5 }
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Attempt to sell a non-existent product
        const response = await agent.patch(productsBaseURL + "/notFound/sell").send(patch)
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })
})

// Tests for the "GET /ezelectronics/products" endpoint
describe("Get all products API tests", () => {
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 20),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 25),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 30),
    ]

    // Before each test, insert products into the database
    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    // Test for retrieving all products successfully without grouping
    test("test success no grouping", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve all products
        const response = await agent.get(productsBaseURL)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Expect the response body to contain all products
        expect(response.body).toStrictEqual(expect.arrayContaining(products))
    })

    // Test for retrieving products without logging in
    test("test without login", async () => {
        // Send a GET request to retrieve all products without logging in
        const response = await agent.get(productsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for retrieving products with customer login
    test("test with customer login", async () => {
        // Log in as a customer
        await login(customer.username, "password", agent)
        // Send a GET request to retrieve all products
        const response = await agent.get(productsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for retrieving products with admin login
    test("test with admin login", async () => {
        // Log in as an admin
        await login(admin.username, "password", agent)
        // Send a GET request to retrieve all products
        const response = await agent.get(productsBaseURL)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Expect the response body to contain all products
        expect(response.body).toStrictEqual(expect.arrayContaining(products))
    })

    describe("grouping by category", () => {
        // Test for retrieving products successfully with grouping by category
        test("test success with grouping by category", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve products grouped by category
            const response = await agent.get(productsBaseURL + `?grouping=category&category=${Category.SMARTPHONE}`)
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)

            // Filter expected products by category
            const expected = products.filter(product => product.category === Category.SMARTPHONE)

            // Expect the response body to contain products of the specified category
            expect(response.body).toStrictEqual(expect.arrayContaining(expected))
        })

        // Test for retrieving products with an invalid category
        test("test with category invalid", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve products with an invalid category
            const response = await agent.get(productsBaseURL + `?grouping=category&category=invalid`)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test for retrieving products with missing category
        test("test with missing category", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve products with missing category
            const response = await agent.get(productsBaseURL + `?grouping=category`)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })
    })

    describe("grouping by model", () => {
        // Test for retrieving products successfully with grouping by model
        test("test success with grouping by model", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve products grouped by model
            const response = await agent.get(productsBaseURL + `?grouping=model&model=testProduct1`)
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)

            // Filter expected products by model
            const expected = products.filter(product => product.model === "testProduct1")

            // Expect the response body to contain products with the specified model
            expect(response.body).toStrictEqual(expect.arrayContaining(expected))
        })

        // Test for retrieving products with missing model
        test("test with model missing", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve products with missing model
            const response = await agent.get(productsBaseURL + `?grouping=model`)
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test for retrieving missing product
        test("test missing product", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve a missing product
            const response = await agent.get(productsBaseURL + `?grouping=model&model=testProductNotExists`)
            // Expect the response status to be 404 (Not Found)
            expect(response.status).toBe(404)
        })
    })

    // Test for retrieving products with category and model
    test("test with category and model", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve products with category and model
        const response = await agent.get(productsBaseURL + `?grouping=category&category=${Category.SMARTPHONE}&model=testProduct1`)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Send another GET request to retrieve products with category and model
        const response2 = await agent.get(productsBaseURL + `?grouping=model&category=${Category.SMARTPHONE}&model=testProduct1`)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response2.status).toBe(422)
    })

    // Test for retrieving products with invalid grouping
    test("test with grouping invalid", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve products with invalid grouping
        const response = await agent.get(productsBaseURL + `?grouping=invalid`)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)
    })

    // Test for retrieving products with missing grouping
    test("test with grouping missing", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve products with missing grouping
        const response = await agent.get(productsBaseURL + `?category=${Category.SMARTPHONE}`)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Send another GET request to retrieve products with missing grouping
        const response2 = await agent.get(productsBaseURL + `?model=testProduct1`)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response2.status).toBe(422)
    })
})

// Tests for the "GET /ezelectronics/products/available" endpoint
describe("Get available products API tests", () => {
    // Array of test products
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 0),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 0),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 0),
    ]

    // Insert test products before each test
    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    // Test for retrieving available products without grouping
    test("test success no grouping", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve available products
        const response = await agent.get(productsBaseURL + "/available")
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Filter expected products with quantity greater than 0
        const expected = products.filter(product => product.quantity > 0)

        // Expect the response body to contain available products
        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    // Test for retrieving available products without login
    test("test without login", async () => {
        // Send a GET request to retrieve available products without login
        const response = await agent.get(productsBaseURL + "/available")
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for retrieving available products with customer login
    test("test with customer login", async () => {
        // Log in as a customer
        await login(customer.username, "password", agent)
        // Send a GET request to retrieve available products
        const response = await agent.get(productsBaseURL + "/available")
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Filter expected products with quantity greater than 0
        const expected = products.filter(product => product.quantity > 0)

        // Expect the response body to contain available products
        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    // Test for retrieving available products with admin login
    test("test with admin login", async () => {
        // Log in as an admin
        await login(admin.username, "password", agent)
        // Send a GET request to retrieve available products
        const response = await agent.get(productsBaseURL + "/available")
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Filter expected products with quantity greater than 0
        const expected = products.filter(product => product.quantity > 0)

        // Expect the response body to contain available products
        expect(response.body).toStrictEqual(expect.arrayContaining(expected))
    })

    describe("grouping by category", () => {
        // Test for retrieving available products grouped by category
        test("test success with grouping by category", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products grouped by category
            const response = await agent.get(productsBaseURL + "/available?grouping=category&category=" + Category.SMARTPHONE)
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)

            // Filter expected products with category SMARTPHONE and quantity greater than 0
            const expected = products.filter(product => product.category === Category.SMARTPHONE && product.quantity > 0)

            // Expect the response body to contain available products with category SMARTPHONE
            expect(response.body).toStrictEqual(expect.arrayContaining(expected))
        })

        // Test for retrieving available products with invalid category
        test("test with category invalid", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products with invalid category
            const response = await agent.get(productsBaseURL + "/available?grouping=category&category=invalid")
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test for retrieving available products with missing category
        test("test with missing category", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products with missing category
            const response = await agent.get(productsBaseURL + "/available?grouping=category")
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })
    })

    describe("grouping by model", () => {
        // Test for retrieving available products grouped by model
        test("test success with grouping by model", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products grouped by model
            const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProduct1")
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)

            // Filter expected products with model "testProduct1" and quantity greater than 0
            const expected = products.filter(product => product.model === "testProduct1" && product.quantity > 0)

            // Expect the response body to contain available products with model "testProduct1"
            expect(response.body).toStrictEqual(expect.arrayContaining(expected))
        })

        // Test for retrieving available products with missing model
        test("test with model missing", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products with missing model
            const response = await agent.get(productsBaseURL + "/available?grouping=model")
            // Expect the response status to be 422 (Unprocessable Entity)
            expect(response.status).toBe(422)
        })

        // Test for retrieving missing product
        test("test missing product", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products with missing model
            const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProductNotExists")
            // Expect the response status to be 404 (Not Found)
            expect(response.status).toBe(404)
        })

        // Test for retrieving available products grouped by model with product not available
        test("test with grouping by product and product not available", async () => {
            // Log in as a manager
            await login(manager.username, "password", agent)
            // Send a GET request to retrieve available products with model "testProduct4" (not available)
            const response = await agent.get(productsBaseURL + "/available?grouping=model&model=testProduct4")
            // Expect the response status to be 200 (OK)
            expect(response.status).toBe(200)
        })
    })

    // Test for retrieving available products with category and model
    test("test with category and model", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve available products with category and model
        const response = await agent.get(productsBaseURL + "/available?grouping=category&category=" + Category.SMARTPHONE + "&model=testProduct1")
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Send a GET request to retrieve available products with model and category
        const response2 = await agent.get(productsBaseURL + "/available?grouping=model&category=" + Category.SMARTPHONE + "&model=testProduct1")
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response2.status).toBe(422)
    })

    // Test for retrieving available products with invalid grouping
    test("test with grouping invalid", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve available products with invalid grouping
        const response = await agent.get(productsBaseURL + "/available?grouping=invalid")
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)
    })

    // Test for retrieving available products with missing grouping
    test("test with grouping missing", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a GET request to retrieve available products with missing grouping and category
        const response = await agent.get(productsBaseURL + "/available?category=" + Category.SMARTPHONE)
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)

        // Send a GET request to retrieve available products with missing grouping and model
        const response2 = await agent.get(productsBaseURL + "/available?model=testProduct1")
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response2.status).toBe(422)
    })
})

// Tests for the "DELETE /ezelectronics/products/:model" endpoint
describe("Delete product API tests", () => {
    // Define a sample product for testing
    let product: Product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)

    // Before each test, insert the sample product into the database
    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await dbRun(sql, [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice])
    })

    // Test for successfully deleting a product
    test("test success", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a DELETE request to delete the sample product
        const response = await agent.delete(productsBaseURL + "/" + product.model)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to not contain the deleted product
        await expect(dbGet("SELECT * FROM product WHERE model = ?", [product.model])).resolves.toBeUndefined()
    })

    // Test for deleting a product without logging in
    test("test without login", async () => {
        // Send a DELETE request to delete a product without logging in
        const response = await agent.delete(productsBaseURL + "/testProduct")
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for deleting a product with customer login
    test("test with customer login", async () => {
        // Log in as a customer
        await login(customer.username, "password", agent)
        // Send a DELETE request to delete a product
        const response = await agent.delete(productsBaseURL + "/testProduct")
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for deleting a product with admin login
    test("test with admin login", async () => {
        // Log in as an admin
        await login(admin.username, "password", agent)
        // Send a DELETE request to delete a product
        const response = await agent.delete(productsBaseURL + "/testProduct")
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to not contain the deleted product
        await expect(dbGet("SELECT * FROM product WHERE model = ?", ["testProduct"])).resolves.toBeUndefined()
    })

    // Test for deleting a product that is not found
    test("test product not found", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a DELETE request to delete a product that does not exist
        const response = await agent.delete(productsBaseURL + "/notFound")
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })
})

// Tests for the "DELETE /ezelectronics/products" endpoint
describe("Delete all products API tests", () => {
    // Define an array of sample products for testing
    let products: Product[] = [
        new Product(10, "testProduct1", Category.SMARTPHONE, "2020-01-01", "details1", 5),
        new Product(20, "testProduct2", Category.LAPTOP, "2020-01-01", "details2", 10),
        new Product(30, "testProduct3", Category.APPLIANCE, "2020-01-01", "details3", 15),
        new Product(40, "testProduct4", Category.SMARTPHONE, "2020-01-01", "details4", 20),
        new Product(50, "testProduct5", Category.LAPTOP, "2020-01-01", "details5", 25),
        new Product(60, "testProduct6", Category.APPLIANCE, "2020-01-01", "details6", 30),
    ]

    // Before each test, insert the sample products into the database
    beforeEach(async () => {
        const sql = "INSERT INTO product(model, category, arrivalDate, details, quantity, sellingPrice) VALUES (?, ?, ?, ?, ?, ?)"
        await Promise.all(
            products.map(product => dbRun(
                sql,
                [product.model, product.category, product.arrivalDate, product.details, product.quantity, product.sellingPrice]
            ))
        )
    })

    // Test for successfully deleting all products
    test("test success", async () => {
        // Log in as a manager
        await login(manager.username, "password", agent)
        // Send a DELETE request to delete all products
        const response = await agent.delete(productsBaseURL)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to contain no products after deletion
        await expect(dbGet("SELECT COUNT(*) FROM product", [])).resolves.toEqual({ "COUNT(*)": 0 })
    })

    // Test for deleting all products without logging in
    test("test without login", async () => {
        // Send a DELETE request to delete all products without logging in
        const response = await agent.delete(productsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for deleting all products with customer login
    test("test with customer login", async () => {
        // Log in as a customer
        await login(customer.username, "password", agent)
        // Send a DELETE request to delete all products
        const response = await agent.delete(productsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test for deleting all products with admin login
    test("test with admin login", async () => {
        // Log in as an admin
        await login(admin.username, "password", agent)
        // Send a DELETE request to delete all products
        const response = await agent.delete(productsBaseURL)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)

        // Expect the database to contain no products after deletion
        await expect(dbGet("SELECT COUNT(*) FROM product", [])).resolves.toEqual({ "COUNT(*)": 0 })
    })
})
