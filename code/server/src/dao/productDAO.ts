import db from "../db/db"
import { Product } from "../components/product"

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    modelAlreadyExists(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT COUNT(*) FROM product WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (row["COUNT(*)"] > 0) resolve(true)
                    else resolve(false)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

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

    changeProductQuantity(model: string, newQuantity: number, changeDate: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "UPDATE product SET quantity = quantity + ?, arrivalDate = ? WHERE model = ?"
                db.run(sql, [newQuantity, changeDate, model], (err: Error | null) => {
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
}

export default ProductDAO