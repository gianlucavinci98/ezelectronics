import { test, describe, expect, jest, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { Role, User } from "../../src/components/user"
import db from "../../src/db/db"
import { cleanup } from "../../src/db/cleanup"

const baseURL = "/ezelectronics"
const usersBaseURL = baseURL + "/users"

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
})
