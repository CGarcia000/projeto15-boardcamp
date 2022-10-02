import express from "express";

import * as customersController from '../controllers/customers.controllers.js';
import Validation from '../middleware/validation.middleware.js';
import * as dataValidation from '../middleware/dataValidation.middleware.js'

import * as customersSchemas from '../schemas/customers.schemas.js';

const customersRouter = express.Router();

customersRouter.get('/customers', customersController.listCustomers);
customersRouter.get('/customers/:id', dataValidation.idValidation, customersController.listCustomerId);
customersRouter.post('/customers',
    Validation.validateSchema(customersSchemas.customerSchema, 'req.body'),
    customersController.addCustomer
);
customersRouter.put('/customers/:id',
    dataValidation.idValidation,
    Validation.validateSchema(customersSchemas.customerUpdateSchema, 'req.body'),
    customersController.editCustomer
);

export default customersRouter;