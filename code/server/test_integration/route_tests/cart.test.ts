import { test, expect, describe, beforeAll, afterEach, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import TestAgent from "supertest/lib/agent"

import { app } from "../../index"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"
import { login, logout, dbGet, dbRun, dbAll } from "../utilities"


const baseURL = "/ezelectronics"
const cartsBaseURL = baseURL + "/carts"

const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const customer2: User = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "customer", "2021-01-02")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")
const products: Product[] = [
    new Product(10, "product1", Category.SMARTPHONE, "2020-01-01", "details", 10),
    new Product(20, "product2", Category.LAPTOP, "2020-01-01", "details", 20),
    new Product(30, "product3", Category.APPLIANCE, "2020-01-01", "details", 30),
    new Product(40, "product4", Category.SMARTPHONE, "2020-01-01", "details", 0),
]

const agent: TestAgent = request.agent(app)

async function cleanDB() {
    await dbRun("DELETE FROM cart_items", [])
    await dbRun("DELETE FROM cart", [])
}

beforeAll(async () => {
    cleanup()
    const userDAO = new UserDAO()
    await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
    await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
    await userDAO.createUser(customer2.username, customer2.name, customer2.surname, "password", customer2.role)
    await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)
    await Promise.all(products.map((product) => {
        dbRun(
            "INSERT INTO products (model, sellingPrice, arrivalDate, details, quantity, category) VALUES (?, ?, ?, ?, ?, ?)",
            [product.model, product.sellingPrice, product.arrivalDate, product.details, product.quantity, product.category]
        )
    }))
})

afterAll(async () => {
    cleanup()
})

afterEach(async () => {
    await logout(agent)
    await cleanDB()
})

// Test suite for the "GET /ezelectronics/carts" endpoint
describe("Get current cart", () => {
    // Define variables for cart IDs
    let cart_id_customer: number
    let cart_id_customer2: number

    // Before each test, setup the database with some initial data
    beforeEach(async () => {
        // Insert two carts into the database
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer2.username, products[1].sellingPrice + products[2].sellingPrice * 2])

        // Get the IDs of the inserted carts
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer2.username]) as { id: number }).id

        // Insert items into the carts
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer2, products[1].model, 1, products[1].category, products[1].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer2, products[2].model, 2, products[2].category, products[2].sellingPrice]
        )
    })

    // Test getting the current cart of a customer
    test("Get current cart of customer successful", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is successful and the cart data is correct
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: products[0].sellingPrice,
            products: [
                {
                    model: products[0].model,
                    quantity: 1,
                    category: products[0].category,
                    price: products[0].sellingPrice
                }
            ]
        })
    })

    // Test getting the current cart without logging in
    test("test with no login", async () => {
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is unauthorized
        expect(response.status).toBe(401)
    })

    // Test getting the current cart as a manager
    test("test with manager login", async () => {
        // Login as the manager
        await login(manager.username, "password", agent)
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is unauthorized
        expect(response.status).toBe(401)
    })

    // Test getting the current cart as an admin
    test("test with admin login", async () => {
        // Login as the admin
        await login(admin.username, "password", agent)
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is unauthorized
        expect(response.status).toBe(401)
    })

    // Test getting the current cart with multiple items
    test("test multiple items in cart", async () => {
        // Login as the second customer
        await login(customer2.username, "password", agent)
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is successful and the cart data is correct
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer2.username,
            paid: false,
            paymentDate: null,
            total: products[1].sellingPrice + products[2].sellingPrice * 2,
            products: expect.arrayContaining([
                {
                    model: products[1].model,
                    quantity: 1,
                    category: products[1].category,
                    price: products[1].sellingPrice
                },
                {
                    model: products[2].model,
                    quantity: 2,
                    category: products[2].category,
                    price: products[2].sellingPrice
                }
            ])
        })
    })

    // Test getting an empty cart
    test("test empty cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Empty the cart
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        await dbRun("UPDATE cart SET total = 0 WHERE id = ?", [cart_id_customer])
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is successful and the cart data is correct
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        })
    })

    // Test getting a paid cart
    test("test with paid cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Mark the cart as paid
        await dbRun("UPDATE cart SET paid = true WHERE id = ?", [cart_id_customer])
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is successful and the cart data is correct
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        })
    })

    // Test getting a cart when there is no open cart
    test("test with no open cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Delete the cart
        await dbRun("DELETE FROM cart WHERE customer = ?", [customer.username])
        // Get the current cart
        const response = await agent.get(cartsBaseURL)
        // Check that the response is successful and the cart data is correct
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        })
    })
})

