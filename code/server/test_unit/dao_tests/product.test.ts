import { describe, test, expect, beforeAll, afterEach, jest } from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { ProductNotFoundError } from "../../src/errors/productError"
import { Product, Category } from "../../src/components/product"

jest.mock("../../src/db/db")

afterEach(() => {
    jest.clearAllMocks()
})

describe('test ProductDAO', () => {
    let productDAO: ProductDAO

    beforeAll(() => {
        productDAO = new ProductDAO()
    })

    test('registerProduct', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.registerProduct(100, 'Model1', 'Category1', '2022-01-01', 'Details1', 10)).resolves.toBeUndefined()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
    })

    test('changeProductQuantity', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.changeProductQuantity('Model1', 5)).resolves.toBeUndefined()
        expect(mock_db_run).toHaveBeenCalledTimes(1)
    })

    test('getProduct success', async () => {
        const product = { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 }
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, product)
            return {} as any
        })
        await expect(productDAO.getProduct('Model1')).resolves.toEqual(product)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
    })

    test('getProduct not found', async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as any
        })
        await expect(productDAO.getProduct('Model2')).rejects.toThrow(ProductNotFoundError)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
    })

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
    })

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
    })

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
    })

    test('getProductAvailable success', async () => {
        const product = { sellingPrice: 100, model: 'Model1', category: Category.APPLIANCE, arrivalDate: '2022-01-01', details: 'Details1', quantity: 10 }
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, product)
            return {} as any
        })
        await expect(productDAO.getProductAvailable('Model1')).resolves.toEqual(product)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
    })

    test('getProductAvailable not found', async () => {
        const mock_db_get = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as any
        })
        await expect(productDAO.getProductAvailable('Model2')).rejects.toThrow(ProductNotFoundError)
        expect(mock_db_get).toHaveBeenCalledTimes(1)
    })

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
    })

    test('deleteAllProducts', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.deleteAllProducts()).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
    })

    test('deleteProduct', async () => {
        const mock_db_run = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as any
        })
        await expect(productDAO.deleteProduct('Model1')).resolves.toBe(true)
        expect(mock_db_run).toHaveBeenCalledTimes(1)
    })
})