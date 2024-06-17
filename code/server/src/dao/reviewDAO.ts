import { User } from '../components/user';
import { ProductReview } from '../components/review';
import { ExistingReviewError } from '../errors/reviewError';
import { ProductNotFoundError } from '../errors/productError';
import db from "../db/db"

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    existingReview(model: string, user: User): Promise<boolean> {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM review WHERE model = ? AND user = ?', [model, user.username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row !== undefined);
                }
            });
        });
    }

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM review WHERE model = ?', [model], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as ProductReview[]);
                }
            });
        });
    }
    addReview(model: string, user: User, score: number, date: string, comment: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO review (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)', [model, user.username, score, date, comment], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM review WHERE model = ? AND user = ?', [model, user.username], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM review WHERE model = ?', [model], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    deleteAllReviews(): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM review', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export default ReviewDAO;