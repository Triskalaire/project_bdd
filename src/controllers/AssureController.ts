import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { Assure } from '../entities/Assure';
import { Mutuelle } from '../entities/Mutuelle';
import { EncryptionService } from '../services/EncryptionService';

export class AssureController {
    static router = Router();

    static async createAssure(req: Request, res: Response) {
        try {
            const { mutuelleId, nom, prenom, email, telephone, dateNaissance, numeroSecuriteSociale, iban, historiqueMedical } = req.body;

            // Vérifier si la mutuelle existe
            const mutuelle = await AppDataSource.getRepository(Mutuelle).findOne({
                where: { id: mutuelleId }
            });

            if (!mutuelle) {
                return res.status(404).json({ message: "Mutuelle non trouvée" });
            }

            // Vérifier et formater la date de naissance
            if (!dateNaissance) {
                return res.status(400).json({ message: "La date de naissance est obligatoire" });
            }

            const dateNaissanceObj = new Date(dateNaissance);
            if (isNaN(dateNaissanceObj.getTime())) {
                return res.status(400).json({ message: "Format de date invalide. Utilisez le format YYYY-MM-DD" });
            }

            // Créer l'assuré dans le schéma de la mutuelle
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            
            // Forcer l'utilisation du schéma de la mutuelle
            await AppDataSource.query(`SET search_path TO ${schemaName}`);
            
            const assure = AppDataSource.getRepository(Assure).create({
                mutuelle,
                nom,
                prenom,
                email,
                telephone,
                dateNaissance: dateNaissanceObj,
                numeroSecuriteSociale,
                iban,
                historiqueMedical,
                numeroSecuriteSocialeHash: EncryptionService.createHash(numeroSecuriteSociale),
                ibanHash: EncryptionService.createHash(iban),
                historiqueMedicalHash: EncryptionService.createHash(historiqueMedical)
            });

            const savedAssure = await AppDataSource.getRepository(Assure).save(assure);
            
            // Revenir au schéma public
            await AppDataSource.query(`SET search_path TO public`);

            return res.status(201).json(savedAssure);
        } catch (error) {
            console.error("Erreur lors de la création de l'assuré:", error);
            return res.status(500).json({ message: "Erreur lors de la création de l'assuré" });
        }
    }

    static async getAssures(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            
            // Forcer l'utilisation du schéma de la mutuelle
            await AppDataSource.query(`SET search_path TO ${schemaName}`);
            
            const assures = await AppDataSource.getRepository(Assure).find({
                where: { mutuelle: { id: mutuelle.id } }
            });
            
            // Revenir au schéma public
            await AppDataSource.query(`SET search_path TO public`);
            
            res.json(assures);
        } catch (error) {
            console.error('Erreur lors de la récupération des assurés:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des assurés' });
        }
    }

    static async searchAssures(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { query } = req.query;
            const schemaName = `mutuelle_${mutuelle.id.replace(/-/g, '_')}`;
            
            // Forcer l'utilisation du schéma de la mutuelle
            await AppDataSource.query(`SET search_path TO ${schemaName}`);
            
            const assures = await AppDataSource.getRepository(Assure)
                .createQueryBuilder('assure')
                .where('assure.mutuelleId = :mutuelleId', { mutuelleId: mutuelle.id })
                .andWhere('(assure.nom LIKE :query OR assure.prenom LIKE :query OR assure.numeroSecuriteSocialeHash = :hash)',
                    { query: `%${query}%`, hash: EncryptionService.createHash(query as string) })
                .getMany();
            
            // Revenir au schéma public
            await AppDataSource.query(`SET search_path TO public`);
            
            res.json(assures);
        } catch (error) {
            console.error('Erreur lors de la recherche des assurés:', error);
            res.status(500).json({ message: 'Erreur lors de la recherche des assurés' });
        }
    }
}

// Configuration des routes
AssureController.router.post('/', AssureController.createAssure);
AssureController.router.get('/', AssureController.getAssures);
AssureController.router.get('/search', AssureController.searchAssures);