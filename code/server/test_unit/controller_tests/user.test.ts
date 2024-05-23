import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role } from "../../src/components/user"; // Import the Role enum

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


//Unit test for the getUsers method of the UserController
//The test checks if the method returns an array of users when the DAO method returns an array of users
//The test also expects the DAO method to be called once

test("It should return an array of users", async () => {
    const testUsers = [ //Define an array of test users
        { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1"},
        { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2"}
    ]
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); //Mock the getUsers method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the getUsers method of the controller
    const response = await controller.getUsers();

    //Check if the getUsers method of the DAO has been called once
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(response).toEqual(testUsers); //Check if the response is equal to the test users array
});


//Example of a unit test for the getUsersByRole method of the UserController
//The test checks if the method returns an array of users when the DAO method returns an array of users
//The test also expects the DAO method to be called once with the correct parameter

test("It should return an array of users with the specified role", async () => {
    const testUsers = [ //Define an array of test users
        { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1"},
        { username: "test2", name: "test2", surname: "test2", role: Role.MANAGER, address: "test2", birthdate: "test2"}
    ]
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); //Mock the getUsers method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the getUsersByRole method of the controller with the role "Manager"
    const response = await controller.getUsersByRole("MANAGER");

    //Check if the getUsers method of the DAO has been called once with the role "Manager"
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith(Role.MANAGER);
    expect(response).toEqual(testUsers); //Check if the response is equal to the test users array
});

//Unit test for the getUserByUsername method of the UserController
//The test checks if the method returns the correct user when the DAO method returns the correct user
//The test also expects the DAO method to be called once with the correct parameter

//Dovrei testare anche il controllo sul ruolo dell'utente che chiama il metodo?


test("It should return the user with the specified username", async () => {
    const testUserToBeReturned = { //Define a test user object
        username: "testID",
        name: "test",
        surname: "test",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    }
    const testUserToBeAdmin = { //Define a test user object
        username: "testID",
        name: "test",
        surname: "test",
        role: Role.ADMIN,
        address: "test",
        birthdate: "test"
    }
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUserToBeReturned); //Mock the getUserByUsername method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the getUserByUsername method of the controller with the test username
    const response = await controller.getUserByUsername(testUserToBeAdmin, "testID");

    //Check if the getUserByUsername method of the DAO has been called once with the test username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("testID");
    expect(response).toEqual(testUserToBeReturned); //Check if the response is equal to the test user object
});

//Unit test for the deleteUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

//Should I also check the fact that if the target user is an admin, the method should throw an error?

test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    }
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the deleteUser method of the controller with the test username
    const response = await controller.deleteUser(testUser, "test");

    //Check if the deleteUser method of the DAO has been called once with the test username
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("test");
    expect(response).toBe(true); //Check if the response is true
});

//Unit test for the deleteAll method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once

test("It should return true", async () => {
    jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true); //Mock the deleteAll method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the deleteAll method of the controller
    const response = await controller.deleteAll();

    //Check if the deleteAll method of the DAO has been called once
    expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
    expect(response).toBe(true); //Check if the response is true
});

//Unit test for the updateUserInfo method of the UserController
//The test checks if the method returns the updated user when the DAO method returns the updated user
//The test also expects the DAO method to be called once with the correct parameters

test("It should return the updated user", async () => {
    const testLoggedUser = { //Define a test user object
        username: "loggedUser",
        name: "test",
        surname: "test",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    }

    const testUserUpdated = { //Define a test user object
        username: "updateUser",
        name: "nameUpdated",
        surname: "surnameUpdated",
        role: Role.MANAGER,
        address: "addressUpdated",
        birthdate: "birthdateUpdated"
    }


    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUserUpdated); //Mock the getUserByUsername method of the DAO
    jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(); //Mock the updateUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the updateUserInfo method of the controller with the test user object
    const response = await controller.updateUserInfo(testLoggedUser, "nameUpdated", "surnameUpdated", "addressUpdated", "birthdateUpdated", "UpdateUser");

    //Check if the getUserByUsername method of the DAO has been called once with the test username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("updateUser");
    //Check if the updateUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith("updateUser", "nameUpdated", "surnameUpdated", "addressUpdated", "birthdateUpdated")
    expect(response).toEqual(testUserUpdated); //Check if the response is equal to the test user object
});