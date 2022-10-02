import express from "express";

import * as categoriesController from '../controllers/categories.controllers.js';
import Validation from '../middleware/validation.middleware.js';

import * as categoriesSchemas from '../schemas/categories.schemas.js';

const categoriesRouter = express.Router();

categoriesRouter.get('/categories', categoriesController.listCategories);
categoriesRouter.post('/categories',
    Validation.validateSchema(categoriesSchemas.categorySchema, 'req.body'),
    categoriesController.addCategories
);

export default categoriesRouter;