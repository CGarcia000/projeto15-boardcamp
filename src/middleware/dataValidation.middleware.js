export async function idValidation(req, res, next) {
    const { id } = req.params;
    if (isNaN(id)) {
        res.status(406).send({ message: 'id not valid' });
        return;
    }
    res.locals.id = id;
    next();
    return;
}