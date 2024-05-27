import { test, describe, expect, jest, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { Role, User } from "../../src/components/user"
import db from "../../src/db/db"
import { cleanup } from "../../src/db/cleanup"
import UserDAO from "../../src/dao/userDAO"
import { login } from "../utilities"
import TestAgent from "supertest/lib/agent"

const baseURL = "/ezelectronics"
const usersBaseURL = baseURL + "/users"

const agent: TestAgent = request.agent(app)

async function get(query: string, params: string[], callback: (err: Error | null, row: any) => void) {
    return new Promise<void>((resolve, reject) => {
        db.get(query, params, (err: Error | null, row: any) => {
            try {
                callback(err, row)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    })
}

beforeEach(async () => {
    jest.restoreAllMocks()
    await new Promise<void>((resolve) => {
        cleanup(() => resolve())
    })
})

afterEach(async () => {
    await new Promise<void>((resolve) => {
        cleanup(() => resolve())
    })
})

describe("POST /users", () => {
    test("should create the user", async () => {
        const username = "test"
        const testUser = {
            username: username,
            name: "test",
            surname: "test",
            password: "test",
            role: Role.MANAGER,
            address: "",
            birthdate: "",
        } as User
        const response = await request(app).post(usersBaseURL).send(testUser)
        expect(response.status).toBe(200)
        const sql = "SELECT username, name, surname, role, address, birthdate FROM users WHERE username = ?"
        await get(sql, [username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).not.toBeNull()
            expect(row.username).toBe(username)
            expect(row.name).toBe(testUser.name)
            expect(row.surname).toBe(testUser.surname)
            expect(row.role).toBe(testUser.role)
        })
    })

    test("should return 409 if the username already exists", async () => {
        const username = "test"
        const testUser = {
            username: username,
            name: "test",
            surname: "test",
            password: "test",
            role: Role.MANAGER,
            address: "",
            birthdate: "",
        } as User
        const response = await request(app).post(usersBaseURL).send(testUser)
        expect(response.status).toBe(200)
        const response2 = await request(app).post(usersBaseURL).send(testUser)
        expect(response2.status).toBe(409)
    })
})

describe("GET /users", () => {
    test("should return all users", async () => {
        // create the users
        const manager = { username: "manager", name: "manager", surname: "manager", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const customer = { username: "customer", name: "customer", surname: "customer", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const admin = { username: "admin", name: "admin", surname: "admin", role: Role.ADMIN, address: null as null, birthdate: null as null }

        const userDAO = new UserDAO()
        await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
        await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
        await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)

        // do login
        await login(admin.username, "password", agent)

        const response = await agent.get(usersBaseURL)
        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(3)
        expect(response.body).toContainEqual(manager)
        expect(response.body).toContainEqual(customer)
        expect(response.body).toContainEqual(admin)
    })

    test("should return 401 if the user is a customer", async () => {
        const customer: User = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2021-01-01")
        const userDAO = new UserDAO()
        await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)

        await login(customer.username, "password", agent)

        const response = await agent.get(usersBaseURL)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a manager", async () => {
        const manager: User = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2021-01-01")
        const userDAO = new UserDAO()
        await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)

        await login(manager.username, "password", agent)

        const response = await agent.get(usersBaseURL)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await request(app).get(usersBaseURL)
        expect(response.status).toBe(401)
    })
})

describe("GET /users/roles/:role", () => {
    test("should return all users with the specified role", async () => {
        // create the users
        const manager = { username: "manager", name: "manager", surname: "manager", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const customer1 = { username: "customer1", name: "customer1", surname: "customer1", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const customer2 = { username: "customer2", name: "customer2", surname: "customer2", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const admin = { username: "admin", name: "admin", surname: "admin", role: Role.ADMIN, address: null as null, birthdate: null as null }

        const userDAO = new UserDAO()
        await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
        await userDAO.createUser(customer1.username, customer1.name, customer1.surname, "password", customer1.role)
        await userDAO.createUser(customer2.username, customer2.name, customer2.surname, "password", customer2.role)
        await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)

        // do login
        await login(admin.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/roles/" + Role.CUSTOMER)
        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(2)
        expect(response.body).toContainEqual(customer1)
        expect(response.body).toContainEqual(customer2)
    })

    test("should return 401 if the user is a customer", async () => {
        const customer = { username: "customer", name: "customer", surname: "customer", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)

        await login(customer.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/roles/" + Role.CUSTOMER)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a manager", async () => {
        const manager = { username: "manager", name: "manager", surname: "manager", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)

        await login(manager.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/roles/" + Role.CUSTOMER)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await request(app).get(usersBaseURL + "/roles/" + Role.CUSTOMER)
        expect(response.status).toBe(401)
    })
})

describe("GET /users/:username", () => {
    test("should return the current user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/" + user.username)
        expect(response.status).toBe(200)
        expect(response.body).toEqual(user)
    })

    test("should return other users if the user is an admin", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const admin = { username: "admin", name: "admin", surname: "admin", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)

        await login(admin.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/" + user.username)
        expect(response.status).toBe(200)
        expect(response.body).toEqual(user)
    })

    test("should return 401 if the user is a customer and want to obtain another user", async () => {
        const customer = { username: "customer", name: "customer", surname: "customer", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(customer.username, customer.name, customer.surname, "password", customer.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(customer.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is a manager and want to obtain another user", async () => {
        const manager = { username: "manager", name: "manager", surname: "manager", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(manager.username, manager.name, manager.surname, "password", manager.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(manager.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await request(app).get(usersBaseURL + "/test")
        expect(response.status).toBe(401)
    })

    test("should return 404 if the target user does not exist", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.get(usersBaseURL + "/other")
        expect(response.status).toBe(404)
    })
})
