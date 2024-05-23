import { test, expect, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import { Role } from "../../src/components/user"
const baseURL = "/ezelectronics"
const usersBaseURL = baseURL + "/users"

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

test("It should return a 200 success code", async () => {
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

test("It should return a 200 success code", async () => {
    const testUsers = [ //Define an array of test users returned by the route
        { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1"},
        { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2"}
    ]
    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(testUsers) //Mock the getUsers method of the controller
    const response = await request(app).get(usersBaseURL) //Send a GET request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1) //Check if the getUsers method has been called once
})


//Unit test for the GET ezelectronics/users/:role route
//The test checks if the route returns a 200 success code
//The test also expects the getUsersByRole method of the controller to be called once with the correct parameter

test("It should return a 200 success code", async () => {
    const testUsers = [ //Define an array of test users returned by the route
        { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1"},
        { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2"}
    ]
    jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers) //Mock the getUsersByRole method of the controller
    const response = await request(app).get(usersBaseURL + "/roles/MANAGER") //Send a GET request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) //Check if the getUsersByRole method has been called once
    //Check if the getUsersByRole method has been called with the correct parameter
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("MANAGER")
})

//Unit test for the GET ezelectronics/users/:username route
//The test checks if the route returns a 200 success code
//The test also expects the getUserByUsername method of the controller to be called once with the correct parameter

test("It should return a 200 success code", async () => {
    const testUser = { //Define a test user object returned by the route
        username: "uid",
        name: "test",
        surname: "test",
        role: Role.MANAGER, address: "test", birthdate: "test"
    }
    jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser) //Mock the getUserByUsername method of the controller
    const response = await request(app).get(usersBaseURL + "/uid") //Send a GET request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) //Check if the getUserByUsername method has been called once
    //Check if the getUserByUsername method has been called with the correct parameter
    expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith("uid")
})

//Unit test for the DELETE ezelectronics/users/:username route
//The test checks if the route returns a 200 success code
//The test also expects the deleteUser method of the controller to be called once with the correct parameter

test("It should return a 200 success code", async () => {
    jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true) //Mock the deleteUser method of the controller
    const response = await request(app).delete(usersBaseURL + "/uid") //Send a DELETE request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) //Check if the deleteUser method has been called once
    //Check if the deleteUser method has been called with the correct parameter
    expect(UserController.prototype.deleteUser).toHaveBeenCalledWith("uid")
})


//Unit test for the DELETE ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the deleteAll method of the controller to be called once

test("It should return a 200 success code", async () => {
    jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true) //Mock the deleteAll method of the controller
    const response = await request(app).delete(usersBaseURL) //Send a DELETE request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1) //Check if the deleteAll method has been called once
})


//Unit test for the PATCH ezelectronics/users/:username route
//The test checks if the route returns a 200 success code
//The test also expects the updateUser method of the controller to be called once with the correct parameters

test("It should return a 200 success code", async () => {
    const testUserUpdated = { //Define a test user object sent to the route
        username: "uid",
        name: "test",
        surname: "test",
        address: "test",
        birthdate: "test",
        role: Role.MANAGER
    }

    const testUserLogged = { //Define a test user object
        username: "loggedUser",
        name: "test",
        surname: "test",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    }

    jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(testUserUpdated) //Mock the updateUserInfo method of the controller
    const response = await request(app).patch(usersBaseURL + "/uid").send(testUserLogged) //Send a PATCH request to the route
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