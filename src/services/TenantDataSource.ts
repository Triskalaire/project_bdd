// src/services/TenantDataSource.ts
import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AppDataSource } from "../config/database";
import { Mutuelle }     from "../entities/Mutuelle";
import { Assure }       from "../entities/Assure";
import { Dossier }      from "../entities/Dossier";
import { Justificatif } from "../entities/Justificatif";
import { Offre }        from "../entities/Offre";
import { Message }      from "../entities/Message";

type PgoOpts = PostgresConnectionOptions;


const tenantDataSources = new Map<string, DataSource>();

export async function getTenantDataSource(mutuelleId: string): Promise<DataSource> {
    const schema = `tenant_${mutuelleId.replace(/-/g, '_')}`;

    // 1) Création du schema si nécessaire
    await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    // 2) On considère que notre DataSource principale est bien du Postgres
    const baseOpts = AppDataSource.options as PgoOpts;

    // 3) On reconstruit un objet de type PostgresConnectionOptions
    const tenantOpts: PgoOpts = {
        ...baseOpts,
        name: schema,
        schema,
        synchronize: true,
        logging: false,
        entities: [
            Mutuelle,
            Assure,
            Dossier,
            Justificatif,
            Offre,
            Message,
        ],
    };

    const ds = new DataSource(tenantOpts);
    await ds.initialize();
    return ds;
}