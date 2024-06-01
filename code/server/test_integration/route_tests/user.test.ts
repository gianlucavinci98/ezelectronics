import { test, describe, expect, jest, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { Role, User } from "../../src/components/user"
import db from "../../src/db/db"
import UserDAO from "../../src/dao/userDAO"
import { login, cleanup, logout } from "../utilities"
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
    await cleanup()
})

afterEach(async () => {
    await logout(agent);
    await cleanup()
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

describe("DELETE /users/:username", () => {
    test("customer should delete itself", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + user.username)
        expect(response.status).toBe(200)
        const sql = "SELECT username FROM users WHERE username = ?"
        await get(sql, [user.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).toBeUndefined()
        })
    })

    test("manager should delete itself", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + user.username)
        expect(response.status).toBe(200)
        const sql = "SELECT username FROM users WHERE username = ?"
        await get(sql, [user.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).toBeUndefined()
        })
    })

    test("admin should delete itself", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + user.username)
        expect(response.status).toBe(200)
        const sql = "SELECT username FROM users WHERE username = ?"
        await get(sql, [user.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).toBeUndefined()
        })
    })

    test("customer cannot delete another user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(401)
    })

    test("manager cannot delete another user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.MANAGER, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(401)
    })

    test("admin can delete another user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(200)
        const sql = "SELECT username FROM users WHERE username = ?"
        await get(sql, [other.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).toBeUndefined()
        })
    })

    test("admin cannot delete another admin", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL + "/" + other.username)
        expect(response.status).toBe(401)
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await request(app).delete(usersBaseURL + "/test")
        expect(response.status).toBe(401)
    })
})

describe("DELETE /", () => {
    test("should delete all non-admin users", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const admin = { username: "admin", name: "admin", surname: "admin", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(admin.username, admin.name, admin.surname, "password", admin.role)

        await login(admin.username, "password", agent)

        const response = await agent.delete(usersBaseURL)
        expect(response.status).toBe(200)
        const sql = "SELECT username FROM users WHERE username = ?"
        await get(sql, [user.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).toBeUndefined()
        })
        await get(sql, [admin.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).not.toBeUndefined()
        })
    })

    test("should return 401 if the user is not an admin", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.delete(usersBaseURL)
        expect(response.status).toBe(401)
    })
})

describe("PATCH /users/:username", () => {
    test("should update the user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(200)
        const sql = "SELECT name, surname, address, birthdate FROM users WHERE username = ?"
        await get(sql, [user.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).not.toBeUndefined()
            expect(row.name).toBe("newName")
            expect(row.surname).toBe("newSurname")
            expect(row.address).toBe("newAddress")
            expect(row.birthdate).toBe("2021-01-01")
        })
    })

    test("not admin should not update another user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + other.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(401)
    })

    test("admin should update another user", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + other.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(200)
        const sql = "SELECT name, surname, address, birthdate FROM users WHERE username = ?"
        await get(sql, [other.username], (err: Error | null, row: any) => {
            expect(err).toBeNull()
            expect(row).not.toBeUndefined()
            expect(row.name).toBe("newName")
            expect(row.surname).toBe("newSurname")
            expect(row.address).toBe("newAddress")
            expect(row.birthdate).toBe("2021-01-01")
        })
    })

    test("admin should not update another admin", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const other = { username: "other", name: "other", surname: "other", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)
        await userDAO.createUser(other.username, other.name, other.surname, "password", other.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + other.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(401)
    })

    test("name must be set", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(422)
    })

    test("surname must be set", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(422)
    })

    test("address must be set", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", surname: "newSurname", birthdate: "2021-01-01" })
        expect(response.status).toBe(422)
    })

    test("birthdate must be set", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", surname: "newSurname", address: "newAddress" })
        expect(response.status).toBe(422)
    })

    test("birthdate must be a valid date", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "invalid" })
        expect(response.status).toBe(422)
    })

    test("should return 400 if birthdate is in the future", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER, address: null as null, birthdate: null as null }
        // set new birthdate at one month in the future
        let newBirthdate = new Date()
        newBirthdate.setMonth(newBirthdate.getMonth() + 1)
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/" + user.username).send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: newBirthdate.toISOString().split("T")[0] })
        expect(response.status).toBe(400)
    })

    test("should return 404 if the target user does not exist", async () => {
        const user = { username: "test", name: "test", surname: "test", role: Role.ADMIN, address: null as null, birthdate: null as null }
        const userDAO = new UserDAO()
        await userDAO.createUser(user.username, user.name, user.surname, "password", user.role)

        await login(user.username, "password", agent)

        const response = await agent.patch(usersBaseURL + "/other").send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(404)
    })

    test("should return 401 if the user is not logged in", async () => {
        const response = await request(app).patch(usersBaseURL + "/test").send({ name: "newName", surname: "newSurname", address: "newAddress", birthdate: "2021-01-01" })
        expect(response.status).toBe(401)
    })
})
