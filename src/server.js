import express from "express";
import cors from "cors";

import connection from './db/psql.js';

//Routes
// import router from './routes/index.js'

const server = express();

server.use(cors());
server.use(express.json());

// server.use(router);

// Categories
import joi from 'joi';

const categorySchema = joi.object({
    name: joi.string().required().trim(),
})

server.get('/categories', async (req, res) => {
    try {
        const categories = await connection.query('SELECT * FROM public."categories"');
        res.send(categories.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/categories', async (req, res) => {
    const validation = categorySchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(400).send(errors);
        return;
    }

    try {

        const categories = await connection.query(
            'SELECT * FROM public."categories" WHERE "name" = $1;',
            [validation.value.name]
        );
        if (categories.rows.length === 0) {
            await connection.query(
                'INSERT INTO public."categories" ("name") VALUES ($1);',
                [validation.value.name]
            )
            res.sendStatus(201);
            return;
        }
        res.status(409).send({ message: "name already being used" })
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
})

// Games

const gameSchema = joi.object({
    name: joi.string().required().trim(),
    image: joi.string().trim().allow(null).allow(''),
    stockTotal: joi.number().min(1).required(),
    categoryId: joi.number().min(1).required(),
    pricePerDay: joi.number().min(1).required(),
}).options({ stripUnknown: true });

server.get('/games', async (req, res) => {
    try {
        const games = await connection.query(
            `SELECT public."games".*, 
                public."categories"."name" AS "categoryName"
                    FROM public."games"
                JOIN public."categories" ON 
                    "categories"."id" = "games"."categoryId";`);
        res.send(games.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/games', async (req, res) => {
    const validation = gameSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(400).send(errors);
        return;
    }

    try {
        // verifica categoria
        const category = await connection.query(
            'SELECT id FROM public."categories" WHERE "id" = $1;',
            [validation.value.categoryId]
        );
        if (category.rows.length === 0) {
            res.status(404).send({ message: 'category not found' });
            return;
        }

        // verifica nome
        const gameName = await connection.query(
            'SELECT "name" FROM public."games" WHERE LOWER("name") = $1;',
            [validation.value.name.toLowerCase()]
        );
        if (gameName.rows.length > 0) {
            res.status(409).send({ message: "game name already being used" });
            return;
        }

        // trata image null
        if (!validation.value.image) {
            await connection.query(
                `INSERT INTO "games" 
                ("name", 
                 "stockTotal", 
                 "categoryId", 
                 "pricePerDay") 
                 VALUES 
                    ($1, $2, $3, $4);`,
                [
                    validation.value.name,
                    validation.value.stockTotal,
                    validation.value.categoryId,
                    validation.value.pricePerDay,
                ]
            );
            res.sendStatus(201);
            return;
        } else {
            await connection.query(
                `INSERT INTO "games" 
                ("name", 
                 "stockTotal", 
                 "categoryId", 
                 "pricePerDay",
                 "image") 
                 VALUES 
                    ($1, $2, $3, $4, $5);`,
                [
                    validation.value.name,
                    validation.value.stockTotal,
                    validation.value.categoryId,
                    validation.value.pricePerDay,
                    validation.value.image,
                ]
            );
            res.sendStatus(201);
            return;
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


// customers

server.get('/games', async (req, res) => {
    try {
        const games = await connection.query(
            `SELECT public."games".*, 
                public."categories"."name" AS "categoryName"
                    FROM public."games"
                JOIN public."categories" ON 
                    "categories"."id" = "games"."categoryId";`);
        res.send(games.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


server.listen(4000, () => {
    console.log('Acessar http://localhost:4000');
    console.log('Servidor executando na porta 4000');
})