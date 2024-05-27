import { jest } from "@jest/globals"

import { User } from "../src/components/user"
import Authenticator from "../src/routers/auth"

export function mockIsLoggedIn(user: User | null = null) {
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
        req.user = user || {}
        next()
    })
}

export function mockAdminOrManager(user: User | null = null) {
    mockIsLoggedIn(user)
    jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => next())
}

export function mockAdmin(user: User | null = null) {
    mockIsLoggedIn(user)
    jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((req, res, next) => next())
}

export function mockManager(user: User | null = null) {
    mockIsLoggedIn(user)
    jest.spyOn(Authenticator.prototype, 'isManager').mockImplementation((req, res, next) => next())
}