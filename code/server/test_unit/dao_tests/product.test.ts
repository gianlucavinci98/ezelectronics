import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import db from "../../src/db/db"

import ProductDAO from "../../src/dao/productDAO"
import { Category, Product } from "../../src/components/product"
import { ProductNotFoundError } from "../../src/errors/productError"

test("get product returns the correct product", async () => {
    const productDAO = new ProductDAO()
    const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);
    const sql = "INSERT INTO product (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
    db.run(sql, [product.sellingPrice, product.model, product.category, product.arrivalDate, product.details, product.quantity], (err: Error | null) => {
        expect(err).toBeNull()
    })

    const result = await productDAO.getProduct(product.model)
    expect(result).toEqual(product)

    const sql2 = "DELETE FROM product WHERE model = ?"
    db.run(sql2, [product.model], (err: Error | null) => {
        expect(err).toBeNull()
    })
})

test("get product returns an error if the product does not exist", async () => {
    const productDAO = new ProductDAO()

    expect(
        productDAO.getProduct("nonexistent model")
    ).rejects.toThrow(ProductNotFoundError)
})

test("register product correctly inserts a new product", async () => {
    const productDAO = new ProductDAO()
    const product = new Product(100, "model", Category.APPLIANCE, "2020-01-01", "details", 10);

    await productDAO.registerProduct(product.sellingPrice, product.model, product.category, product.arrivalDate || new Date().toISOString().split('T')[0], product.details, product.quantity)

    const sql = "SELECT * FROM product WHERE model = ?"
    db.get(sql, [product.model], (err: Error | null, row: any) => {
        expect(err).toBeNull()
        expect(row).toEqual(product)
    })

    const sql2 = "DELETE FROM product WHERE model = ?"
    db.run(sql2, [product.model], (err: Error | null) => {
        expect(err).toBeNull()
    })
})