import connection from '../db/psql.js';

export async function listGames(req, res) {
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
}

export async function addGames(req, res) {
    const { validation } = res.locals;

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
}