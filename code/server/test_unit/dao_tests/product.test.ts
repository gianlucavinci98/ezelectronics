import { describe, test, expect, afterEach, jest } from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { ProductNotFoundError } from "../../src/errors/productError"
import { Category } from "../../src/components/product"

jest.mock("../../src/db/db")

afterEach(() => {
    jest.clearAllMocks()
})

let productDAO: ProductDAO = new ProductDAO()

describe("test registerProduct", () => {
    test('registerProduct success', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.registerProduct(100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10)).resolves.toBeUndefined()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10],
            expect.any(Function)
        )
    })

    test("registerProduct error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.registerProduct(100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10)).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10],
            expect.any(Function)
        )
    })

    test("registerProduct db error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.registerProduct(100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10)).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10],
            expect.any(Function)
        )
    })
})

describe("test changeProductQuantity", () => {
    test('changeProductQuantity success', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.changeProductQuantity('Model1', 5)).resolves.toBeUndefined()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [5, 'Model1'],
            expect.any(Function)
        )
    })

    test("changeProductQuantity error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.changeProductQuantity('Model1', 5)).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [5, 'Model1'],
            expect.any(Function)
        )
    })

    test("changeProductQuantity db error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.changeProductQuantity('Model1', 5)).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [5, 'Model1'],
            expect.any(Function)
        )
    })
})

describe("test getProduct", () => {
    test('getProduct success', async () => {
        const product = { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 }
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, product)
            return {} as any
        })
        await expect(productDAO.getProduct('Model1')).resolves.toEqual(product)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test('getProduct not found', async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as any
        })
        await expect(productDAO.getProduct('Model2')).rejects.toThrow(ProductNotFoundError)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model2'],
            expect.any(Function)
        )
    })

    test("getProduct error", async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getProduct('Model1')).rejects.toThrow()
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test("getProduct db error", async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getProduct('Model1')).rejects.toThrow()
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })
})

describe("test getProducts", () => {
    test('getProducts', async () => {
        const products = [
            { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 },
            { sellingPrice: 200, model: 'Model2', category: Category.APPLIANCE, arrivalDate: '2022-01-02', details: 'Details2', quantity: 20 }
        ]
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, products)
            return {} as any
        })
        await expect(productDAO.getProducts()).resolves.toEqual(products)
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("getProducts error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getProducts()).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("getProducts db error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getProducts()).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })
})

describe("test getProductsByCategory", () => {
    test('getProductsByCategory', async () => {
        const products = [
            { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 },
            { sellingPrice: 200, model: 'Model2', category: Category.SMARTPHONE, arrivalDate: '2022-01-02', details: 'Details2', quantity: 20 }
        ]
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, [products[0]])
            return {} as any
        })
        await expect(productDAO.getProductsByCategory(Category.APPLIANCE)).resolves.toEqual([products[0]])
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })

    test("getProductsByCategory error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getProductsByCategory(Category.APPLIANCE)).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })

    test("getProductsByCategory db error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getProductsByCategory(Category.APPLIANCE)).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })
})

describe("test getAvailableProductsByCategory", () => {
    test('getAvailableProductsByCategory', async () => {
        const products = [
            { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 },
            { sellingPrice: 200, model: 'Model2', category: Category.SMARTPHONE, arrivalDate: '2022-01-02', details: 'Details2', quantity: 0 },
            { sellingPrice: 300, model: 'Model3', category: Category.APPLIANCE, arrivalDate: '2022-01-03', details: 'Details3', quantity: 0 },
            { sellingPrice: 400, model: 'Model4', category: Category.SMARTPHONE, arrivalDate: '2022-01-04', details: 'Details4', quantity: 10 }
        ]
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, [products[0]])
            return {} as any
        })
        expect(productDAO.getAvailableProductsByCategory(Category.APPLIANCE)).resolves.toEqual([products[0]])
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })

    test("getAvailableProductsByCategory error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getAvailableProductsByCategory(Category.APPLIANCE)).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })

    test("getAvailableProductsByCategory db error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getAvailableProductsByCategory(Category.APPLIANCE)).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [Category.APPLIANCE],
            expect.any(Function)
        )
    })
})

describe("test getProductAvailable", () => {
    test('getProductAvailable success', async () => {
        const product = { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 }
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, product)
            return {} as any
        })
        await expect(productDAO.getProductAvailable('Model1')).resolves.toEqual(product)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test('getProductAvailable not found', async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as any
        })
        await expect(productDAO.getProductAvailable('Model2')).rejects.toThrow(ProductNotFoundError)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model2'],
            expect.any(Function)
        )
    })

    test("getProductAvailable error", async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getProductAvailable('Model1')).rejects.toThrow()
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test("getProductAvailable db error", async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getProductAvailable('Model1')).rejects.toThrow()
        expect(mock_db_get).toHaveBeenCalledTimes(1)
        expect(mock_db_get).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })
})

describe("test getAvailableProducts", () => {
    test('getAvailableProducts', async () => {
        const products = [
            { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 },
            { sellingPrice: 200, model: 'Model2', category: Category.APPLIANCE, arrivalDate: '2022-01-02', details: 'Details2', quantity: 20 }
        ]
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, products)
            return {} as any
        })
        await expect(productDAO.getAvailableProducts()).resolves.toEqual(products)
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("getAvailableProducts error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.getAvailableProducts()).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("getAvailableProducts db error", async () => {
        const mock_db_all = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.getAvailableProducts()).rejects.toThrow()
        expect(mock_db_all).toHaveBeenCalledTimes(1)
        expect(mock_db_all).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })
})

describe("test deleteAllProducts", () => {
    test('deleteAllProducts', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.deleteAllProducts()).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("deleteAllProducts error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.deleteAllProducts()).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })

    test("deleteAllProducts db error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.deleteAllProducts()).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        )
    })
})

describe("test deleteProduct", () => {
    test('deleteProduct', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.deleteProduct('Model1')).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test("deleteProduct error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as any
        })
        await expect(productDAO.deleteProduct('Model1')).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })

    test("deleteProduct db error", async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            throw new Error()
        })
        await expect(productDAO.deleteProduct('Model1')).rejects.toThrow()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
        expect(mock_db_run).toHaveBeenCalledWith(
            expect.any(String),
            ['Model1'],
            expect.any(Function)
        )
    })
})
