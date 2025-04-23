import { DataSource } from 'typeorm';
import { Mutuelle } from '../entities/Mutuelle';
import { Assure } from '../entities/Assure';
import { Offre } from '../entities/Offre';
import { Dossier } from '../entities/Dossier';
import { Message } from '../entities/Message';
import { Justificatif } from '../entities/Justificatif';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "admin",
    database: process.env.DB_DATABASE || "mutuelles",
    synchronize: true,
    logging: true,
    entities: [Mutuelle, Assure, Offre, Dossier, Message, Justificatif],
    migrations: [],
    subscribers: [],
}); 