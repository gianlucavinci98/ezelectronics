import { describe, test, expect, beforeEach, beforeAll, jest } from "@jest/globals"

import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import { Cart, ProductInCart } from "../../src/components/cart"
import CartDAO from "../../src/dao/cartDAO"
import ProductDAO from "../../src/dao/productDAO"
import CartController from "../../src/controllers/cartController"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"

jest.mock('../../src/dao/cartDAO')
jest.mock('../../src/dao/productDAO')

const controller = new CartController()
const user = new User("customer", "customer", "customer", Role.CUSTOMER, "address", "2000-01-01")

beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

describe('addToCart', () => {
    test("success with existing cart and product not in cart", async () => {
        const model = "product"
        const product = new Product(10, model, Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [], 1)

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_insertProductInCart = jest.spyOn(CartDAO.prototype, "insertProductInCart").mockResolvedValueOnce(true)
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal").mockResolvedValueOnce(true)
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart")

        await expect(controller.addToCart(user, model)).resolves.toBe(true)

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_insertProductInCart).toHaveBeenCalledTimes(1)
        expect(mock_insertProductInCart).toHaveBeenCalledWith(cart.id, new ProductInCart(model, 1, product.category, product.sellingPrice))

        expect(mock_updatecarttotal).toHaveBeenCalledTimes(1)
        expect(mock_updatecarttotal).toHaveBeenCalledWith(cart.id, product.sellingPrice)

        expect(mock_createCart).not.toHaveBeenCalled()
    })

    test("success with existing cart and product in cart", async () => {
        const model = "product"
        const product = new Product(10, model, Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            0,
            [new ProductInCart(model, 1, product.category, product.sellingPrice)],
            1
        )

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart").mockResolvedValueOnce(true)
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal").mockResolvedValueOnce(true)
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart")

        await expect(controller.addToCart(user, model)).resolves.toBe(true)

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).toHaveBeenCalledTimes(1)
        expect(mock_incrementProductInCart).toHaveBeenCalledWith(cart.id, model, 1)

        expect(mock_updatecarttotal).toHaveBeenCalledTimes(1)
        expect(mock_updatecarttotal).toHaveBeenCalledWith(cart.id, product.sellingPrice)

        expect(mock_createCart).not.toHaveBeenCalled()
    })

    test("success with no cart", async () => {
        const model = "product"
        const product = new Product(10, model, Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            0,
            []
        )

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce(1)
        const mock_insertProductInCart = jest.spyOn(CartDAO.prototype, "insertProductInCart").mockResolvedValueOnce(true)
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal").mockResolvedValueOnce(true)

        await expect(controller.addToCart(user, model)).resolves.toBe(true)

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_createCart).toHaveBeenCalledTimes(1)
        expect(mock_createCart).toHaveBeenCalledWith(cart)

        expect(mock_insertProductInCart).toHaveBeenCalledTimes(1)
        expect(mock_insertProductInCart).toHaveBeenCalledWith(1, new ProductInCart(model, 1, product.category, product.sellingPrice))

        expect(mock_updatecarttotal).toHaveBeenCalledTimes(1)
        expect(mock_updatecarttotal).toHaveBeenCalledWith(1, product.sellingPrice)
    })

    test("error with product not available", async () => {
        const model = "product"

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(new Product(10, model, Category.SMARTPHONE, "2020-01-01", "details", 0))
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart")
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart")
        const mock_insertProductInCart = jest.spyOn(CartDAO.prototype, "insertProductInCart")
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")

        await expect(controller.addToCart(user, model)).rejects.toThrow(new EmptyProductStockError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).not.toHaveBeenCalled()
        expect(mock_createCart).not.toHaveBeenCalled()
        expect(mock_insertProductInCart).not.toHaveBeenCalled()
        expect(mock_updatecarttotal).not.toHaveBeenCalled()
    })

    test("error with product not found", async () => {
        const model = "product"

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new ProductNotFoundError())
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart")
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart")
        const mock_insertProductInCart = jest.spyOn(CartDAO.prototype, "insertProductInCart")
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")

        await expect(controller.addToCart(user, model)).rejects.toThrow(new ProductNotFoundError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).not.toHaveBeenCalled()
        expect(mock_createCart).not.toHaveBeenCalled()
        expect(mock_insertProductInCart).not.toHaveBeenCalled()
        expect(mock_updatecarttotal).not.toHaveBeenCalled()
    })

    test("error in dao is propagated", async () => {
        const model = "product"

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart")
        const mock_createCart = jest.spyOn(CartDAO.prototype, "createCart")
        const mock_insertProductInCart = jest.spyOn(CartDAO.prototype, "insertProductInCart")
        const mock_updatecarttotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")

        await expect(controller.addToCart(user, model)).rejects.toThrow(new Error())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).not.toHaveBeenCalled()
        expect(mock_createCart).not.toHaveBeenCalled()
        expect(mock_insertProductInCart).not.toHaveBeenCalled()
        expect(mock_updatecarttotal).not.toHaveBeenCalled()
    })
})

