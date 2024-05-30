import db from "../db/db"
import { Product } from "../components/product"
import { ProductNotFoundError } from "../errors/productError"

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    registerProduct(sellingPrice: number, model: string, category: string, arrivalDate: string, details: string | null, quantity: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "INSERT INTO product (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
                db.run(sql, [sellingPrice, model, category, arrivalDate, details, quantity], (err: Error | null) => {
                    if (err) reject(err)
                    else resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    changeProductQuantity(model: string, newQuantity: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "UPDATE product SET quantity = quantity + ? WHERE model = ?"
                db.run(sql, [newQuantity, model], (err: Error | null) => {
                    if (err) reject(err)
                    else resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProduct(model: string): Promise<Product> {
        return new Promise<Product>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (!row) reject(new ProductNotFoundError())
                    else resolve(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product"
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProductsByCategory(category: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE category = ?"
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getAvailableProductsByCategory(category: string): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE category = ? AND quantity > 0"
                db.all(sql, [category], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProductAvailable(model: string): Promise<Product> {
        return new Promise<Product>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ? AND quantity > 0"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (!row) reject(new ProductNotFoundError())
                    else resolve(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getAvailableProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE quantity > 0"
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)))
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteAllProducts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM product"
                db.run(sql, [], (err: Error | null) => {
                    if (err) reject(err)
                    else resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteProduct(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM product WHERE model = ?"
                db.run(sql, [model], (err: Error | null) => {
                    if (err) reject(err)
                    else resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProductAvailableGT0(model: string): Promise<Product> {
        return new Promise<Product>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (!row) reject(new ProductNotFoundError())
                    else resolve(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default ProductDAO