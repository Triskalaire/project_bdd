import { Request, Response, Router } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Mutuelle } from '../entities/Mutuelle';
import { EncryptionService } from '../services/EncryptionService';

export class MutuelleController {
    static router = Router();

    // Middleware d'authentification
    static authenticateToken(req: Request, res: Response, next: Function) {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            console.log('Pas d\'en-tête Authorization');
            return res.status(401).json({ 
                message: 'En-tête d\'autorisation manquant',
                details: 'Veuillez inclure un en-tête Authorization avec le format: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('Format d\'Authorization invalide:', authHeader);
            return res.status(401).json({ 
                message: 'Format d\'autorisation invalide',
                details: 'Le format doit être: Bearer <token>'
            });
        }

        console.log('Token reçu:', token);

        jwt.verify(token, process.env.JWT_SECRET || 'default-secret', async (err: any, decoded: any) => {
            if (err) {
                console.log('Erreur de vérification du token:', err.message);
                return res.status(403).json({ 
                    message: 'Token invalide ou expiré',
                    details: err.message
                });
            }

            console.log('Token décodé:', decoded);

            try {
                // Toujours chercher dans le schéma public pour l'authentification
                await AppDataSource.query(`SET search_path TO public`);
                
                const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
                const mutuelle = await mutuelleRepository.findOne({ 
                    where: { id: decoded.mutuelleId },
                    select: ['id', 'nom', 'email', 'telephone', 'adresse', 'ville', 'codePostal', 'pays', 'siret']
                });

                if (!mutuelle) {
                    console.log('Mutuelle non trouvée pour l\'ID:', decoded.mutuelleId);
                    return res.status(404).json({ message: 'Mutuelle non trouvée' });
                }

                console.log('Mutuelle trouvée:', mutuelle);
                req.mutuelle = mutuelle;
                next();
            } catch (error) {
                console.error('Erreur lors de la récupération de la mutuelle:', error);
                res.status(500).json({ message: 'Erreur lors de l\'authentification' });
            }
        });
    }

    static initializeRoutes() {
        // Routes publiques
        this.router.post('/verifier-email', this.verifierEmail);
        this.router.post('/inscription', this.inscription);
        this.router.post('/connexion', this.connexion);
        
        // Routes protégées
        this.router.get('/profile', this.authenticateToken, this.getProfile);
        this.router.put('/profile', this.authenticateToken, this.updateProfile);
    }

    static async verifierEmail(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'L\'email est requis' });
            }

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            const existingMutuelle = await mutuelleRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'nom'] // Ne pas inclure le mot de passe
            });

            if (existingMutuelle) {
                return res.status(200).json({ 
                    existe: true,
                    message: 'Un compte existe déjà avec cet email',
                    mutuelle: {
                        id: existingMutuelle.id,
                        email: existingMutuelle.email,
                        nom: existingMutuelle.nom
                    }
                });
            }

            return res.status(200).json({ 
                existe: false,
                message: 'Aucun compte trouvé avec cet email'
            });
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'email:', error);
            res.status(500).json({ message: 'Une erreur est survenue lors de la vérification' });
        }
    }

    static async inscription(req: Request, res: Response) {
        try {
            const { nom, email, motDePasse, telephone, adresse, ville, codePostal, pays, siret } = req.body;

            // Validation des données requises
            if (!nom || !email || !motDePasse || !telephone || !adresse || !ville || !codePostal || !pays || !siret) {
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            const existingMutuelle = await mutuelleRepository.findOne({ where: { email } });

            if (existingMutuelle) {
                return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
            }

            const hashedPassword = await bcrypt.hash(motDePasse, 10);
            const mutuelle = mutuelleRepository.create({
                nom,
                email,
                motDePasse: hashedPassword,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret
            });

            await mutuelleRepository.save(mutuelle);

            // Création du schéma pour la mutuelle
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

            const token = jwt.sign(
                { 
                    mutuelleId: mutuelle.id,
                    tenant: `mutuelle_${mutuelle.id.replace(/-/g, '_')}`
                },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Inscription réussie',
                token,
                mutuelle: {
                    id: mutuelle.id,
                    nom: mutuelle.nom,
                    email: mutuelle.email
                }
            });
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({ message: 'Une erreur est survenue lors de l\'inscription' });
        }
    }

    static async connexion(req: Request, res: Response) {
        try {
            const { email, motDePasse } = req.body;

            // Validation des données requises
            if (!email || !motDePasse) {
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            const mutuelle = await mutuelleRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'motDePasse'] // Inclure le mot de passe dans la sélection
            });

            if (!mutuelle) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const isValidPassword = await bcrypt.compare(motDePasse, mutuelle.motDePasse);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const token = jwt.sign(
                { 
                    mutuelleId: mutuelle.id,
                    tenant: `mutuelle_${mutuelle.id.replace(/-/g, '_')}`
                },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );

            res.json({ token });
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({ message: 'Erreur lors de la connexion' });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            res.json(mutuelle);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { nom, email, telephone, adresse, ville, codePostal, pays, siret } = req.body;

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            await mutuelleRepository.update(mutuelle.id, {
                nom,
                email,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret
            });

            res.json({ message: 'Profil mis à jour avec succès' });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
        }
    }

    static async createMutuelle(req: Request, res: Response) {
        try {
            const { nom, email, telephone, adresse, ville, codePostal, pays, siret, motDePasse } = req.body;

            // Vérifier si la mutuelle existe déjà
            const existingMutuelle = await AppDataSource.getRepository(Mutuelle).findOne({
                where: { email }
            });

            if (existingMutuelle) {
                return res.status(400).json({ message: "Une mutuelle avec cet email existe déjà" });
            }

            // Créer la mutuelle
            const mutuelle = AppDataSource.getRepository(Mutuelle).create({
                nom,
                email,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret,
                motDePasse: await EncryptionService.hashPassword(motDePasse)
            });

            const savedMutuelle = await AppDataSource.getRepository(Mutuelle).save(mutuelle);

            // Créer le schéma pour la mutuelle
            const schemaName = `mutuelle_${savedMutuelle.id.replace(/-/g, '_')}`;
            await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

            // Créer les tables dans le schéma
            await AppDataSource.query(`
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

            return res.status(201).json(savedMutuelle);
        } catch (error) {
            console.error("Erreur lors de la création de la mutuelle:", error);
            return res.status(500).json({ message: "Erreur lors de la création de la mutuelle" });
        }
    }
}

// Initialisation des routes
MutuelleController.initializeRoutes(); 