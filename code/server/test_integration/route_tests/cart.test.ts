import { test, expect, describe, beforeAll, afterEach, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import TestAgent from "supertest/lib/agent"

import { app } from "../../index"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"
import { login, logout, dbGet, dbRun } from "../utilities"


const baseURL = "/ezelectronics"
const cartsBaseURL = baseURL + "/carts"

const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const customer2: User = new User("customer2", "customer2", "customer2", Role.CUSTOMER, "customer", "2021-01-02")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")
const products: Product[] = [
    new Product(10, "product1", Category.SMARTPHONE, "2020-01-01", "details", 10),
    new Product(20, "product2", Category.LAPTOP, "2020-01-01", "details", 20),
    new Product(30, "product3", Category.APPLIANCE, "2020-01-01", "details", 30)
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
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?)",
            [cart_id_customer, products[0].model, 1, products[0].category, products[0].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?)",
            [cart_id_customer2, products[1].model, 1, products[1].category, products[1].sellingPrice]
        )
        await dbRun(
            "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?)",
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

