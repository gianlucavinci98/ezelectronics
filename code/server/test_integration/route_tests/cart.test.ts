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

describe("Get current cart", () => {
    let cart_id_customer: number
    let cart_id_customer2: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer2.username, products[1].sellingPrice + products[2].sellingPrice * 2])

        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer2.username]) as { id: number }).id

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

    test("Get current cart of customer successful", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(cartsBaseURL)
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

    test("test with no login", async () => {
        const response = await agent.get(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test multiple items in cart", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.get(cartsBaseURL)
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

    test("test empty cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        await dbRun("UPDATE cart SET total = 0 WHERE id = ?", [cart_id_customer])
        const response = await agent.get(cartsBaseURL)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        })
    })

    test("test with paid cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("UPDATE cart SET paid = true WHERE id = ?", [cart_id_customer])
        const response = await agent.get(cartsBaseURL)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            customer: customer.username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        })
    })

    test("test with no open cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("DELETE FROM cart WHERE customer = ?", [customer.username])
        const response = await agent.get(cartsBaseURL)
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

describe("Post product add to cart", () => {
    let cart_id_customer: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])

        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    test("Add product to existing cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        expect(response.status).toBe(200)
        const cart_items = await dbAll("SELECT * FROM cart_items WHERE cart = ?", [cart_id_customer])
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
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        expect(cart_total).toEqual(expect.closeTo(products[0].sellingPrice + products[1].sellingPrice))
    })

    test("test with no login", async () => {
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        expect(response.status).toBe(401)
    })

    test("test with missing cart", async () => {
        await login(customer2.username, "password", agent)
        await expect(dbGet("SELECT COUNT(*) FROM cart WHERE customer = ? AND paid = false", [customer2.username])).resolves.toEqual({ "COUNT(*)": 0 })
        const response = await agent.post(cartsBaseURL).send({ model: products[1].model })
        expect(response.status).toBe(200)
        await expect(dbGet("SELECT COUNT(*) FROM cart WHERE customer = ? AND paid = false", [customer2.username])).resolves.toEqual({ "COUNT(*)": 1 })
        const total = (await dbGet("SELECT total FROM cart WHERE customer = ? AND paid = false", [customer2.username]) as { total: number }).total
        expect(total).toEqual(products[1].sellingPrice)
    })

    test("test with invalid product", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: "invalid" })
        expect(response.status).toBe(404)
    })

    test("test with empty model", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: "" })
        expect(response.status).toBe(422)
    })

    test("test with product with no quantity", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: products[3].model })
        expect(response.status).toBe(409)
        await expect(dbGet(
            "SELECT COUNT(*) FROM cart_items WHERE cart = ? AND model = ?",
            [cart_id_customer, products[3].model]
        )).resolves.toEqual({ "COUNT(*)": 0 })
    })

    test("test with product already in cart", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.post(cartsBaseURL).send({ model: products[0].model })
        expect(response.status).toBe(200)
        const cart_items = await dbAll("SELECT * FROM cart_items WHERE cart = ?", [cart_id_customer])
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
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        expect(cart_total).toEqual(expect.closeTo(products[0].sellingPrice * 2))
    })
})

describe("Patch checkout cart", () => {
    let cart_id_customer: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice, products[1].sellingPrice * 2])
        await dbRun("INSERT INTO cart (customer) VALUES (?)", [customer2.username])

        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[1].model, 2, products[1].category, products[1].sellingPrice]
        )
    })

    test("Checkout cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(200)
        const cart = await dbGet("SELECT * FROM cart WHERE id = ?", [cart_id_customer])
        expect(cart).toEqual({
            id: cart_id_customer,
            customer: customer.username,
            paid: true,
            paymentDate: new Date().toISOString().split("T")[0],
            total: products[0].sellingPrice + products[1].sellingPrice * 2
        })
        const product0_quantity = (await dbGet("SELECT quantity FROM product WHERE model = ?", [products[0].model]) as { quantity: number }).quantity
        expect(product0_quantity).toBe(products[0].quantity - 1)
        const product1_quantity = (await dbGet("SELECT quantity FROM product WHERE model = ?", [products[1].model]) as { quantity: number }).quantity
        expect(product1_quantity).toBe(products[1].quantity - 2)
    })

    test("test with no login", async () => {
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with empty cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(400)
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        expect(paid).toBe(false)
    })

    test("test with missing cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("DELETE FROM cart WHERE customer = ?", [customer.username])
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(404)
    })

    test("test with product with 0 available quantity", async () => {
        await login(customer.username, "password", agent)
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[4].model, 1, products[4].category, products[4].sellingPrice]
        )
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(409)
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        expect(paid).toBe(false)
    })

    test("test with product with insufficient quantity", async () => {
        await login(customer.username, "password", agent)
        await dbRun(
            "UPDATE cart_items SET quantity = ? WHERE cart = ? AND model = ?",
            [products[1].quantity + 1, cart_id_customer, products[1].model]
        )
        const response = await agent.patch(cartsBaseURL)
        expect(response.status).toBe(409)
        const paid = (await dbGet("SELECT paid FROM cart WHERE id = ?", [cart_id_customer]) as { paid: boolean }).paid
        expect(paid).toBe(false)
    })
})

