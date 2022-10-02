import connection from '../db/psql.js';
import dayjs from 'dayjs';

export async function listCustomers(req, res) {
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
}

export async function listCustomerId(req, res) {
    const { id } = res.locals;

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
}

export async function addCustomer(req, res) {
    const { validation } = res.locals;

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
}

export async function editCustomer(req, res) {
    const { validation, id } = res.locals;

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
        // verifica cpf
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
}

