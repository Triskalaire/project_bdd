import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { Assure } from '../entities/Assure';
import { EncryptionService } from '../services/EncryptionService';

export class AssureController {
    static router = Router();

    static async createAssure(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const {
                nom,
                prenom,
                email,
                telephone,
                dateNaissance,
                numeroSecuriteSociale,
                iban,
                historiqueMedical
            } = req.body;

            const assureRepository = AppDataSource.getRepository(Assure);
            
            // Chiffrement des données sensibles
            const numeroSecuriteSocialeEncrypted = EncryptionService.encrypt(numeroSecuriteSociale);
            const ibanEncrypted = EncryptionService.encrypt(iban);
            const historiqueMedicalEncrypted = EncryptionService.encrypt(historiqueMedical);

            // Création des hashs pour la recherche
            const numeroSecuriteSocialeHash = EncryptionService.createHash(numeroSecuriteSociale);
            const ibanHash = EncryptionService.createHash(iban);
            const historiqueMedicalHash = EncryptionService.createHash(historiqueMedical);

            const assure = assureRepository.create({
                nom,
                prenom,
                email,
                telephone,
                dateNaissance,
                numeroSecuriteSociale: numeroSecuriteSocialeEncrypted,
                numeroSecuriteSocialeHash,
                iban: ibanEncrypted,
                ibanHash,
                historiqueMedical: historiqueMedicalEncrypted,
                historiqueMedicalHash,
                mutuelle
            });

            await assureRepository.save(assure);
            res.status(201).json(assure);
        } catch (error) {
            console.error('Erreur lors de la création de l\'assuré:', error);
            res.status(500).json({ message: 'Erreur lors de la création de l\'assuré' });
        }
    }

    static async getAssures(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const assureRepository = AppDataSource.getRepository(Assure);
            const assures = await assureRepository.find({
                where: { mutuelle: { id: mutuelle.id } }
            });
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
            const assureRepository = AppDataSource.getRepository(Assure);

            const assures = await assureRepository
                .createQueryBuilder('assure')
                .where('assure.mutuelleId = :mutuelleId', { mutuelleId: mutuelle.id })
                .andWhere('(assure.nom LIKE :query OR assure.prenom LIKE :query OR assure.numeroSecuriteSocialeHash = :hash)',
                    { query: `%${query}%`, hash: EncryptionService.createHash(query as string) })
                .getMany();

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