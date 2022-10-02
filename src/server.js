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
})

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
import dayjs from 'dayjs';
import joiDate from '@joi/date';

const Joi = joi.extend(joiDate);


const customerSchema = joi.object({
    name: joi.string().required().trim(),
    phone: joi.string().required().trim(),
    cpf: joi.string().length(11).required().trim(),
    birthday: Joi.date().format('YYYY-MM-DD').required(),
})

const customerUpdateSchema = joi.object({
    name: joi.string().trim(),
    phone: joi.string().trim(),
    cpf: joi.string().length(11).trim(),
    birthday: Joi.date().format('YYYY-MM-DD').required(),
})

server.get('/customers', async (req, res) => {
    const { cpf } = req.query;

    try {
        let addQuery = '';
        if (cpf) {
            addQuery += `WHERE "cpf" LIKE '${cpf}%'`;
        }
        const customers = await connection.query(
            'SELECT * from public."customers" ' + addQuery + ';');
        customers.rows.forEach(element => {
            element.birthday = dayjs(element.birthday).format('YYYY-MM-DD');
        });
        res.send(customers.rows);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.get('/customers/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        res.status(406).send({ message: 'user id not valid' });
        return;
    }

    try {
        const customer = await connection.query(
            `SELECT * from public."customers" WHERE "id" = $1 LIMIT 1;`, [id]
        );
        customer.rows.forEach(element => {
            element.birthday = dayjs(element.birthday).format('YYYY-MM-DD');
        });
        if (customer.rows.length === 0) {
            res.status(404).send({ message: 'user not found' });
            return;
        }
        res.send(customer.rows);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/customers', async (req, res) => {
    // middleware
    const validation = customerSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(400).send(errors);
        return;
    }

    if (isNaN(validation.value.phone) || isNaN(validation.value.cpf)) {
        res.status(400).send({ message: 'phone and cpf values must be numbers' });
        return;
    }
    if (10 > validation.value.phone.length && validation.value.phone.length > 11) {
        res.status(400).send({ message: 'phone value must have length of 10 or 11 digits' });
        return;
    }
    //

    try {
        // verifica cpf 
        const cpfInvalid = await connection.query(
            `SELECT "cpf" FROM "customers" WHERE "cpf" = $1 LIMIT 1`,
            [validation.value.cpf]
        );
        if (cpfInvalid.rows.length > 0) {
            res.status(409).send({ message: 'data invalid' });
            return;
        }

        await connection.query(
            'INSERT INTO "customers" ("name", "phone", "cpf", "birthday") VALUES ($1, $2, $3, $4);',
            [
                validation.value.name,
                validation.value.phone,
                validation.value.cpf,
                validation.value.birthday,
            ]
        );
        res.sendStatus(201);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.put('/customers/:id', async (req, res) => {
    const { id } = req.params;

    // criar middleware
    const validation = customerUpdateSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(400).send(errors);
        return;
    }
    if (validation.value.phone) {
        if (isNaN(validation.value.phone) || (validation.value.cpf && isNaN(validation.value.cpf))) {
            res.status(400).send({ message: 'phone and cpf values must be numbers' });
            return;
        }
        if (10 > validation.value.phone.length && validation.value.phone.length > 11) {
            res.status(400).send({ message: 'phone value must have length of 10 or 11 digits' });
            return;
        }
    }
    //

    try {
        // verifica cpf (pode ser middleware?)
        const cpfInvalid = await connection.query(
            `SELECT "cpf" FROM "customers" WHERE "cpf" = $1 LIMIT 1`,
            [validation.value.cpf]
        );
        if (cpfInvalid.rows.length > 0) {
            res.status(409).send({ message: 'data invalid' });
            return;
        }

        // verifica customer
        const customer = await connection.query(
            `SELECT * FROM "customers" WHERE id = $1;`, [id]
        );
        if (customer.rows.length === 0) {
            res.status(404).send({ message: 'user not found' });
            return;
        }

        const keysArr = Object.keys(validation.value);
        let queryAdd = [];
        keysArr.forEach((key, index) => {
            if (customer.rows[0][key] !== validation.value[key]) {
                if (key === 'birthday') {
                    queryAdd.push(`"${key}"='${dayjs(validation.value[key]).format('YYYY-MM-DD')}'`);
                } else {
                    queryAdd.push(`"${key}"='${validation.value[key]}'`);
                }
            }
        });
        queryAdd = queryAdd.join(', ');

        await connection.query(
            `UPDATE "customers" SET ${queryAdd} WHERE id= $1;`,
            [id]
        );
        res.sendStatus(201);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

// rentals

server.get('/rentals', async (req, res) => {
    const { customerId, gameId } = req.query;
    console.log(customerId);
    if (customerId) console.log(customerId);

    try {
        const rentals = await connection.query('SELECT * from public."rentals";');
        let customers;
        if (customerId) {
            customers = await connection.query(
                'SELECT "id", "name" from public."customers" WHERE "customers".id = $1;',
                [customerId]
            );
        } else {
            customers = await connection.query('SELECT "id", "name" from public."customers";');
            console.log(customers);
        }
        let games;
        if (gameId) {
            games = await connection.query(
                `SELECT 
                    public."games"."id",
                    public."games"."name", 
                    public."games"."categoryId",  
                    public."categories"."name" AS "categoryName" 
                        FROM public."games"
                    JOIN public."categories" ON 
                        "categories"."id" = "games"."categoryId"
                    WHERE "games".id = $1;`,
                [gameId]
            );
        } else {
            games = await connection.query(
                `SELECT 
                    public."games"."id",
                    public."games"."name", 
                    public."games"."categoryId",  
                    public."categories"."name" AS "categoryName" 
                        FROM public."games"
                    JOIN public."categories" ON 
                        "categories"."id" = "games"."categoryId";`);
        }
        const rentalsRes = [];
        rentals.rows.forEach(element => {
            //todo - corrigir format data
            const customer = customers.rows.filter(elem => elem.id === element.customerId);
            if (customer.length === 0) return;
            const game = games.rows.filter(elem => elem.id === element.gameId);
            if (game.length === 0) return;
            element.customer = customer[0];
            element.game = game[0];
            rentalsRes.push(element);
        });
        res.send(rentalsRes);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


server.listen(4000, () => {
    console.log('Acessar http://localhost:4000');
    console.log('Servidor executando na porta 4000');
})