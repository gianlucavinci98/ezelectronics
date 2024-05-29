import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import { ProductReview } from "../components/review";
import ProductDAO from "../dao/productDAO";
import { ProductNotFoundError } from "../errors/productError"
import { ExistingReviewError } from "../errors/reviewError";  
import { NoReviewProductError } from "../errors/reviewError";  
class ReviewController {
    private dao: ReviewDAO

    constructor() {
        this.dao = new ReviewDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string) /**:Promise<void> */ { 
         const productDAO = new ProductDAO();
        try {
            const product = await productDAO.getProduct(model);
        }
        catch (error) {
            throw new ProductNotFoundError();
        }
        const reviews = await this.dao.getProductReviews(model);
        
        if  (await this.dao.existingReview(model, user))
            throw new ExistingReviewError();
            
        
        const date = new Date().toISOString().split('T')[0];
        await this.dao.addReview(model, user, score, date, comment);
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) :Promise<ProductReview[]> { 
          
        const productDAO = new ProductDAO();
        try {
            const product = await productDAO.getProduct(model);
        }
        catch (error) {
            throw new ProductNotFoundError();
        }
        const reviews = await this.dao.getProductReviews(model);
        return reviews;
        
    }
    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User) :Promise<void> {
        const productDAO = new ProductDAO();
        try {
            const product = await productDAO.getProduct(model);
        }
        catch (error) {
            throw new ProductNotFoundError();
        }
        if  (!(await this.dao.existingReview(model, user)))
            throw new NoReviewProductError();
        await this.dao.deleteReview(model, user);
     }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string) :Promise<void> {
        const productDAO = new ProductDAO();
        try {
            const product = await productDAO.getProduct(model);
        }
        catch (error) {
            throw new ProductNotFoundError();
        }
        await this.dao.deleteReviewsOfProduct(model);
     }

    /**
     * Deletes all reviews of all existing products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews() :Promise<void> { 
        await this.dao.deleteAllReviews();
    }
}

export default ReviewController;