import { User } from "../components/user";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import { Cart, ProductInCart } from "../components/cart"; // Import the Cart type from the appropriate file
import { ProductNotAvailableError, CartNotFoundError, EmptyCartError } from "../errors/cartError"; // Import the ProductNotAvailableError class from the appropriate file
import { ProductNotFoundError } from "../errors/productError";
import e from "express";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private productDAO: ProductDAO

    constructor() {
        this.dao = new CartDAO
        this.productDAO = new ProductDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, product: string): Promise<Boolean> {
        try {
            let result: Boolean = false

            const productInDB = await this.productDAO.getProductAvailableGT0(product)
            if (productInDB.quantity === 0) {
                throw new ProductNotAvailableError()
            }

            const cart: Cart = await this.getCart(user);
            console.log("cart prelevato:\n" + JSON.stringify(cart, null, 2))

            let productInCart: ProductInCart = cart.products.find(p => p.model === product)
            if (productInCart) {
                productInCart.quantity++
                result = await this.dao.incrementProductInCart(cart.id, productInCart.model)
            }
            else {
                productInCart = new ProductInCart(productInDB.model, 1, productInDB.category, productInDB.sellingPrice)
                cart.products.push(productInCart)

                if (cart.id) {
                    // Se il carrello esiste già aggiungo il nuovo prodotto
                    result = await this.dao.insertProductInCart(cart.id, productInCart)
                }
                else {
                    // Se il carrello non esiste lo creo e inserisco il prodotto
                    cart.id = await this.dao.createCart(cart)
                    console.log("Ho creato un carrello: " + JSON.stringify(cart, null, 2))
                    result = await this.dao.insertProductInCart(cart.id, productInCart)
                }
            }

            cart.total += productInDB.sellingPrice
            await this.dao.updateCartTotal(cart.id, cart.total)

            // update the product quantity in the product table
            await this.productDAO.changeProductQuantity(product, -1);

            return result
        }
        // catch the exception model doesn't exists
        catch (error) {
            if (error instanceof ProductNotAvailableError) {
                console.log(error.customMessage)
                throw error as ProductNotAvailableError
            }
            if (error instanceof ProductNotFoundError) {
                console.log(error.customMessage)
                throw error as ProductNotFoundError
            }
            throw error
        }
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> {
        return this.dao.getCurrentCart(user)
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User): Promise<Boolean> {
        try {
            const cart: Cart = await this.getCart(user)
            if (!cart.id) throw new CartNotFoundError()
            if (cart.products.length === 0) throw new EmptyCartError()
            let flag = await this.checkProductAvailabilityOfCart(cart)
            if (!flag) throw new ProductNotAvailableError()

            await this.dao.checkoutCart(cart)
            return true
        }
        catch (error) {
            throw error
        }
    }

    async checkProductAvailabilityOfCart(cart: Cart): Promise<boolean> {
        for (let product of cart.products) {
            let qta = (await this.productDAO.getProduct(product.model)).quantity
            if (product.quantity > qta) {
                return false;
            }
        }

        return true;
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User) { } /**Promise<Cart[]> */

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string) /**Promise<Boolean> */ { }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User)/*:Promise<Boolean> */ { }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts() /**Promise<Boolean> */ { }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts() /*:Promise<Cart[]> */ { }
}

export default CartController