// This is a test suite for the "POST /ezelectronics/carts" endpoint
describe("Post product add to cart", () => {
    // Variable to store the cart id of the customer
    let cart_id_customer: number

    // Before each test, we setup the database with a cart and a cart item
    beforeEach(async () => {
        // Insert a cart for the customer with a total equal to the selling price of the first product
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])

        // Get the id of the cart we just created
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert a cart item for the cart we just created
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    test("Add product to existing cart successfully", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a post request to add the second product to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Get all cart items for the customer's cart
        const cart_items = await dbAll("SELECT * FROM cart_items WHERE cart = ?", [cart_id_customer])
        // Expect the cart items to contain the first and second product
        expect(cart_items).toEqual(expect.arrayContaining(
            [
                {
                    cart: cart_id_customer,
                    model: products[0].model,
                    quantity: 1,
                    category: products[0].category,
                    price: products[0].sellingPrice
                },
                {
                    cart: cart_id_customer,
                    model: products[1].model,
                    quantity: 1,
                    category: products[1].category,
                    price: products[1].sellingPrice
                }
            ]
        ))
        // Get the total of the cart
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        // Expect the total to be close to the sum of the selling prices of the first and second product
        expect(cart_total).toEqual(expect.closeTo(products[0].sellingPrice + products[1].sellingPrice))
    })

    // Test case: Attempt to add product to cart without being logged in
    test("test with no login", async () => {
        // Send a post request to add the second product to the cart without logging in
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case: Attempt to add product to cart with manager login
    test("test with manager login", async () => {
        // Login as the manager
        await login(manager.username, "password", agent)
        // Send a post request to add the second product to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case: Attempt to add product to cart with admin login
    test("test with admin login", async () => {
        // Login as the admin
        await login(admin.username, "password", agent)
        // Send a post request to add the second product to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case: Add product to cart when cart does not exist
    test("test with missing cart", async () => {
        // Login as a different customer
        await login(customer2.username, "password", agent)
        // Expect the count of carts for this customer to be 0
        await expect(dbGet("SELECT COUNT(*) FROM cart WHERE customer = ? AND paid = false", [customer2.username])).resolves.toEqual({ "COUNT(*)": 0 })
        // Send a post request to add the second product to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Expect the count of carts for this customer to be 1
        await expect(dbGet("SELECT COUNT(*) FROM cart WHERE customer = ? AND paid = false", [customer2.username])).resolves.toEqual({ "COUNT(*)": 1 })
        // Get the total of the cart
        const total = (await dbGet("SELECT total FROM cart WHERE customer = ? AND paid = false", [customer2.username]) as { total: number }).total
        // Expect the total to be equal to the selling price of the second product
        expect(total).toEqual(products[1].sellingPrice)
    })

    // Test case: Attempt to add invalid product to cart
    test("test with invalid product", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a post request to add an invalid product to the cart
        const response = await agent.post(cartsBaseURL).send({ model: "invalid" })
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })

    // Test case: Attempt to add product to cart with empty model
    test("test with empty model", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a post request to add a product with empty model to the cart
        const response = await agent.post(cartsBaseURL).send({ model: "" })
        // Expect the response status to be 422 (Unprocessable Entity)
        expect(response.status).toBe(422)
    })

    // Test case: Attempt to add product with no quantity to cart
    test("test with product with no quantity", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a post request to add the fourth product (which has no quantity) to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[3].model })
        // Expect the response status to be 409 (Conflict)
        expect(response.status).toBe(409)
        // Expect the count of cart items for this product to be 0
        await expect(dbGet(
            "SELECT COUNT(*) FROM cart_items WHERE cart = ? AND model = ?",
            [cart_id_customer, products[3].model]
        )).resolves.toEqual({ "COUNT(*)": 0 })
    })

    // Test case: Add product that is already in cart
    test("test with product already in cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a post request to add the first product (which is already in the cart) to the cart
        const response = await agent.post(cartsBaseURL).send({ model: products[0].model })
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Get all cart items for the customer's cart
        const cart_items = await dbAll("SELECT * FROM cart_items WHERE cart = ?", [cart_id_customer])
        // Expect the cart items to contain the first product with quantity 2
        expect(cart_items).toEqual(
            [
                {
                    cart: cart_id_customer,
                    model: products[0].model,
                    quantity: 2,
                    category: products[0].category,
                    price: products[0].sellingPrice
                }
            ]
        )
        // Get the total of the cart
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        // Expect the total to be close to twice the selling price of the first product
        expect(cart_total).toEqual(expect.closeTo(products[0].sellingPrice * 2))
    })
})

