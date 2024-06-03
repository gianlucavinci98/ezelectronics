import { describe, test, expect, beforeEach, jest } from "@jest/globals"

import db from "../../src/db/db"
import CartDAO from "../../src/dao/cartDAO"
import { Cart } from "../../src/components/cart"
import { Role, User } from "../../src/components/user"
import { Database } from "sqlite3"
import { Category } from "../../src/components/product"

jest.mock("../../src/db/db")

beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

const user = new User("customer", "customer", "customer", Role.CUSTOMER, "address", "2000-01-01")
let cartDAO: CartDAO = new CartDAO()


describe("getCurrentCart", () => {

    test("success with existing cart", async () => {
        const cart = new Cart(user.username, false, "", 0, [], 1)

        const mock_db_get = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { id: cart.id, customer: cart.customer, paid: cart.paid, paymentDate: cart.paymentDate, total: cart.total })
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId").mockResolvedValue([])

        expect(cartDAO.getCurrentCart(user)).resolves.toEqual(cart)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).toHaveBeenCalledTimes(1)
        expect(mock_getproductsbycartid).toHaveBeenCalledWith(cart.id)
    })

    test("success with no cart", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getCurrentCart(user)).resolves.toEqual({ customer: user.username, paid: false, paymentDate: null, total: 0, products: [] })
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })

    test("error from db", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getCurrentCart(user)).rejects.toThrow(new Error())
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })

    test("error in db call", async () => {
        const mock_db_get = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getCurrentCart(user)).rejects.toThrow(new Error())
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })
})

describe("getProductsByCartId", () => {
    test("success", async () => {
        const products = [{ model: "model", quantity: 1, category: Category.SMARTPHONE, price: 1 }]
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, products)
            return {} as Database
        })

        expect(cartDAO.getProductsByCartId(1)).resolves.toEqual(products)
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.getProductsByCartId(1)).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.getProductsByCartId(1)).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function))
    })
})

describe("incrementProductInCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.incrementProductInCart(1, "model", 1)).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1, "model"], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.incrementProductInCart(1, "model", 1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1, "model"], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.incrementProductInCart(1, "model", 1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1, "model"], expect.any(Function))
    })
})

describe("insertProductInCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.insertProductInCart(1, { model: "model", quantity: 1, category: Category.SMARTPHONE, price: 1 })).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model", 1, Category.SMARTPHONE, 1], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.insertProductInCart(1, { model: "model", quantity: 1, category: Category.SMARTPHONE, price: 1 })).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model", 1, Category.SMARTPHONE, 1], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.insertProductInCart(1, { model: "model", quantity: 1, category: Category.SMARTPHONE, price: 1 })).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model", 1, Category.SMARTPHONE, 1], expect.any(Function))
    })
})

describe("createCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.createCart(new Cart(user.username, false, "", 0, [], 1))).resolves.toBe(1)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [user.username, false, "", 0], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.createCart(new Cart(user.username, false, "", 0, [], 1))).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [user.username, false, "", 0], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.createCart(new Cart(user.username, false, "", 0, [], 1))).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [user.username, false, "", 0], expect.any(Function))
    })
})

describe("updateCartTotal", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.updateCartTotal(1, 1)).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.updateCartTotal(1, 1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.updateCartTotal(1, 1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, 1], expect.any(Function))
    })
})

describe("checkoutCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.checkoutCart(new Cart(user.username, false, "", 0, [], 1))).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [expect.any(String), 1], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.checkoutCart(new Cart(user.username, false, "", 0, [], 1))).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [expect.any(String), 1], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.checkoutCart(new Cart(user.username, false, "", 0, [], 1))).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [expect.any(String), 1], expect.any(Function))
    })
})

describe("getCustomerCarts", () => {
    test("success", async () => {
        const carts = [new Cart(user.username, true, "2000-01-01", 0, [], 1)]
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{ id: 1, customer: user.username, paid: 1, paymentDate: "2000-01-01", total: 0 }])
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId").mockResolvedValue([])

        expect(cartDAO.getCustomerCarts(user)).resolves.toEqual(carts)
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).toHaveBeenCalledTimes(1)
        expect(mock_getproductsbycartid).toHaveBeenCalledWith(1)
    })

    test("error from db", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getCustomerCarts(user)).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })

    test("error in db call", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getCustomerCarts(user)).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [user.username], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })
})

describe("deleteProductFromCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.deleteProductFromCart(1, "model")).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model"], expect.any(Function))
    })

    test("error from db", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.deleteProductFromCart(1, "model")).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model"], expect.any(Function))
    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.deleteProductFromCart(1, "model")).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(expect.any(String), [1, "model"], expect.any(Function))
    })
})

describe("clearCart", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.clearCart(1)).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(2)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [1], expect.any(Function))
        expect(mock_db_run).toHaveBeenNthCalledWith(2, expect.any(String), [1], expect.any(Function))
    })

    test("error from db first time", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.clearCart(1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [1], expect.any(Function))
    })

    test("error from db second time", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null)
            return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.clearCart(1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(2)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [1], expect.any(Function))
        expect(mock_db_run).toHaveBeenNthCalledWith(2, expect.any(String), [1], expect.any(Function))

    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.clearCart(1)).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [1], expect.any(Function))
    })
})

describe("deleteAllCarts", () => {
    test("success", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        expect(cartDAO.deleteAllCarts()).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(2)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [], expect.any(Function))
        expect(mock_db_run).toHaveBeenNthCalledWith(2, expect.any(String), [], expect.any(Function))
    })

    test("error from db first time", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [], expect.any(Function))
    })

    test("error from db second time", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null)
            return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })

        expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(2)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [], expect.any(Function))
        expect(mock_db_run).toHaveBeenNthCalledWith(2, expect.any(String), [], expect.any(Function))

    })

    test("error in db call", async () => {
        const mock_db_run = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error()
        })

        expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error())
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenNthCalledWith(1, expect.any(String), [], expect.any(Function))
    })
})

describe("getAllCarts", () => {
    test("success", async () => {
        const carts = [new Cart(user.username, true, "2000-01-01", 0, [], 1)]
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{ id: 1, customer: user.username, paid: 1, paymentDate: "2000-01-01", total: 0 }])
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId").mockResolvedValue([])

        expect(cartDAO.getAllCarts()).resolves.toEqual(carts)
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [], expect.any(Function))
        expect(mock_getproductsbycartid).toHaveBeenCalledTimes(1)
        expect(mock_getproductsbycartid).toHaveBeenCalledWith(1)
    })

    test("error from db", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getAllCarts()).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })

    test("error in db call", async () => {
        const mock_db_all = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        const mock_getproductsbycartid = jest.spyOn(CartDAO.prototype, "getProductsByCartId")

        expect(cartDAO.getAllCarts()).rejects.toThrow(new Error())
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(expect.any(String), [], expect.any(Function))
        expect(mock_getproductsbycartid).not.toHaveBeenCalled()
    })
})
