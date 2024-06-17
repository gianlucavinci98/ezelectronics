import { test, expect, jest, describe } from "@jest/globals"

import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

describe("test createUser method", () => {
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

    test("createUser propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })

    test("createUser rejects when user already exists", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: users.username"))
            return {} as Database
        });
        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError)
        mockDBRun.mockRestore()
    })
})

describe("test getUserByUsername method", () => {
    //Unit test for the getUserByUsername method of userDAO
    //It mocks the database get method to simulate a successful retrieval of a user
    //It then calls the getUserByUsername method and expects it to resolve the user object

    test("It should resolve the user object", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, password: "password", salt: "salt", address: "", birthdate: "" })
            return {} as Database
        });
        const result = await userDAO.getUserByUsername("username")
        expect(result).toEqual({ username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "", birthdate: "" } as User)
        mockDBGet.mockRestore()
    })

    test("getUserByUsername propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(new Error())
        mockDBGet.mockRestore()
    })

    test("getUserByUsername rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(new Error())
        mockDBGet.mockRestore()
    })

    test("getUserByUsername rejects when user not found", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as Database
        });
        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(UserNotFoundError)
        mockDBGet.mockRestore()
    })
})

describe("test getUsers method", () => {
    //Unit test for the getUsers method of userDAO
    //It mocks the database get method to simulate a successful retrieval of users
    //It then calls the getUsers method and expects it to resolve an array of user objects

    test("It should resolve an array of user objects", async () => {
        const userDAO = new UserDAO()
        const users = [
            {
                username: "username1", name: "name", surname: "surname", role: Role.CUSTOMER, address: "", birthdate: ""
            } as User,
            {
                username: "username2", name: "name2", surname: "surname2", role: Role.MANAGER, address: "", birthdate: ""
            } as User]
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, users)
            return {} as Database
        });
        const result = await userDAO.getUsers()
        expect(result).toEqual(users)
        mockDBAll.mockRestore()
    })

    test("getUsers propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.getUsers()).rejects.toThrow(new Error())
        mockDBAll.mockRestore()
    })

    test("getUsers rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.getUsers()).rejects.toThrow(new Error())
        mockDBAll.mockRestore()
    })

    test("getUsers filters by role", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });
        const result = await userDAO.getUsers(Role.MANAGER)
        expect(result).toEqual([])

        expect(mockDBAll).toBeCalledWith("SELECT * FROM users WHERE role = ?", [Role.MANAGER], expect.any(Function))

        mockDBAll.mockRestore()
    })
})

describe("test deleteUser method", () => {
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

    test("deleteUser propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.deleteUser("username")).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })

    test("deleteUser rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.deleteUser("username")).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })
})

describe("test deleteAll method", () => {
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

    test("deleteAll propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.deleteAll()).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })

    test("deleteAll rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.deleteAll()).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })
})

describe("test updateUser method", () => {
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

    test("updateUser propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.updateUser("username", "name", "surname", "address", "birthdate")).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })

    test("updateUser rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.updateUser("username", "name", "surname", "address", "birthdate")).rejects.toThrow(new Error())
        mockDBRun.mockRestore()
    })
})

describe("test getIsUserAuthenticated method", () => {
    test("getIsUserAuthenticated resolves false with missing user", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as Database
        });
        const result = await userDAO.getIsUserAuthenticated("username", "password")
        expect(result).toBe(false)
        mockDBGet.mockRestore()
    })

    test("getIsUserAuthenticated propagates db error", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error()
        });
        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(new Error())
        mockDBGet.mockRestore()
    })

    test("getIsUserAuthenticated rejects when error in callback", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(new Error())
        mockDBGet.mockRestore()
    })

    test("getIsUserAuthenticated resolves false with wrong password", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, password: "password", salt: "salt", address: "", birthdate: "" })
            return {} as Database
        });
        const result = await userDAO.getIsUserAuthenticated("username", "wrongPassword")
        expect(result).toBe(false)
        mockDBGet.mockRestore()
    })
})
