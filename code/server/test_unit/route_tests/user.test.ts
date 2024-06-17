import { test, describe, expect, jest, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User } from "../../src/components/user"

import UserController from "../../src/controllers/userController"
import { Role } from "../../src/components/user"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
const baseURL = "/ezelectronics"
const usersBaseURL = baseURL + "/users"
const sessionsBaseURL = baseURL + "/sessions"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

function mockIsLoggedIn(user: User | null = null) {
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
        req.user = user || {}
        next()
    })
}

function mockAdmin(user: User | null = null) {
    mockIsLoggedIn(user)
    jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((req, res, next) => next())
}

beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})
describe("test user routes", () => {

    //Example of a unit test for the POST ezelectronics/users route
    //The test checks if the route returns a 200 success code
    //The test also expects the createUser method of the controller to be called once with the correct parameters
    test("POST / shoud return the user", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(usersBaseURL).send(testUser) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(
            testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role
        )
    })

    test("POST / propagates error from controller", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error()) //Mock the createUser method of the controller
        const response = await request(app).post(usersBaseURL).send(testUser) //Send a POST request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(
            testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role
        )
    })


    //Unit test for the GET ezelectronics/users route
    //The test checks if the route returns a 200 success code
    //The test also expects the getUsers method of the controller to be called once

    test("GET / should return the list of users", async () => {
        const testUsers = [ //Define an array of test users returned by the route
            { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1" },
            { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2" }
        ]
        mockAdmin()
        jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(testUsers) //Mock the getUsers method of the controller
        const response = await request(app).get(usersBaseURL) //Send a GET request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1) //Check if the getUsers method has been called once
    })

    test("GET / propagates error from controller", async () => {
        jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error()) //Mock the getUsers method of the controller
        const response = await request(app).get(usersBaseURL) //Send a GET request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1) //Check if the getUsers method has been called once
    })


    //Unit test for the GET ezelectronics/users/:role route
    //The test checks if the route returns a 200 success code
    //The test also expects the getUsersByRole method of the controller to be called once with the correct parameter

    test("GET /roles/:role should return the list of user with that role", async () => {
        const testUsers = [ //Define an array of test users returned by the route
            { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1" },
            { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2" }
        ]
        mockAdmin()
        jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers) //Mock the getUsersByRole method of the controller
        const response = await request(app).get(usersBaseURL + "/roles/" + Role.MANAGER) //Send a GET request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) //Check if the getUsersByRole method has been called once
        //Check if the getUsersByRole method has been called with the correct parameter
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER)
    })

    test("GET /roles/:role propagates error from controller", async () => {
        jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error()) //Mock the getUsersByRole method of the controller
        const response = await request(app).get(usersBaseURL + "/roles/" + Role.MANAGER) //Send a GET request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) //Check if the getUsersByRole method has been called once
        //Check if the getUsersByRole method has been called with the correct parameter
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER)
    })

    //Unit test for the GET ezelectronics/users/:username route
    //The test checks if the route returns a 200 success code
    //The test also expects the getUserByUsername method of the controller to be called once with the correct parameter

    test("GET /:username should return the user if the user is the current", async () => {
        const username = "uid"
        const testUser = { //Define a test user object returned by the route
            username: username,
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test",
        }
        mockIsLoggedIn(testUser)
        jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser) //Mock the getUserByUsername method of the controller
        const response = await request(app).get(usersBaseURL + "/" + username) //Send a GET request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) //Check if the getUserByUsername method has been called once
        //Check if the getUserByUsername method has been called with the correct parameter
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(testUser, username)
    })

    test("GET /:username propagates error from controller", async () => {
        const username = "uid"
        const testUser = { //Define a test user object returned by the route
            username: username,
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test",
        }
        mockIsLoggedIn(testUser)
        jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new Error()) //Mock the getUserByUsername method of the controller
        const response = await request(app).get(usersBaseURL + "/" + username) //Send a GET request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) //Check if the getUserByUsername method has been called once
        //Check if the getUserByUsername method has been called with the correct parameter
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(testUser, username)
    })

    describe("PATCH /:username", () => {
        //Unit test for the PATCH ezelectronics/users/:username route
        //The test checks if the route returns a 200 success code
        //The test also expects the updateUser method of the controller to be called once with the correct parameters

        test("PATCH /:username should update the current user", async () => {
            const username = "uid"

            const testUserUpdated = { //Define a test user object sent to the route
                username: username,
                name: "test",
                surname: "test",
                address: "test",
                birthdate: "2000-01-01",
                role: Role.MANAGER
            }

            const testUserLogged = { //Define a test user object
                username: username,
                name: "test",
                surname: "test",
                address: "updated",
                birthdate: "2000-01-01",
                role: Role.MANAGER
            }

            mockIsLoggedIn(testUserLogged)
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(testUserUpdated) //Mock the updateUserInfo method of the controller
            const response = await request(app).patch(usersBaseURL + "/" + username).send(testUserUpdated) //Send a PATCH request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) //Check if the updateUserInfo method has been called once
            //Check if the updateUserInfo method has been called with the correct parameters
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
                testUserLogged,
                testUserUpdated.name,
                testUserUpdated.surname,
                testUserUpdated.address,
                testUserUpdated.birthdate,
                testUserUpdated.username
            )
        })

        test("PATCH /:username should return error if date in the future", async () => {
            const username = "uid"
            const testUserUpdated = { //Define a test user object sent to the route
                username: username,
                name: "test",
                surname: "test",
                address: "test",
                birthdate: "3000-01-01",
                role: Role.MANAGER
            }
            const testUserLogged = { //Define a test user object
                username: username,
                name: "test",
                surname: "test",
                address: "updated",
                birthdate: "2000-01-01",
                role: Role.MANAGER
            }
            mockIsLoggedIn(testUserLogged)
            const response = await request(app).patch(usersBaseURL + "/" + username).send(testUserUpdated) //Send a PATCH request to the route
            expect(response.status).toBe(400) //Check if the response status is 400
        })

        test("PATCH /:username propagates error from controller", async () => {
            const username = "uid"
            const testUserUpdated = { //Define a test user object sent to the route
                username: username,
                name: "test",
                surname: "test",
                address: "test",
                birthdate: "2000-01-01",
                role: Role.MANAGER
            }
            const testUserLogged = { //Define a test user object
                username: username,
                name: "test",
                surname: "test",
                address: "updated",
                birthdate: "2000-01-01",
                role: Role.MANAGER
            }
            mockIsLoggedIn(testUserLogged)
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new Error()) //Mock the updateUserInfo method of the controller
            const response = await request(app).patch(usersBaseURL + "/" + username).send(testUserUpdated) //Send a PATCH request to the route
            expect(response.status).toBe(503) //Check if the response status is 500
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) //Check if the updateUserInfo method has been called once
            //Check if the updateUserInfo method has been called with the correct parameters
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
                testUserLogged,
                testUserUpdated.name,
                testUserUpdated.surname,
                testUserUpdated.address,
                testUserUpdated.birthdate,
                testUserUpdated.username
            )
        })
    })
    // This test suite is for the DELETE /:username endpoint
    describe('DELETE /:username', () => {
        // This test checks if a user can delete itself
        test('user should delete itself', async () => {
            // We set up a test user
            const username = 'testuser'
            const loggedInUser = { username: username }

            // We mock the isLoggedIn method of the Authenticator class to always return our test user
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = loggedInUser
                next()
            })

            // We mock the deleteUser method of the UserController class to always resolve to true
            jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true)

            // We make a DELETE request to the /:username endpoint
            const response = await request(app).delete(usersBaseURL + `/${username}`).send()

            // We expect the response status to be 200
            expect(response.status).toBe(200)
            // We expect the deleteUser method to have been called with our test user and username
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(loggedInUser, username)
        })
    })

    test("DELETE /:username propagates error from controller", async () => {
        const username = "uid"
        const testUser = { //Define a test user object returned by the route
            username: username,
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test",
        }
        mockIsLoggedIn(testUser)
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new Error()) //Mock the deleteUser method of the controller
        const response = await request(app).delete(usersBaseURL + "/" + username) //Send a DELETE request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) //Check if the deleteUser method has been called once
        //Check if the deleteUser method has been called with the correct parameter
        expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(testUser, username)
    })

    // This test suite is for the DELETE / endpoint
    describe('DELETE /', () => {
        // This test checks if an admin can delete all users
        test('admin should delete all users', async () => {
            // We set up a test user with the role of ADMIN
            const loggedInUser = { role: Role.ADMIN }

            // We mock the isLoggedIn method of the Authenticator class to always return our test user
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = loggedInUser
                next()
            })

            // We mock the deleteAll method of the UserController class to always resolve to true
            jest.spyOn(UserController.prototype, 'deleteAll').mockResolvedValueOnce(true)

            // We make a DELETE request to the / endpoint
            const response = await request(app).delete(usersBaseURL).send()

            // We expect the response status to be 200
            expect(response.status).toBe(200)
        })
    })

    test("DELETE / propagates error from controller", async () => {
        const testUser = { //Define a test user object returned by the route
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test",
        }
        mockAdmin(testUser)
        jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error()) //Mock the deleteAll method of the controller
        const response = await request(app).delete(usersBaseURL) //Send a DELETE request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1) //Check if the deleteAll method has been called once
    })

})

