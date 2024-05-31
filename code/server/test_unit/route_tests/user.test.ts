import { test, describe, expect, jest, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User } from "../../src/components/user"

import UserController from "../../src/controllers/userController"
import { Role } from "../../src/components/user"
import Authenticator from "../../src/routers/auth"
const baseURL = "/ezelectronics"
const usersBaseURL = baseURL + "/users"

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
    jest.restoreAllMocks()
})

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