// This is a test suite for the "PATCH /ezelectronics/carts" endpoint
describe("Patch checkout cart", () => {
    // Variable to store the cart id of the customer
    let cart_id_customer: number

    // Before each test, we setup the database with some initial data
    beforeEach(async () => {
        // Insert two carts for two different customers
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice, products[1].sellingPrice * 2])
        await dbRun("INSERT INTO cart (customer) VALUES (?)", [customer2.username])

        // Get the id of the cart of the first customer
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert two items into the cart of the first customer
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[1].model, 2, products[1].category, products[1].sellingPrice]
        )
    })

    // Test case for successful checkout
    test("Checkout cart successfully", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 200 (OK)
        expect(response.status).toBe(200)
        // Fetch the cart from the database
        const cart = await dbGet("SELECT * FROM cart WHERE id = ?", [cart_id_customer])
        // Expect the cart to be marked as paid and the total to be correct
        expect(cart).toEqual({
            id: cart_id_customer,
            customer: customer.username,
            paid: true,
            paymentDate: new Date().toISOString().split("T")[0],
            total: products[0].sellingPrice + products[1].sellingPrice * 2
        })
        // Fetch the quantities of the products from the database
        const product0_quantity = (await dbGet("SELECT quantity FROM product WHERE model = ?", [products[0].model]) as { quantity: number }).quantity
        // Expect the quantities to be decreased by the quantities bought
        expect(product0_quantity).toBe(products[0].quantity - 1)
        const product1_quantity = (await dbGet("SELECT quantity FROM product WHERE model = ?", [products[1].model]) as { quantity: number }).quantity
        expect(product1_quantity).toBe(products[1].quantity - 2)
    })

    // Test case for checkout without login
    test("test with no login", async () => {
        // Send a patch request to checkout the cart without logging in
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case for checkout with manager login
    test("test with manager login", async () => {
        // Login as the manager
        await login(manager.username, "password", agent)
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case for checkout with admin login
    test("test with admin login", async () => {
        // Login as the admin
        await login(admin.username, "password", agent)
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test case for checkout with empty cart
    test("test with empty cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Delete all items from the cart
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(400)
        // Fetch the paid status of the cart from the database
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        // Expect the cart to not be marked as paid
        expect(paid).toBe(false)
    })

    // Test case for checkout with missing cart
    test("test with missing cart", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Delete the cart
        await dbRun("DELETE FROM cart WHERE customer = ?", [customer.username])
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })

    // Test case for checkout with product with 0 available quantity
    test("test with product with 0 available quantity", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Insert a product with 0 quantity into the cart
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[4].model, 1, products[4].category, products[4].sellingPrice]
        )
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 409 (Conflict)
        expect(response.status).toBe(409)
        // Fetch the paid status of the cart from the database
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        // Expect the cart to not be marked as paid
        expect(paid).toBe(false)
    })

    // Test case for checkout with product with insufficient quantity
    test("test with product with insufficient quantity", async () => {
        // Login as the customer
        await login(customer.username, "password", agent)
        // Update the quantity of a product in the cart to be more than the available quantity
        await dbRun(
            "UPDATE cart_items SET quantity = ? WHERE cart = ? AND model = ?",
            [products[1].quantity + 1, cart_id_customer, products[1].model]
        )
        // Send a patch request to checkout the cart
        const response = await agent.patch(cartsBaseURL)
        // Expect the response status to be 409 (Conflict)
        expect(response.status).toBe(409)
        // Fetch the paid status of the cart from the database
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        // Expect the cart to not be marked as paid
        expect(paid).toBe(false)
    })
})