describe('getCart', () => {
    test("success", async () => {
        const cart = new Cart("customer", false, "", 0, [], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        await expect(controller.getCart(user)).resolves.toEqual(cart)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
    })

    test("error in dao is propagated", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockRejectedValueOnce(new Error())
        await expect(controller.getCart(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
    })
})

describe('checkoutCart', () => {
    test("success", async () => {
        const cart = new Cart("customer", false, "", 0, [new ProductInCart("product", 1, Category.SMARTPHONE, 20)], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true)

        const mock_checkproductavailability = jest.spyOn(CartController.prototype, "checkProductAvailabilityOfCart").mockResolvedValueOnce(true)

        await expect(controller.checkoutCart(user)).resolves.toBe(true)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(mock_checkproductavailability).toHaveBeenCalledTimes(1)
        expect(mock_checkproductavailability).toHaveBeenCalledWith(cart)
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(cart)
    })

    test("error with no cart", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart("customer", false, "", 0, []))
        jest.spyOn(CartDAO.prototype, "checkoutCart")

        await expect(controller.checkoutCart(user)).rejects.toThrow(new CartNotFoundError())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.checkoutCart).not.toHaveBeenCalled()
    })

    test("error with empty cart", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart("customer", false, "", 0, [], 1))
        jest.spyOn(CartDAO.prototype, "checkoutCart")

        await expect(controller.checkoutCart(user)).rejects.toThrow(new EmptyCartError())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.checkoutCart).not.toHaveBeenCalled()
    })

    test("error with products not available", async () => {
        const cart = new Cart("customer", false, "", 0, [new ProductInCart("product", 1, Category.SMARTPHONE, 20)], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "checkoutCart")

        const mock_checkproductavailability = jest.spyOn(CartController.prototype, "checkProductAvailabilityOfCart").mockResolvedValueOnce(false)

        await expect(controller.checkoutCart(user)).rejects.toThrow(new LowProductStockError())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(mock_checkproductavailability).toHaveBeenCalledTimes(1)
        expect(mock_checkproductavailability).toHaveBeenCalledWith(cart)
        expect(CartDAO.prototype.checkoutCart).not.toHaveBeenCalled()
    })

    test("error in dao is propagated 1", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockRejectedValueOnce(new Error())
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true)

        const mock_checkproductavailability = jest.spyOn(CartController.prototype, "checkProductAvailabilityOfCart")

        await expect(controller.checkoutCart(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(mock_checkproductavailability).not.toHaveBeenCalled()
        expect(CartDAO.prototype.checkoutCart).not.toHaveBeenCalled()
    })

    test("error in dao is propagated 2", async () => {
        const cart = new Cart("customer", false, "", 0, [new ProductInCart("product", 1, Category.SMARTPHONE, 20)], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockRestore()
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValue(new Error())

        const mock_checkproductavailability = jest.spyOn(CartController.prototype, "checkProductAvailabilityOfCart").mockResolvedValueOnce(true)

        await expect(controller.checkoutCart(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(mock_checkproductavailability).toHaveBeenCalledTimes(1)
        expect(mock_checkproductavailability).toHaveBeenCalledWith(cart)
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(cart)
    })
})

describe('checkProductAvailabilityOfCart', () => {
    test("success", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [new ProductInCart(product.model, 1, Category.SMARTPHONE, product.sellingPrice)], 1)

        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.checkProductAvailabilityOfCart(cart)).resolves.toBe(true)
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1)
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(product.model)
        expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error with product not available", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 1)
        const cart = new Cart("customer", false, "", product.sellingPrice * 2, [new ProductInCart(product.model, 2, Category.SMARTPHONE, product.sellingPrice)], 1)

        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.checkProductAvailabilityOfCart(cart)).resolves.toBe(false)
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1)
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(product.model)
        expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error in dao is propagated", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [new ProductInCart(product.model, 1, Category.SMARTPHONE, product.sellingPrice)], 1)

        jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new Error())
        jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.checkProductAvailabilityOfCart(cart)).rejects.toThrow(new Error())
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1)
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(product.model)
        expect(ProductDAO.prototype.changeProductQuantity).not.toHaveBeenCalled()
    })
})

