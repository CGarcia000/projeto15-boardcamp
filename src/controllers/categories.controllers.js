import connection from '../db/psql.js';

export async function listCategories(req, res) {
    try {
        const { rows: categories } = await connection.query('SELECT * FROM public."categories"');
        res.send(categories);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
        return;
    }
}

export async function addCategories(req, res) {
    const { validation } = res.locals;

    try {

        const { rows: categories } = await connection.query(
            'SELECT * FROM public."categories" WHERE "name" = $1;',
            [validation.value.name]
        );
        if (categories.length === 0) {
            await connection.query(
                'INSERT INTO public."categories" ("name") VALUES ($1);',
                [validation.value.name]
            )
            res.sendStatus(201);
            return;
        }
        res.status(409).send({ message: "name already being used" });
        return;
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
        return;
    }
}