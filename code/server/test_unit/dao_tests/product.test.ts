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

test("changeProductQuantity updates product quantity correctly", async () => {
    const productDAO = new ProductDAO();
    const sellingPrice = 100
    const model = "model";
    const initialQuantity = 10;
    const newQuantity = 5;
    const arrivalDate = new Date(2020, 0, 1); // 1st of January 2020

    // Insert a product with initial quantity and arrival date
    const insertSql = "INSERT INTO product (model, quantity, arrivalDate) VALUES (?, ?, ?, ?)";
    db.run(insertSql, [sellingPrice, model, initialQuantity, arrivalDate], async (err: Error | null) => {
        expect(err).toBeNull();
        console.log(err); // Log the error

        // Call changeProductQuantity to increase the quantity
        await productDAO.changeProductQuantity(model, newQuantity);

        // Verify that the quantity has been updated correctly
        const selectSql = "SELECT quantity FROM product WHERE model = ?";
        db.get(selectSql, [model], async (err: Error | null, row: any) => {
            expect(err).toBeNull();
            console.log(row); // Log the row
            if (row) { // Check if row is defined
                expect(row.quantity).toEqual(initialQuantity + newQuantity);
            }

            // Call changeProductQuantity to decrease the quantity
            await productDAO.changeProductQuantity(model, -newQuantity);

            // Verify that the quantity has been updated correctly after reduction
            db.get(selectSql, [model], (err: Error | null, row: any) => {
                expect(err).toBeNull();
                console.log(row); // Log the row
                if (row) { // Check if row is defined
                    expect(row.quantity).toEqual(initialQuantity);
                }
            });
        });
    });

    // Clean up: Delete the product
    const deleteSql = "DELETE FROM product WHERE model = ?";
    db.run(deleteSql, [model], (err: Error | null) => {
        expect(err).toBeNull();
    })
})

   

test("getProductsByCategory returns products of the correct category", async () => {
    const productDAO = new ProductDAO()
    const category = Category.APPLIANCE
    const product1 = new Product(100, "model1", category, "2020-01-01", "details", 10)
    const product2 = new Product(200, "model2", category, "2020-02-02", "details", 20)

    // Insert two products of the same category
    const insertSql = "INSERT INTO product (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
    await Promise.all([
        new Promise((resolve, reject) => {
            db.run(insertSql, [product1.sellingPrice, product1.model, product1.category, product1.arrivalDate, product1.details, product1.quantity], (err: Error | null) => {
                if (err) reject(err)
                else resolve(null)
            })
        }),
        new Promise((resolve, reject) => {
            db.run(insertSql, [product2.sellingPrice, product2.model, product2.category, product2.arrivalDate, product2.details, product2.quantity], (err: Error | null) => {
                if (err) reject(err)
                else resolve(null)
            })
        })
    ])

    // Call getProductsByCategory and verify the returned products
    const products = await productDAO.getProductsByCategory(category)
    console.log(products); // Log the products
    expect(products).toEqual([product1, product2])

    // Clean up: Delete the products
    const deleteSql = "DELETE FROM product WHERE model = ?"
    await Promise.all([
        new Promise((resolve, reject) => {
            db.run(deleteSql, [product1.model], (err: Error | null) => {
                if (err) reject(err)
                else resolve(null)
            })
        }),
        new Promise((resolve, reject) => {
            db.run(deleteSql, [product2.model], (err: Error | null) => {
                if (err) reject(err)
                else resolve(null)
            })
        })
    ])
})

    test("getAvailableProductsByCategory returns available products of the correct category", async () => {
    const productDAO = new ProductDAO()
    const category = Category.APPLIANCE
    const product1 = new Product(100, "model1", category, "2020-01-01", "details", 10)
    const product2 = new Product(200, "model2", category, "2020-02-02", "details", 0) // This product is not available

    // Insert two products of the same category, one available and one not available
    const insertSql = "INSERT INTO product (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
    db.run(insertSql, [product1.sellingPrice, product1.model, product1.category, product1.arrivalDate, product1.details, product1.quantity], (err: Error | null) => {
        expect(err).toBeNull()
    })
    db.run(insertSql, [product2.sellingPrice, product2.model, product2.category, product2.arrivalDate, product2.details, product2.quantity], (err: Error | null) => {
        expect(err).toBeNull()
    })

    // Call getAvailableProductsByCategory and verify the returned products
    const products = await productDAO.getAvailableProductsByCategory(category)
    expect(products).toEqual([product1]) // Only product1 should be returned as product2 is not available

    // Clean up: Delete the products
    const deleteSql = "DELETE FROM product WHERE model = ?"
    db.run(deleteSql, [product1.model], (err: Error | null) => {
        expect(err).toBeNull()
    })
    db.run(deleteSql, [product2.model], (err: Error | null) => {
        expect(err).toBeNull()
    })
})
    test("deleteAllProducts deletes all products", async () => {
    const productDAO = new ProductDAO()
    const product1 = new Product(100, "model1", Category.APPLIANCE, "2020-01-01", "details", 10)
    const product2 = new Product(200, "model2", Category.APPLIANCE, "2020-02-02", "details", 20)

    // Insert two products
    const insertSql = "INSERT INTO product (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
    db.run(insertSql, [product1.sellingPrice, product1.model, product1.category, product1.arrivalDate, product1.details, product1.quantity], (err: Error | null) => {
        expect(err).toBeNull()
    })
    db.run(insertSql, [product2.sellingPrice, product2.model, product2.category, product2.arrivalDate, product2.details, product2.quantity], (err: Error | null) => {
        expect(err).toBeNull()
    })

    // Call deleteAllProducts and verify that all products are deleted
    await productDAO.deleteAllProducts()

    const selectSql = "SELECT * FROM product"
    db.all(selectSql, [], (err: Error | null, rows: any[]) => {
        expect(err).toBeNull()
        expect(rows.length).toEqual(0) // No products should be left in the database
    })
})
