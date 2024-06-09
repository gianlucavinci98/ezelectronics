import { test, expect, jest, beforeEach, afterEach } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role } from "../../src/components/user"; // Import the Role enum
import { UserIsAdminError, UserNotAdminError } from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

describe("test createUser", () => {
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
})

describe("test getUsers", () => {
    //Unit test for the getUsers method of the UserController
    //The test checks if the method returns an array of users when the DAO method returns an array of users
    //The test also expects the DAO method to be called once

    test("It should return an array of users", async () => {
        const testUsers = [ //Define an array of test users
            { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1" },
            { username: "test2", name: "test2", surname: "test2", role: Role.CUSTOMER, address: "test2", birthdate: "test2" }
        ]
        jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); //Mock the getUsers method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the getUsers method of the controller
        const response = await controller.getUsers();

        //Check if the getUsers method of the DAO has been called once
        expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        expect(response).toEqual(testUsers); //Check if the response is equal to the test users array
    });
})

describe("test getUsersByRole", () => {
    //Example of a unit test for the getUsersByRole method of the UserController
    //The test checks if the method returns an array of users when the DAO method returns an array of users
    //The test also expects the DAO method to be called once with the correct parameter

    test("It should return an array of users with the specified role", async () => {
        const testUsers = [ //Define an array of test users
            { username: "test1", name: "test1", surname: "test1", role: Role.MANAGER, address: "test1", birthdate: "test1" },
            { username: "test2", name: "test2", surname: "test2", role: Role.MANAGER, address: "test2", birthdate: "test2" }
        ]
        jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); //Mock the getUsers method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the getUsersByRole method of the controller with the role "Manager"
        const response = await controller.getUsersByRole(Role.MANAGER);

        //Check if the getUsers method of the DAO has been called once with the role "Manager"
        expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith(Role.MANAGER);
        expect(response).toEqual(testUsers); //Check if the response is equal to the test users array
    });
})

describe("test getUserByUsername", () => {
    //Unit test for the getUserByUsername method of the UserController
    //The test checks if the method returns the correct user when the DAO method returns the correct user
    //The test also expects the DAO method to be called once with the correct parameter

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

    test("getUserByUsername should throw an error if the user is not an admin and tries to get another user", async () => {
        const testLoggedUser = { //Define a test user object
            username: "loggedUser",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }

        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername")

        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.getUserByUsername(testLoggedUser, "updateUser")).rejects.toThrow(UserNotAdminError)
        expect(mock_getuserbyusername).not.toHaveBeenCalled()
    })

    test("getUserByUsername should return the user calling the function if it is not an admin", async () => {
        const testLoggedUser = { //Define a test user object
            username: "loggedUser",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }

        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testLoggedUser)

        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.getUserByUsername(testLoggedUser, "loggedUser")).resolves.toEqual(testLoggedUser)
        expect(mock_getuserbyusername).toHaveBeenCalledTimes(1)
        expect(mock_getuserbyusername).toHaveBeenCalledWith("loggedUser")
    })
})

describe("test deleteUser", () => {
    //Unit test for the deleteUser method of the UserController
    //The test checks if the method returns true when the DAO method returns true
    //The test also expects the DAO method to be called once with the correct parameters

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

    test("deleteUser admin can delete other non admin users", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
            address: "test",
            birthdate: "test"
        }
        const otherUser = { //Define a test user object
            username: "other",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }
        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherUser)
        const mock_deleteuser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true)
        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.deleteUser(testUser, otherUser.username)).resolves.toBe(true)
        expect(mock_getuserbyusername).toHaveBeenCalledTimes(1)
        expect(mock_getuserbyusername).toHaveBeenCalledWith(otherUser.username)
        expect(mock_deleteuser).toHaveBeenCalledTimes(1)
        expect(mock_deleteuser).toHaveBeenCalledWith(otherUser.username)
    })

    test("deleteUser admin cannot delete other admin users", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
            address: "test",
            birthdate: "test"
        }
        const otherUser = { //Define a test user object
            username: "other",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
            address: "test",
            birthdate: "test"
        }
        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherUser)
        const mock_deleteuser = jest.spyOn(UserDAO.prototype, "deleteUser")
        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.deleteUser(testUser, otherUser.username)).rejects.toThrow(UserIsAdminError)
        expect(mock_getuserbyusername).toHaveBeenCalledTimes(1)
        expect(mock_getuserbyusername).toHaveBeenCalledWith(otherUser.username)
        expect(mock_deleteuser).not.toHaveBeenCalled()
    })

    test("deleteUser non admin cannot delete other users", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }
        const otherUser = { //Define a test user object
            username: "other",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }
        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherUser)
        const mock_deleteuser = jest.spyOn(UserDAO.prototype, "deleteUser")
        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.deleteUser(testUser, otherUser.username)).rejects.toThrow(UserNotAdminError)
        expect(mock_getuserbyusername).not.toHaveBeenCalled()
        expect(mock_deleteuser).not.toHaveBeenCalled()
    })
})

describe("test deleteAll", () => {
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
})

describe("test updateUserInfo", () => {
    //Unit test for the updateUserInfo method of the UserController
    //The test checks if the method returns the updated user when the DAO method returns the updated user
    //The test also expects the DAO method to be called once with the correct parameters

    test("It should return the updated user", async () => {
        const testLoggedUser = { //Define a test user object
            username: "loggedUser",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
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

        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testUserUpdated) //Mock the getUserByUsername method of the DAO
        jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValue() //Mock the updateUser method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the updateUserInfo method of the controller with the test user object
        const response = await controller.updateUserInfo(testLoggedUser, "nameUpdated", "surnameUpdated", "addressUpdated", "birthdateUpdated", "updateUser");

        //Check if the getUserByUsername method of the DAO has been called once with the test username
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(2);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("updateUser");
        //Check if the updateUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith("updateUser", "nameUpdated", "surnameUpdated", "addressUpdated", "birthdateUpdated")
        expect(response).toEqual(testUserUpdated); //Check if the response is equal to the test user object
    });



    test("updateUserInfo non admin cannot update other users", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }
        const otherUser = { //Define a test user object
            username: "other",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test"
        }
        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherUser)
        const mock_updateuser = jest.spyOn(UserDAO.prototype, "updateUser")
        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.updateUserInfo(testUser, "name", "surname", "address", "birthdate", otherUser.username)).rejects.toThrow(UserNotAdminError)
        expect(mock_getuserbyusername).not.toHaveBeenCalled()
        expect(mock_updateuser).not.toHaveBeenCalled()
    })

    test("updateUserInfo admin cannot update other admin users", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
            address: "test",
            birthdate: "test"
        }
        const otherUser = { //Define a test user object
            username: "other",
            name: "test",
            surname: "test",
            role: Role.ADMIN,
            address: "test",
            birthdate: "test"
        }
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore()
        const mock_getuserbyusername = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherUser)
        const mock_updateuser = jest.spyOn(UserDAO.prototype, "updateUser")
        const controller = new UserController(); //Create a new instance of the controller
        await expect(controller.updateUserInfo(testUser, "name", "surname", "address", "birthdate", otherUser.username)).rejects.toThrow(UserIsAdminError)
        expect(mock_getuserbyusername).toHaveBeenCalledTimes(1)
        expect(mock_getuserbyusername).toHaveBeenCalledWith(otherUser.username)
        expect(mock_updateuser).not.toHaveBeenCalled()
    })
})