describe('getCustomerCarts', () => {
    test("success", async () => {
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([])
        await expect(controller.getCustomerCarts(user)).resolves.toEqual([])
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(user)
    })

    test("error in dao is propagated", async () => {
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error())
        await expect(controller.getCustomerCarts(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(user)
    })
})

describe('removeProductFromCart', () => {
    test("success with product removal", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            product.sellingPrice,
            [new ProductInCart(product.model, 1, Category.SMARTPHONE, product.sellingPrice)],
            1
        )

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true)
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal").mockResolvedValueOnce(true)
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, product.model)).resolves.toBe(true)

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(product.model)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).not.toHaveBeenCalled()

        expect(mock_deleteproductfromcart).toHaveBeenCalledTimes(1)
        expect(mock_deleteproductfromcart).toHaveBeenCalledWith(cart.id, product.model)

        expect(mock_updateCartTotal).toHaveBeenCalledTimes(1)
        expect(mock_updateCartTotal).toHaveBeenCalledWith(cart.id, 0)

        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("success with product decrement", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            product.sellingPrice,
            [new ProductInCart(product.model, 2, Category.SMARTPHONE, product.sellingPrice)],
            1
        )

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart").mockResolvedValueOnce(true)
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal").mockResolvedValueOnce(true)
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, product.model)).resolves.toBe(true)

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(product.model)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).toHaveBeenCalledTimes(1)
        expect(mock_incrementProductInCart).toHaveBeenCalledWith(cart.id, product.model, -1)

        expect(mock_deleteproductfromcart).not.toHaveBeenCalled()

        expect(mock_updateCartTotal).toHaveBeenCalledTimes(1)
        expect(mock_updateCartTotal).toHaveBeenCalledWith(cart.id, 0)

        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error with product doesn't exist", async () => {
        const model = "product"

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockRejectedValueOnce(new ProductNotFoundError())
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart")
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, model)).rejects.toThrow(new ProductNotFoundError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)
        expect(mock_getproduct).toHaveBeenCalledWith(model)

        expect(mock_getCurrentCart).not.toHaveBeenCalled()
        expect(mock_incrementProductInCart).not.toHaveBeenCalled()
        expect(mock_deleteproductfromcart).not.toHaveBeenCalled()
        expect(mock_updateCartTotal).not.toHaveBeenCalled()
        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error with no open cart", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [])

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")


        await expect(controller.removeProductFromCart(user, product.model)).rejects.toThrow(new CartNotFoundError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).not.toHaveBeenCalled()
        expect(mock_deleteproductfromcart).not.toHaveBeenCalled()
        expect(mock_updateCartTotal).not.toHaveBeenCalled()
        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error with product not in cart", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            0,
            [new ProductInCart("anotherproduct", 1, Category.SMARTPHONE, 20)],
            1
        )

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, product.model)).rejects.toThrow(new ProductNotInCartError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).not.toHaveBeenCalled()
        expect(mock_deleteproductfromcart).not.toHaveBeenCalled()
        expect(mock_updateCartTotal).not.toHaveBeenCalled()
        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error with no products in cart", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [], 1)

        const mock_getproduct = jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        const mock_getCurrentCart = jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_deleteproductfromcart = jest.spyOn(CartDAO.prototype, "deleteProductFromCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, product.model)).rejects.toThrow(new CartNotFoundError())

        expect(mock_getproduct).toHaveBeenCalledTimes(1)

        expect(mock_getCurrentCart).toHaveBeenCalledTimes(1)
        expect(mock_getCurrentCart).toHaveBeenCalledWith(user)

        expect(mock_incrementProductInCart).not.toHaveBeenCalled()
        expect(mock_deleteproductfromcart).not.toHaveBeenCalled()
        expect(mock_updateCartTotal).not.toHaveBeenCalled()
        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })

    test("error in dao is propagated", async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart(
            "customer",
            false,
            "",
            product.sellingPrice,
            [new ProductInCart(product.model, 1, Category.SMARTPHONE, product.sellingPrice)],
            1
        )

        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(product)
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockRejectedValueOnce(new Error())

        const mock_incrementProductInCart = jest.spyOn(CartDAO.prototype, "incrementProductInCart")
        const mock_updateCartTotal = jest.spyOn(CartDAO.prototype, "updateCartTotal")
        const mock_changeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")

        await expect(controller.removeProductFromCart(user, product.model)).rejects.toThrow(new Error())

        expect(mock_incrementProductInCart).not.toHaveBeenCalled()
        expect(mock_updateCartTotal).not.toHaveBeenCalled()
        expect(mock_changeProductQuantity).not.toHaveBeenCalled()
    })
})

