import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { Dossier } from '../entities/Dossier';
import { Assure } from '../entities/Assure';
import { authMiddleware } from '../middleware/auth';

export class DossierController {
    static router = Router();

    static getRouter() {
        return this.router;
    }

    static async createDossier(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const {
                numeroDossier,
                description,
                montantTotal,
                assureId,
                typeSoin
            } = req.body;

            const assureRepository = AppDataSource.getRepository(Assure);
            const assure = await assureRepository.findOne({
                where: { id: assureId, mutuelle: { id: mutuelle.id } }
            });

            if (!assure) {
                return res.status(404).json({ message: 'Assuré non trouvé' });
            }

            const dossierRepository = AppDataSource.getRepository(Dossier);
            const dossier = dossierRepository.create({
                numeroDossier,
                description,
                montantTotal,
                montantRembourse: 0,
                statut: 'EN_ATTENTE',
                typeSoin,
                mutuelle,
                assure
            });

            await dossierRepository.save(dossier);
            res.status(201).json(dossier);
        } catch (error) {
            console.error('Erreur lors de la création du dossier:', error);
            res.status(500).json({ message: 'Erreur lors de la création du dossier' });
        }
    }

    static async getDossiers(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { statut, typeSoin, dateDebut, dateFin } = req.query;

            const dossierRepository = AppDataSource.getRepository(Dossier);
            let query = dossierRepository
                .createQueryBuilder('dossier')
                .leftJoinAndSelect('dossier.assure', 'assure')
                .where('dossier.mutuelleId = :mutuelleId', { mutuelleId: mutuelle.id });

            if (statut) {
                query = query.andWhere('dossier.statut = :statut', { statut });
            }

            if (typeSoin) {
                query = query.andWhere('dossier.typeSoin = :typeSoin', { typeSoin });
            }

            if (dateDebut && dateFin) {
                query = query.andWhere('dossier.dateCreation BETWEEN :dateDebut AND :dateFin', {
                    dateDebut,
                    dateFin
                });
            }

            const dossiers = await query.getMany();
            res.json(dossiers);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des dossiers' });
        }
    }

    static async getDossier(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { id } = req.params;

            const dossierRepository = AppDataSource.getRepository(Dossier);
            const dossier = await dossierRepository.findOne({
                where: { id, mutuelle: { id: mutuelle.id } },
                relations: ['assure', 'messages', 'justificatifs']
            });

            if (!dossier) {
                return res.status(404).json({ message: 'Dossier non trouvé' });
            }

            res.json(dossier);
        } catch (error) {
            console.error('Erreur lors de la récupération du dossier:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération du dossier' });
        }
    }

    static async updateDossier(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { id } = req.params;
            const { statut, montantRembourse, description } = req.body;

            const dossierRepository = AppDataSource.getRepository(Dossier);
            const dossier = await dossierRepository.findOne({
                where: { id, mutuelle: { id: mutuelle.id } }
            });

            if (!dossier) {
                return res.status(404).json({ message: 'Dossier non trouvé' });
            }

            if (statut) dossier.statut = statut;
            if (montantRembourse) dossier.montantRembourse = montantRembourse;
            if (description) dossier.description = description;

            await dossierRepository.save(dossier);
            res.json(dossier);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du dossier:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du dossier' });
        }
    }

    static async deleteDossier(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { id } = req.params;

            const dossierRepository = AppDataSource.getRepository(Dossier);
            const dossier = await dossierRepository.findOne({
                where: { id, mutuelle: { id: mutuelle.id } }
            });

            if (!dossier) {
                return res.status(404).json({ message: 'Dossier non trouvé' });
            }

            await dossierRepository.remove(dossier);
            res.status(204).send();
        } catch (error) {
            console.error('Erreur lors de la suppression du dossier:', error);
            res.status(500).json({ message: 'Erreur lors de la suppression du dossier' });
        }
    }

    static async searchDossiers(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { query, typeSoin, dateDebut, dateFin } = req.query;

            const dossierRepository = AppDataSource.getRepository(Dossier);
            let queryBuilder = dossierRepository
                .createQueryBuilder('dossier')
                .leftJoinAndSelect('dossier.assure', 'assure')
                .where('dossier.mutuelleId = :mutuelleId', { mutuelleId: mutuelle.id });

            if (query) {
                queryBuilder = queryBuilder.andWhere(
                    '(assure.nom LIKE :query OR assure.prenom LIKE :query OR dossier.numeroDossier LIKE :query)',
                    { query: `%${query}%` }
                );
            }

            if (typeSoin) {
                queryBuilder = queryBuilder.andWhere('dossier.typeSoin = :typeSoin', { typeSoin });
            }

            if (dateDebut && dateFin) {
                queryBuilder = queryBuilder.andWhere('dossier.dateCreation BETWEEN :dateDebut AND :dateFin', {
                    dateDebut,
                    dateFin
                });
            }

            const dossiers = await queryBuilder.getMany();
            res.json(dossiers);
        } catch (error) {
            console.error('Erreur lors de la recherche des dossiers:', error);
            res.status(500).json({ message: 'Erreur lors de la recherche des dossiers' });
        }
    }
}

// Configuration des routes
DossierController.router.post('/', authMiddleware, DossierController.createDossier);
DossierController.router.get('/', authMiddleware, DossierController.getDossiers);
DossierController.router.get('/search', authMiddleware, DossierController.searchDossiers);
DossierController.router.get('/:id', authMiddleware, DossierController.getDossier);
DossierController.router.put('/:id', authMiddleware, DossierController.updateDossier);
DossierController.router.delete('/:id', authMiddleware, DossierController.deleteDossier); 