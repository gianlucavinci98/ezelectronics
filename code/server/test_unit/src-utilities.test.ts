import { describe, test, expect } from "@jest/globals"

import { User, Role } from "../src/components/user"
import { Utility, DateError } from "../src/utilities"

const manager = new User("manager", "manager", "manager", Role.MANAGER, "manager", "2000-01-01")
const customer = new User("customer", "customer", "customer", Role.CUSTOMER, "customer", "2000-01-01")
const admin = new User("admin", "admin", "admin", Role.ADMIN, "admin", "2000-01-01")

describe("test Utility", () => {
    test("isManager", () => {
        expect(Utility.isManager(manager)).toBe(true)
        expect(Utility.isManager(customer)).toBe(false)
        expect(Utility.isManager(admin)).toBe(false)
    })

    test("isCustomer", () => {
        expect(Utility.isCustomer(manager)).toBe(false)
        expect(Utility.isCustomer(customer)).toBe(true)
        expect(Utility.isCustomer(admin)).toBe(false)
    })

    test("isAdmin", () => {
        expect(Utility.isAdmin(manager)).toBe(false)
        expect(Utility.isAdmin(customer)).toBe(false)
        expect(Utility.isAdmin(admin)).toBe(true)
    })
})

describe("test DateError", () => {
    test("DateError", () => {
        const dateError = new DateError()
        expect(dateError.customMessage).toBe("Input date is not compatible with the current date")
        expect(dateError.customCode).toBe(400)
    })
})