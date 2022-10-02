import express from "express";

import * as gamesController from '../controllers/games.controllers.js';
import Validation from '../middleware/validation.middleware.js';

import * as gamesSchemas from '../schemas/games.schemas.js';

const gamesRouter = express.Router();

gamesRouter.get('/games', gamesController.listGames);
gamesRouter.post('/games',
    Validation.validateSchema(gamesSchemas.gameSchema, 'req.body'),
    gamesController.addGames
);

export default gamesRouter;