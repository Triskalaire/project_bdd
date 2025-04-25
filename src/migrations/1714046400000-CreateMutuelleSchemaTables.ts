import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMutuelleSchemaTables1714046400000 implements MigrationInterface {
    name = 'CreateMutuelleSchemaTables1714046400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Récupérer toutes les mutuelles
        const mutuelles = await queryRunner.query(`SELECT id FROM mutuelles`);
        
        for (const mutuelle of mutuelles) {
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            
            // Créer les tables dans le schéma de la mutuelle
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "${schemaName}"."assures" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "nom" character varying NOT NULL,
                    "prenom" character varying NOT NULL,
                    "email" character varying NOT NULL,
                    "telephone" character varying NOT NULL,
                    "dateNaissance" TIMESTAMP NOT NULL,
                    "numeroSecuriteSociale" character varying NOT NULL,
                    "numeroSecuriteSocialeHash" character varying NOT NULL,
                    "iban" character varying NOT NULL,
                    "ibanHash" character varying NOT NULL,
                    "historiqueMedical" text NOT NULL,
                    "historiqueMedicalHash" character varying NOT NULL,
                    "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                    "mutuelleId" uuid NOT NULL,
                    CONSTRAINT "PK_assures" PRIMARY KEY ("id")
                );

                CREATE TABLE IF NOT EXISTS "${schemaName}"."dossiers" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "numeroDossier" character varying NOT NULL,
                    "description" text NOT NULL,
                    "montantTotal" decimal(10,2) NOT NULL,
                    "montantRembourse" decimal(10,2) NOT NULL,
                    "statut" character varying NOT NULL,
                    "typeSoin" character varying NOT NULL,
                    "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                    "mutuelleId" uuid NOT NULL,
                    "assureId" uuid NOT NULL,
                    CONSTRAINT "PK_dossiers" PRIMARY KEY ("id")
                );

                CREATE TABLE IF NOT EXISTS "${schemaName}"."justificatifs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "nomFichier" character varying NOT NULL,
                    "cheminFichier" character varying NOT NULL,
                    "typeFichier" character varying NOT NULL,
                    "tailleFichier" integer NOT NULL,
                    "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                    "dossierId" uuid NOT NULL,
                    CONSTRAINT "PK_justificatifs" PRIMARY KEY ("id")
                );

                CREATE TABLE IF NOT EXISTS "${schemaName}"."messages" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "contenu" text NOT NULL,
                    "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                    "mutuelleId" uuid NOT NULL,
                    "assureId" uuid NOT NULL,
                    "dossierId" uuid NOT NULL,
                    CONSTRAINT "PK_messages" PRIMARY KEY ("id")
                );

                CREATE TABLE IF NOT EXISTS "${schemaName}"."offres" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "nom" character varying NOT NULL,
                    "description" text NOT NULL,
                    "prix" decimal(10,2) NOT NULL,
                    "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                    "mutuelleId" uuid NOT NULL,
                    CONSTRAINT "PK_offres" PRIMARY KEY ("id")
                );

                -- Ajouter les contraintes de clés étrangères
                ALTER TABLE "${schemaName}"."assures" 
                    ADD CONSTRAINT "FK_assures_mutuelle" 
                    FOREIGN KEY ("mutuelleId") 
                    REFERENCES "mutuelles"("id");

                ALTER TABLE "${schemaName}"."dossiers" 
                    ADD CONSTRAINT "FK_dossiers_mutuelle" 
                    FOREIGN KEY ("mutuelleId") 
                    REFERENCES "mutuelles"("id");

                ALTER TABLE "${schemaName}"."dossiers" 
                    ADD CONSTRAINT "FK_dossiers_assure" 
                    FOREIGN KEY ("assureId") 
                    REFERENCES "${schemaName}"."assures"("id");

                ALTER TABLE "${schemaName}"."justificatifs" 
                    ADD CONSTRAINT "FK_justificatifs_dossier" 
                    FOREIGN KEY ("dossierId") 
                    REFERENCES "${schemaName}"."dossiers"("id");

                ALTER TABLE "${schemaName}"."messages" 
                    ADD CONSTRAINT "FK_messages_mutuelle" 
                    FOREIGN KEY ("mutuelleId") 
                    REFERENCES "mutuelles"("id");

                ALTER TABLE "${schemaName}"."messages" 
                    ADD CONSTRAINT "FK_messages_assure" 
                    FOREIGN KEY ("assureId") 
                    REFERENCES "${schemaName}"."assures"("id");

                ALTER TABLE "${schemaName}"."messages" 
                    ADD CONSTRAINT "FK_messages_dossier" 
                    FOREIGN KEY ("dossierId") 
                    REFERENCES "${schemaName}"."dossiers"("id");

                ALTER TABLE "${schemaName}"."offres" 
                    ADD CONSTRAINT "FK_offres_mutuelle" 
                    FOREIGN KEY ("mutuelleId") 
                    REFERENCES "mutuelles"("id");
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Récupérer toutes les mutuelles
        const mutuelles = await queryRunner.query(`SELECT id FROM mutuelles`);
        
        for (const mutuelle of mutuelles) {
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            
            // Supprimer les tables du schéma de la mutuelle
            await queryRunner.query(`
                DROP TABLE IF EXISTS "${schemaName}"."offres";
                DROP TABLE IF EXISTS "${schemaName}"."messages";
                DROP TABLE IF EXISTS "${schemaName}"."justificatifs";
                DROP TABLE IF EXISTS "${schemaName}"."dossiers";
                DROP TABLE IF EXISTS "${schemaName}"."assures";
            `);
        }
    }
} 