describe("test session routes", () => {
    //Unit test for the POST ezelectronics/sessions route
    //The test checks if the route returns a 200 success code
    //The test also expects the login method of the controller to be called once with the correct parameters

    beforeEach(() => {
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
                isInt: () => ({}),
                isFloat: () => ({}),
                optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
            })),
            query: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
                isInt: () => ({}),
                isFloat: () => ({}),
                optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
            })),
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), isIn: () => ({}), notEmpty: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
                isInt: () => ({}),
                isFloat: () => ({}),
                optional: () => ({ isDate: () => ({}), isString: () => ({ notEmpty: () => ({}), isIn: () => ({}) }) })
            })),
        }))
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        })
    })

    test("POST / should return the user", async () => {
        const userLogin = { //Define a test user object sent to the route
            username: "test",
            password: "test"
        }
        const user = new User("test", "test", "test", Role.CUSTOMER, "test", "2000-01-01")
        jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(user) //Mock the login method of the controller
        const response = await request(app).post(sessionsBaseURL).send(userLogin) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1) //Check if the login method has been called once
        //Check if the login method has been called with the correct parameters
        expect(response.body).toEqual(user)
    })

    test("POST / propagates error from controller", async () => {
        const userLogin = { //Define a test user object sent to the route
            username: "test",
            password: "test"
        }
        jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error()) //Mock the login method of the controller
        const response = await request(app).post(sessionsBaseURL).send(userLogin) //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 500
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1) //Check if the login method has been called once
        //Check if the login method has been called with the correct parameters
    })

    test("DELETE /current should logout the user", async () => {
        const user = new User("test", "test", "test", Role.CUSTOMER, "test", "2000-01-01")
        jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(true) //Mock the logout method of the controller
        const response = await request(app).delete(sessionsBaseURL + "/current") //Send a DELETE request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1) //Check if the logout method has been called once
    })

    test("DELETE /current propagates error from controller", async () => {
        jest.spyOn(Authenticator.prototype, "logout").mockRejectedValueOnce(new Error()) //Mock the logout method of the controller
        const response = await request(app).delete(sessionsBaseURL + "/current") //Send a DELETE request to the route
        expect(response.status).toBe(503) //Check if the response status is 500
        expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1) //Check if the logout method has been called once
    })

    test("GET /current should return the current user", async () => {
        const response = await request(app).get(sessionsBaseURL + "/current") //Send a GET request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(response.body).toEqual("")
    })

})