import joi from 'joi';
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

export { customerSchema, customerUpdateSchema };