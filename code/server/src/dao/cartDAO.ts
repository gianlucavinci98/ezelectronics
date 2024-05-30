import { Cart, ProductInCart } from "../components/cart";
import { User } from "../components/user";
import db from "../db/db"

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCurrentCart(user: User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                let productsInCart: ProductInCart[] = []
                // the valid cart is the one with latest id and that is the only one not paid
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = FALSE ORDER BY id DESC LIMIT 1"
                db.get(sql, [user.username], async (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (!row) {
                        console.log("No cart found")
                        resolve(new Cart(null, user.username, false, null, 0, productsInCart))
                    }
                    else {
                        productsInCart = await this.getProductsByCartId(row.id)
                        resolve(new Cart(row.id, row.customer, row.paid, row.paymentDate, row.total, productsInCart))
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    // retrieves all products in a cart by cart id
    // return an array of ProductInCart
    getProductsByCartId(cartId: number): Promise<ProductInCart[]> {
        return new Promise<ProductInCart[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart_items WHERE cart = ?"
                db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else {
                        resolve(rows.map(row => new ProductInCart(row.model, row.quantity, row.category, row.price)))
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    // increment by one the quantity of a product in the cart
    incrementProductInCart(cartId: number, product: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "UPDATE cart_items SET quantity = quantity + 1 WHERE cart = ? AND model = ?"
                db.run(sql, [cartId, product], function (err: Error | null) {
                    if (err) reject(err)
                    else {
                        resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    // insert a new product in cart_items
    insertProductInCart(cartId: number, productInCart: ProductInCart): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "INSERT INTO cart_items (cart, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)"
                db.run(sql, [cartId, productInCart.model, productInCart.quantity, productInCart.category, productInCart.price], function (err: Error | null) {
                    if (err) reject(err)
                    else {
                        resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    //insert a new cart for a user and return the id of the new cart
    createCart(cart: Cart): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "INSERT INTO cart (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)"
                db.run(sql, [cart.customer, cart.paid, cart.paymentDate, cart.total], function (err: Error | null) {
                    if (err) reject(err)
                    else {
                        resolve(this.lastID)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    // update the total amount of a cart
    updateCartTotal(cartId: number, total: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "UPDATE cart SET total = ? WHERE id = ?"
                db.run(sql, [total, cartId], function (err: Error | null) {
                    if (err) reject(err)
                    else {
                        resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    //checkout the cart updating the paid columnd and setting the payment date to today
    checkoutCart(cart: Cart): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const today = new Date()
                const sql = "UPDATE cart SET paid = true, paymentDate = ? WHERE id = ?"
                db.run(sql, [today.toISOString().split('T')[0], cart.id], function (err: Error | null) {
                    if (err) reject(err)
                    else {
                        resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

}

export default CartDAO