describe('clearCart', () => {
    test('success', async () => {
        const product = new Product(10, "product", Category.SMARTPHONE, "2020-01-01", "details", 20)
        const cart = new Cart("customer", false, "", 0, [new ProductInCart(product.model, 2, Category.SMARTPHONE, product.sellingPrice)], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true)

        await expect(controller.clearCart(user)).resolves.toBe(true)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(cart.id)
    })

    test('error with no cart', async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart("customer", false, "", 0, []))
        jest.spyOn(CartDAO.prototype, "clearCart")

        await expect(controller.clearCart(user)).rejects.toThrow(new CartNotFoundError())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.clearCart).not.toHaveBeenCalled()
    })

    test('error with empty cart', async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart("customer", false, "", 0, [], 1))
        jest.spyOn(CartDAO.prototype, "clearCart")

        await expect(controller.clearCart(user)).rejects.toThrow(new EmptyCartError())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.clearCart).not.toHaveBeenCalled()
    })

    test('error in dao is propagated 1', async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockRejectedValueOnce(new Error())
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true)

        await expect(controller.clearCart(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.clearCart).not.toHaveBeenCalled()
    })

    test('error in dao is propagated 2', async () => {
        const cart = new Cart("customer", false, "", 0, [new ProductInCart("product", 1, Category.SMARTPHONE, 20)], 1)

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(cart)
        jest.spyOn(CartDAO.prototype, "clearCart").mockRestore()
        jest.spyOn(CartDAO.prototype, "clearCart").mockRejectedValueOnce(new Error())

        await expect(controller.clearCart(user)).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(user)
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(cart.id)
    })
})

describe('deleteAllCarts', () => {
    test('success', async () => {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true)
        await expect(controller.deleteAllCarts()).resolves.toBe(true)
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
    })

    test('error in dao is propagated', async () => {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error())
        await expect(controller.deleteAllCarts()).rejects.toThrow(new Error())
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
    })
})

describe('getAllCarts', () => {
    test('success', async () => {
        const carts = [new Cart("customer", false, "", 0, [], 1)]

        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(carts)
        await expect(controller.getAllCarts()).resolves.toEqual(carts)
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1)
    })

    test('error in dao is propagated', async () => {
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValueOnce(new Error())
        await expect(controller.getAllCarts()).rejects.toThrow(new Error())
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1)
    })
})
