import express from "express";
import cors from "cors";

import connection from './db/psql.js';

//Routes
import router from './routes/index.js'

const server = express();

server.use(cors());
server.use(express.json());

server.use(router);


server.listen(4000, () => {
    console.log('Acessar http://localhost:4000');
    console.log('Servidor executando na porta 4000');
})