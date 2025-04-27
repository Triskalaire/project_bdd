// src/services/TenantDataSource.ts
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AppDataSource } from '../config/database';
import { Mutuelle } from '../entities/Mutuelle';

// Cache par tenantId
const tenantDataSources: Record<string, DataSource> = {};

/**
 * Retourne (et initialise) une DataSource isolée pour le tenant `tenantId`.
 * Seed automatiquement la mutuelle dans son propre schema pour satisfaire les FKs.
 */
export async function getTenantDataSource(tenantId: string): Promise<DataSource> {
    // 1) Si déjà inité, on renvoie
    const existing = tenantDataSources[tenantId];
    if (existing?.isInitialized) {
        return existing;
    }

    // 2) Nom du schema : tenant_<uuid>
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // 3) Création du schema dans public
    await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 4) Récupération des options Postgres de l'AppDataSource
    const baseOpts = AppDataSource.options as PostgresConnectionOptions;

    // 5) Construction des options pour ce tenant
    const tenantOpts: PostgresConnectionOptions = {
        ...baseOpts,
        name:        schemaName,
        schema:      schemaName,
        synchronize: true,
        logging:     false,
        entities:    baseOpts.entities,
    };

    // 6) Initialisation de la DataSource tenant
    const tenantDs = new DataSource(tenantOpts);
    await tenantDs.initialize();

    // 7) Seed de la mutuelle dans son schema tenant
    const tenantRepo = tenantDs.getRepository(Mutuelle);
    const exists     = await tenantRepo.exist({ where: { id: tenantId } });
    if (!exists) {
        // on va chercher TOUTES les colonnes, dont motDePasse, dans le schema public
        const publicRepo = AppDataSource.getRepository(Mutuelle);
        const publicRow  = await publicRepo.findOne({
            where: { id: tenantId },
            select: [
                'id',
                'nom',
                'email',
                'motDePasse',
                'telephone',
                'adresse',
                'ville',
                'codePostal',
                'pays',
                'siret',
                'estActif',
                'dateCreation',
                'dateMiseAJour'
            ]
        });
        if (publicRow) {
            // on insère la même ligne dans tenant_<id>.mutuelles
            await tenantRepo.save(publicRow);
        }
    }

    // 8) Mise en cache et retour
    tenantDataSources[tenantId] = tenantDs;
    return tenantDs;
}