describe("Get cart history", () => {
    let cart_id1: number
    let cart_id2: number
    let cart_id_open: number

    beforeEach(async () => {
        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        cart_id1 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[1].sellingPrice + products[2].sellingPrice * 2, new Date().toISOString().split("T")[0]]
        )
        cart_id2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true AND id <> ?", [customer.username, cart_id1]) as { id: number }).id

        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        cart_id_open = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

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

    test("Get cart history successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.arrayContaining([
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

    test("test with no login", async () => {
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(401)
    })

    test("test with no cart history", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/history")
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])
    })
})

describe("Delete product from cart", () => {
    let cart_id_customer: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    test("Delete product from cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(200)
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items WHERE cart = ?", [cart_id_customer])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
        const cart_total = (await dbGet("SELECT total FROM cart WHERE id = ?", [cart_id_customer]) as { total: number }).total
        expect(cart_total).toBe(0)
    })

    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(401)
    })

    test("test with product not in cart", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/" + products[1].model)
        expect(response.status).toBe(404)
    })

    test("test with empty cart", async () => {
        await login(customer.username, "password", agent)
        await dbRun("DELETE FROM cart_items WHERE cart = ?", [cart_id_customer])
        const response = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response.status).toBe(404)

        await dbRun("DELETE FROM cart WHERE id = ?", [cart_id_customer])
        const response2 = await agent.delete(cartsBaseURL + "/products/" + products[0].model)
        expect(response2.status).toBe(404)
    })

    test("test with non-existing product", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL + "/products/invalid")
        expect(response.status).toBe(404)
    })
})

describe("Delete current cart", () => {
    let cart_id_customer: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
    })

    test("Delete current cart successfully", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        const cart = await dbGet("SELECT * FROM cart WHERE id = ?", [cart_id_customer])
        expect(cart).toEqual({ id: cart_id_customer, customer: customer.username, total: 0, paid: false, paymentDate: null })
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items WHERE cart = ?", [cart_id_customer])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })

    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with manager login", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with no cart", async () => {
        await login(customer2.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(404)
    })
})

describe("Delete all carts of all users", () => {
    let cart_id_customer: number
    let cart_id_customer2: number
    let cart_id_closed: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun("INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)", [customer2.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]])
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer2.username]) as { id: number }).id

        await dbRun("INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)", [customer.username, products[1].sellingPrice, new Date().toISOString().split("T")[0]])
        cart_id_closed = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

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

    test("Delete all carts of all users successfully", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        const carts = await dbGet("SELECT COUNT(*) FROM cart", [])
        expect(carts).toEqual({ "COUNT(*)": 0 })
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items", [])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })

    test("test with no login", async () => {
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.delete(cartsBaseURL)
        expect(response.status).toBe(200)
        const carts = await dbGet("SELECT COUNT(*) FROM cart", [])
        expect(carts).toEqual({ "COUNT(*)": 0 })
        const cart_items = await dbGet("SELECT COUNT(*) FROM cart_items", [])
        expect(cart_items).toEqual({ "COUNT(*)": 0 })
    })
})

describe("Get all carts of all users", () => {
    let cart_id_customer: number
    let cart_id_customer2: number
    let cart_id_closed: number

    beforeEach(async () => {
        await dbRun("INSERT INTO cart (customer, total) VALUES (?, ?)", [customer.username, products[0].sellingPrice])
        cart_id_customer = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = false", [customer.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer2.username, products[0].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        cart_id_customer2 = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer2.username]) as { id: number }).id

        await dbRun(
            "INSERT INTO cart (customer, total, paid, paymentDate) VALUES (?, ?, true, ?)",
            [customer.username, products[1].sellingPrice, new Date().toISOString().split("T")[0]]
        )
        cart_id_closed = (await dbGet("SELECT id FROM cart WHERE customer = ? AND paid = true", [customer.username]) as { id: number }).id

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

    test("Get all carts of all users successfully", async () => {
        await login(manager.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.arrayContaining([
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

    test("test with no login", async () => {
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(401)
    })

    test("test with customer login", async () => {
        await login(customer.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(401)
    })

    test("test with admin login", async () => {
        await login(admin.username, "password", agent)
        const response = await agent.get(cartsBaseURL + "/all")
        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.arrayContaining([
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
