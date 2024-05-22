import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role } from "../../src/models/user"; // Import the Role enum

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});

//Example of a unit test for the getUsers method of the UserController
//The test checks if the method returns an array of users when the DAO method returns an array of users
//The test also expects the DAO method to be called once

test("It should return an array of users", async () => {
    const testUsers = [ //Define an array of test users
        { username: "test1", name: "test1", surname: "test1", role: Role.Manager, address: "test1", birthdate: "test1"},
        { username: "test2", name: "test2", surname: "test2", role: Role.Employee, address: "test2", birthdate: "test2"}
    ]
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); //Mock the getUsers method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the getUsers method of the controller
    const response = await controller.getUsers();

    //Check if the getUsers method of the DAO has been called once
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(response).toEqual(testUsers); //Check if the response is equal to the test users array
});