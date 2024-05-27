import { test, expect, describe, beforeAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import UserDAO from "../../src/dao/userDAO"
import db from "../../src/db/db"
import { User, Role } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { cleanup } from "../../src/db/cleanup"
import { login, logout } from "../utilities"
import TestAgent from "supertest/lib/agent"

const baseURL = "/ezelectronics"
const productsBaseURL = baseURL + "/products"
const sessionsBaseURL = baseURL + "/sessions"


const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
const admin: User = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2021-01-01")

const agent: TestAgent = request.agent(app)


beforeAll(async () => {
    cleanup()
    const userDAO = new UserDAO()
    await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
    await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
    await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)
})

afterEach(() => {
    logout(agent)
})

describe("Products registration API tests", () => {
    test("test successful product registration", async () => {
        const product = new Product(10, "testProduct", Category.SMARTPHONE, "2020-01-01", "details", 5)
        await login(manager.username, "password", agent)
        const response = await agent.post(productsBaseURL)
            .send(product)
        expect(response.status).toBe(200)

        const sql = "SELECT * FROM product WHERE model = ?"
        db.get(sql, [product.model], (err, row) => {
            expect(err).toBeNull()
            expect(row).toEqual(product)
        })
    })
})