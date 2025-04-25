import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Mutuelle } from '../entities/Mutuelle';
import { Assure } from '../entities/Assure';
import { Dossier } from '../entities/Dossier';
import { Justificatif } from '../entities/Justificatif';
import { Offre } from '../entities/Offre';
import { Message } from '../entities/Message';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'mutuelles',
    synchronize: true,
    logging: true,
    entities: [Mutuelle, Assure, Dossier, Justificatif, Offre, Message],
    migrations: [],
    subscribers: [],
});
