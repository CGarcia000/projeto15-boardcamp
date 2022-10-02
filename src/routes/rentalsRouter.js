import express from "express";

import * as rentalsController from '../controllers/rentals.controllers.js';
import Validation from '../middleware/validation.middleware.js';
import * as dataValidation from '../middleware/dataValidation.middleware.js'

import * as rentalsSchemas from '../schemas/rentals.schemas.js';


const rentalsRouter = express.Router();

rentalsRouter.get('/rentals', rentalsController.listRentals);
rentalsRouter.post('/rentals',
    Validation.validateSchema(rentalsSchemas.rentalSchema, 'req.body'),
    rentalsController.addRental
);
rentalsRouter.post('/rentals/:id/return',
    dataValidation.idValidation,
    rentalsController.endRental
);
rentalsRouter.delete('/rentals/:id',
    dataValidation.idValidation,
    rentalsController.removeRental
);

export default rentalsRouter;