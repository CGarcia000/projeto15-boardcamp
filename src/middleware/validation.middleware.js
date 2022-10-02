export default class Validation {
    static validateSchema(schema, objReq) {
        return async (req, res, next) => {
            let validation;
            if (objReq === 'req.body') {
                validation = schema.validate(req.body, { abortEarly: false });
            } else {
                validation = schema.validate(objReq, { abortEarly: false });
            }

            if (validation.error) {
                const errors = validation.error.details.map(detail => detail.message);
                res.status(400).send(errors);
                return;
            }
            res.locals.validation = validation;
            next();
            return;
        }
    }
}
