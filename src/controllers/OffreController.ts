import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { Offre } from '../entities/Offre';

export class OffreController {
    static router = Router();

    static async createOffre(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { nom, description, montant, conditions } = req.body;

            const offreRepository = AppDataSource.getRepository(Offre);
            const offre = offreRepository.create({
                nom,
                description,
                montant,
                conditions,
                mutuelle
            });

            await offreRepository.save(offre);
            res.status(201).json(offre);
        } catch (error) {
            console.error('Erreur lors de la création de l\'offre:', error);
            res.status(500).json({ message: 'Erreur lors de la création de l\'offre' });
        }
    }

    static async getOffres(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const offreRepository = AppDataSource.getRepository(Offre);
            const offres = await offreRepository.find({
                where: { mutuelle: { id: mutuelle.id } }
            });
            res.json(offres);
        } catch (error) {
            console.error('Erreur lors de la récupération des offres:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des offres' });
        }
    }
}

// Configuration des routes
OffreController.router.post('/', OffreController.createOffre);
OffreController.router.get('/', OffreController.getOffres);