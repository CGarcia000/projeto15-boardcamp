import connection from '../db/psql.js';
import dayjs from 'dayjs';

export async function listRentals(req, res) {
    const { customerId, gameId } = req.query;

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
}

export async function addRental(req, res) {
    const { validation } = res.locals;

    try {
        //verifica ids
        const customer = await connection.query(
            'SELECT id FROM public."customers" WHERE "id" = $1;',
            [validation.value.customerId]
        );
        if (customer.rows.length === 0) {
            res.status(400).send({ message: 'user not found' });
            return;
        }

        const { rows: game } = await connection.query(
            'SELECT id, "pricePerDay", "stockTotal" FROM public."games" WHERE "id" = $1;',
            [validation.value.gameId]
        );
        if (game.length === 0) {
            res.status(400).send({ message: "game not found" });
            return;
        }
        // verifica se tem jogos disponíveis
        const { rows: gamesRented } = await connection.query(
            `SELECT 
                "id", "customerId", "gameId", "returnDate"
                    FROM public."rentals"
                WHERE "rentals"."gameId" = $1
                    AND "rentals"."returnDate" IS NULL;`,
            [validation.value.gameId]
        );
        if (gamesRented.length >= game[0].stockTotal) {
            res.status(400).send({ message: 'this game is not available at the moment' })
            return;
        }

        await connection.query(
            `INSERT INTO public."rentals"
                ("customerId",
                "gameId",
                "rentDate",
                "daysRented",
                "originalPrice") 
                VALUES ($1, $2, $3, $4, $5);`,
            [
                validation.value.customerId,
                validation.value.gameId,
                new Date(),
                validation.value.daysRented,
                game[0].pricePerDay * validation.value.daysRented
            ]
        );

        res.sendStatus(201);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function endRental(req, res) {
    const { id } = res.locals;

    try {
        const { rows: rent } = await connection.query(
            `SELECT "rentDate", "daysRented", "returnDate", "originalPrice"
                FROM public."rentals" WHERE "id" = $1;`,
            [id]
        );
        if (rent.length === 0) {
            res.status(404).send({ message: 'rental not found' });
            return;
        } else if (rent[0].returnDate !== null) {
            res.status(400).send({ message: 'rental already closed' });
            return;
        }
        const returnDate = new Date();
        const timeRent = dayjs(returnDate).diff(dayjs(rent[0].rentDate), 'days');
        if (timeRent >= rent[0].daysRented) {
            const extra = timeRent - rent[0].daysRented;
            const pricePerDay = rent[0].originalPrice / rent[0].daysRented;
            const delayFee = extra * pricePerDay;


            await connection.query(
                `UPDATE "rentals" SET "returnDate"=$1, "delayFee"=$2 WHERE id= $3;`,
                [returnDate, delayFee, id]
            );
            res.sendStatus(200);
            return;
        }
        await connection.query(
            `UPDATE "rentals" SET "returnDate"=$1 WHERE id= $2;`,
            [returnDate, id]
        );

        res.sendStatus(200);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function removeRental(req, res) {
    const { id } = res.locals;

    try {
        const { rows: rent } = await connection.query(
            `SELECT "rentDate", "daysRented", "returnDate", "originalPrice"
                FROM public."rentals" WHERE "id" = $1;`,
            [id]
        );
        if (rent.length === 0) {
            res.status(404).send({ message: 'rental not found' });
            return;
        } else if (rent[0].returnDate === null) {
            res.status(400).send({ message: 'rental not closed yet' });
            return;
        }

        await connection.query(
            `DELETE FROM public."rentals" WHERE "rentals".id = $1;`,
            [id]
        );

        res.sendStatus(200);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}