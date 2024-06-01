import { jest, describe, beforeEach, test, expect } from '@jest/globals';

import express from 'express';

import ErrorHandler from '../src/helper';
import Authenticator from '../src/routers/auth';
import { UserRoutes, AuthRoutes } from '../src/routers/userRoutes';
import ProductRoutes from '../src/routers/productRoutes';
import CartRoutes from '../src/routers/cartRoutes';
import ReviewRoutes from '../src/routers/reviewRoutes';
import initRoutes from '../src/routes';
const morgan = require('morgan');

jest.mock('express', () => {
    return jest.fn(() => ({
        use: jest.fn(),
    }))
});

jest.mock('morgan');
jest.mock('../src/helper');
jest.mock('../src/routers/auth');
jest.mock('../src/routers/userRoutes');
jest.mock('../src/routers/productRoutes');
jest.mock('../src/routers/cartRoutes');
jest.mock('../src/routers/reviewRoutes');

describe('initRoutes', () => {
    test.skip('should initialize the app', () => {
        let app: express.Application = express();
        jest.spyOn(app, 'use');

        initRoutes(app);

        expect(morgan).toHaveBeenCalledWith('dev');

        const authenticator = new Authenticator(app);
        const userRoutes = new UserRoutes(authenticator);
        const authRoutes = new AuthRoutes(authenticator);
        const productRoutes = new ProductRoutes(authenticator);
        const cartRoutes = new CartRoutes(authenticator);
        const reviewRoutes = new ReviewRoutes(authenticator);

        expect(app.use).toHaveBeenCalledWith('/ezelectronics/users', userRoutes.getRouter());
        expect(app.use).toHaveBeenCalledWith('/ezelectronics/sessions', authRoutes.getRouter());
        expect(app.use).toHaveBeenCalledWith('/ezelectronics/products', productRoutes.getRouter());
        expect(app.use).toHaveBeenCalledWith('/ezelectronics/carts', cartRoutes.getRouter());
        expect(app.use).toHaveBeenCalledWith('/ezelectronics/reviews', reviewRoutes.getRouter());
        expect(ErrorHandler.registerErrorHandler).toHaveBeenCalledWith(app);
    });
});