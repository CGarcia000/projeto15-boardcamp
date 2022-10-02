import joi from 'joi';

const gameSchema = joi.object({
    name: joi.string().required().trim(),
    image: joi.string().trim().allow(null).allow(''),
    stockTotal: joi.number().min(1).required(),
    categoryId: joi.number().min(1).required(),
    pricePerDay: joi.number().min(1).required(),
})

export { gameSchema };