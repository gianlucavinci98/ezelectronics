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
                let productsInCart : ProductInCart[] = []
                // the valid cart is the one with latest id and that is the only one not paid
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = FALSE ORDER BY id DESC LIMIT 1"   
                db.get(sql, [user.username], async (err: Error | null, row: any) => {
                    if (err) reject(err)
                    else if (!row){
                        console.log("No cart found")
                        resolve(new Cart(user.username, false, null, 0, productsInCart))
                    }
                    else {
                        console.log(row)
                        productsInCart = await this.getProductsByCartId(row.id)
                        resolve(new Cart(row.customer, row.paid, row.paymentDate, row.total, productsInCart))
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
                console.log("Provo la query: " + sql + " con cartId: " + cartId)
                db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                    if (err) reject(err)
                    else {
                    console.log(rows)
                    resolve(rows.map(row => new ProductInCart(row.model, row.quantity, row.category, row.price)))
                    } 
                })
            } catch (error) {
                reject(error)
            }
        })
    }

}

export default CartDAO