// This is a test suite for the "GET /ezelectronics/carts/history" endpoint
describe("Get cart history", () => {
    // Define variables for cart IDs
    let cart_id1: number
    let cart_id2: number
    let cart_id_open: number

    // Before each test, set up the database with some test data
    beforeEach(async () => {
        // Insert a paid cart for the customer
        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        // Get the ID of the inserted cart
        cart_id1 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

        // Insert another paid cart for the customer
        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[1].sellingPrice + products[2].sellingPrice * 2, new Date().toISOString().split("T")[0]]
        )
        // Get the ID of the second inserted cart
        cart_id2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true AND id <> ?", [customer.username, cart_id1]) as { id: number }).id

        // Insert an open (unpaid) cart for the customer
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        // Get the ID of the open cart
        cart_id_open = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert items into the carts
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id1, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id2, products[1].model, 1, products[1].category, products[1].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id2, products[2].model, 2, products[2].category, products[2].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_open, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    // Test that a logged in customer can get their cart history successfully
    test("Get cart history successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.arrayContaining([
            // Expect the response to contain the details of the paid carts
            {
                customer: customer.username,
                paid: true,
                total: products[0].sellingPrice,
                paymentDate: new Date().toISOString().split("T")[0],
                products: [
                    {
                        model: products[0].model,
                        quantity: 1,
                        category: products[0].category,
                        price: products[0].sellingPrice
                    }
                ]
            },
            {
                customer: customer.username,
                paid: true,
                total: products[1].sellingPrice + products[2].sellingPrice * 2,
                paymentDate: new Date().toISOString().split("T")[0],
                products: expect.arrayContaining([
                    {
                        model: products[1].model,
                        quantity: 1,
                        category: products[1].category,
                        price: products[1].sellingPrice
                    },
                    {
                        model: products[2].model,
                        quantity: 2,
                        category: products[2].category,
                        price: products[2].sellingPrice
                    }
                ])
            }
        ]))
    })

    // Test that a user who is not logged in cannot get cart history
    test("test with no login", async () => {
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    // Test that a manager cannot get cart history
    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    // Test that an admin cannot get cart history
    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    // Test that a customer with no cart history gets an empty response
    test("test with no cart history", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(200)
        // Expect the response to be an empty array
        expect(response.body).toEqual([])
    })
})

// This is a test suite for the "DELETE /ezelectronics/carts/products/:model" endpoint
describe("Delete product from cart", () => {
    // Define a variable for the customer's cart ID
    let cart_id_customer: number

    // Before each test, set up the database with some test data
    beforeEach(async () => {
        // Insert a cart for the customer
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        // Get the ID of the inserted cart
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert an item into the cart
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    // Test that a logged in customer can delete a product from their cart successfully
    test("Delete product from cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(200)
        // Check that the product has been removed from the cart
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items WHERE cart = ?", [cart_id_customer])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
        // Check that the total price of the cart has been updated
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        expect(cart_total).toBe(0)
    })

    // Test that a user who is not logged in cannot delete a product from a cart
    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(401)
    })

    // Test that a manager cannot delete a product from a cart
    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(401)
    })

    // Test that an admin cannot delete a product from a cart
    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        // Expect the response status to be 401 (Unauthorized)
        expect(response.status).toBe(401)
    })

    // Test that a customer cannot delete a product that is not in their cart
    test("test with product not in cart", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[1].model)
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })

    // Test that a customer cannot delete a product from an empty cart
    test("test with empty cart", async () => {
        await login(customer.username, "password", agent)
        // Remove all items from the cart
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)

        // Delete the cart
        await dbRun("DELETE FROM cart WHERE id = ?", [cart_id_customer])
        const response2 = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        // Expect the response status to be 404 (Not Found)
        expect(response2.status).toBe(404)
    })

    // Test that a customer cannot delete a non-existing product from their cart
    test("test with non-existing product", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/invalid")
        // Expect the response status to be 404 (Not Found)
        expect(response.status).toBe(404)
    })
})

