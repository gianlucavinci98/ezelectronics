import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})


//Unit test for the getUserByUsername method of userDAO
//It mocks the database get method to simulate a successful retrieval of a user
//It then calls the getUserByUsername method and expects it to resolve the user object

test("It should resolve the user object", async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "username", name: "name", surname: "surname", role: "role", password: "password", salt: "salt" })
        return {} as Database
    });
    const result = await userDAO.getUserByUsername("username")
    expect(result).toEqual({ username: "username", name: "name", surname: "surname", role: "role", password: "password", salt: "salt" })
    mockDBGet.mockRestore()
})


//Unit test for the getUsers method of userDAO
//It mocks the database get method to simulate a successful retrieval of users
//It then calls the getUsers method and expects it to resolve an array of user objects

test("It should resolve an array of user objects", async () => {
    const userDAO = new UserDAO()
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{ username: "username1", name: "name1", surname: "surname1", role: "role1", password: "password1", salt: "salt1" }, { username: "username2", name: "name2", surname: "surname2", role: "role2", password: "password2", salt: "salt2" }])
        return {} as Database
    });
    const result = await userDAO.getUsers()
    expect(result).toEqual([{ username: "username1", name: "name1", surname: "surname1", role: "role1", password: "password1", salt: "salt1" }, { username: "username2", name: "name2", surname: "surname2", role: "role2", password: "password2", salt: "salt2" }])
    mockDBAll.mockRestore()
})

//Unit test for the deleteUser method of userDAO
//It mocks the database run method to simulate a successful deletion of a user
//It then calls the deleteUser method and expects it to resolve true

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await userDAO.deleteUser("username")
    expect(result).toBe(true)
    mockDBRun.mockRestore()
})

//Unit test for the deleteAll method of userDAO
//It mocks the database run method to simulate a successful deletion of all users
//It then calls the deleteAllUsers method and expects it to resolve true

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await userDAO.deleteAll()
    expect(result).toBe(true)
    mockDBRun.mockRestore()
})


//Unit test for the updateUser method of userDAO
//It mocks the database run method to simulate a successful update of a user
//It then calls the updateUser method and expects it to resolve

test("It should resolve", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await userDAO.updateUser("username", "name", "surname", "address", "birthdate")
    expect(result).toBeUndefined()
    mockDBRun.mockRestore()
})