// This is a test suite for the "DELETE /ezelectronics/carts" endpoint
describe("Delete current cart", () => {
    // Define a variable for the customer's cart ID
    let cart_id_customer: number

    // Before each test, set up the database with some test data
    beforeEach(async () => {
        // Insert a cart for the customer
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        // Get the ID of the inserted cart
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert an item into the cart
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    // Test that a logged in customer can delete their current cart successfully
    test("Delete current cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        // Check that the cart has been emptied
        const cart = await dbGet("SELECT * FROM cart WHERE id = ?", [cart_id_customer])
        expect(cart).toEqual({ id: cart_id_customer, customer: customer.username, total: 0, paid: false, paymentDate: null })
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items WHERE cart = ?", [cart_id_customer])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })

    // Test that a user who is not logged in cannot delete a cart
    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    // Test that a manager cannot delete a cart
    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    // Test that an admin cannot delete a cart
    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    // Test that a customer cannot delete a cart if they do not have one
    test("test with no cart", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(404)
    })
})

// This is a test suite for the "DELETE /ezelectronics/carts" endpoint
describe("Delete all carts of all users", () => {
    // Define variables for the IDs of different carts
    let cart_id_customer: number
    let cart_id_customer2: number
    let cart_id_closed: number

    // Before each test, set up the database with some test data
    beforeEach(async () => {
        // Insert a cart for the first customer
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        // Get the ID of the inserted cart
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert a paid cart for the second customer
        await dbRun("INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)", [customer2.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]])
        // Get the ID of the inserted cart
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer2.username]) as { id: number }).id

        // Insert a paid cart for the first customer
        await dbRun("INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)", [customer.username, products[1].sellingPrice, new Date().toISOString().split("T")[0]])
        // Get the ID of the inserted cart
        cart_id_closed = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

        // Insert items into the carts
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_closed, products[1].model, 1, products[1].category, products[1].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer2, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    // Test that a manager can delete all carts of all users successfully
    test("Delete all carts of all users successfully", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        // Check that all carts have been deleted
        const carts = await dbGet("SELECT COUNT(*) FROM cart", [])
        expect(carts).toEqual({ "COUNT(*)": 0 })
        // Check that all cart items have been deleted
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items", [])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })

    // Test that a user who is not logged in cannot delete all carts
    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    // Test that a customer cannot delete all carts
    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    // Test that an admin can delete all carts of all users successfully
    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        // Check that all carts have been deleted
        const carts = await dbGet("SELECT COUNT(*) FROM cart", [])
        expect(carts).toEqual({ "COUNT(*)": 0 })
        // Check that all cart items have been deleted
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items", [])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })
})

// This is a test suite for the "GET /ezelectronics/carts/all" endpoint
describe("Get all carts of all users", () => {
    // Define variables for the IDs of different carts
    let cart_id_customer: number
    let cart_id_customer2: number
    let cart_id_closed: number

    // Before each test, set up the database with some test data
    beforeEach(async () => {
        // Insert a cart for the first customer
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        // Get the ID of the inserted cart
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        // Insert a paid cart for the second customer
        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer2.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        // Get the ID of the inserted cart
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer2.username]) as { id: number }).id

        // Insert a paid cart for the first customer
        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[1].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        // Get the ID of the inserted cart
        cart_id_closed = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

        // Insert items into the carts
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_closed, products[1].model, 1, products[1].category, products[1].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer2, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    // Test that a manager can get all carts of all users successfully
    test("Get all carts of all users successfully", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(200)
        // Check that the response contains the expected carts
        expect(response.body).toEqual(expect.arrayContaining([
            // Expected cart for the first customer
            {
                customer: customer.username,
                paid: false,
                total: products[0].sellingPrice,
                paymentDate: null,
                products: [
                    {
                        model: products[0].model,
                        quantity: 1,
                        category: products[0].category,
                        price: products[0].sellingPrice
                    }
                ]
            },
            // Expected paid cart for the second customer
            {
                customer: customer2.username,
                paid: true,
                total: products[0].sellingPrice,
                paymentDate: new Date().toISOString().split("T")[0],
                products: [
                    {
                        model: products[0].model,
                        quantity: 1,
                        category: products[0].category,
                        price: products[0].sellingPrice
                    }
                ]
            },
            // Expected paid cart for the first customer
            {
                customer: customer.username,
                paid: true,
                total: products[1].sellingPrice,
                paymentDate: new Date().toISOString().split("T")[0],
                products: [
                    {
                        model: products[1].model,
                        quantity: 1,
                        category: products[1].category,
                        price: products[1].sellingPrice
                    }
                ]
            }
        ]))
    })

    // Test that a user who is not logged in cannot get all carts
    test("test with no login", async () => {
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(401)
    })

    // Test that a customer cannot get all carts
    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(401)
    })

    // Test that an admin can get all carts of all users successfully
    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(200)
        // Check that the response contains the expected carts
        expect(response.body).toEqual(expect.arrayContaining([
            // Expected cart for the first customer
            {
                customer: customer.username,
                paid: false,
                total: products[0].sellingPrice,
                paymentDate: null,
                products: [
                    {
                        model: products[0].model,
                        quantity: 1,
                        category: products[0].category,
                        price: products[0].sellingPrice
                    }
                ]
            },
            // Expected paid cart for the second customer
            {
                customer: customer2.username,
                paid: true,
                total: products[0].sellingPrice,
                paymentDate: new Date().toISOString().split("T")[0],
                products: [
                    {
                        model: products[0].model,
                        quantity: 1,
                        category: products[0].category,
                        price: products[0].sellingPrice
                    }
                ]
            },
            // Expected paid cart for the first customer
            {
                customer: customer.username,
                paid: true,
                total: products[1].sellingPrice,
                paymentDate: new Date().toISOString().split("T")[0],
                products: [
                    {
                        model: products[1].model,
                        quantity: 1,
                        category: products[1].category,
                        price: products[1].sellingPrice
                    }
                ]
            }
        ]))
    })
})
