// src/controllers/DossierController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Dossier } from '../entities/Dossier';
import { Assure }  from '../entities/Assure';
import { getTenantDataSource } from '../services/TenantDataSource';
import { authMiddleware } from '../middleware/auth';

export class DossierController {
    public static router = Router();

    static initializeRoutes() {
        this.router.post(   '/',       authMiddleware, this.createDossier);
        this.router.get(    '/',       authMiddleware, this.getDossiers);
        this.router.get(    '/search', authMiddleware, this.searchDossiers);
        this.router.get(    '/:id',    authMiddleware, this.getDossierById);
        this.router.put(    '/:id',    authMiddleware, this.updateDossier);
        this.router.delete( '/:id',    authMiddleware, this.deleteDossier);
    }

    /** POST /dossiers */
    static createDossier: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { numeroDossier, description, montantTotal, assureId, typeSoin } = req.body;
            if (!numeroDossier || !description || montantTotal == null || !assureId || !typeSoin) {
                res.status(400).json({ message: 'Tous les champs sont requis' });
                return;
            }

            const ds          = await getTenantDataSource(req.mutuelle.id);
            const dossierRepo = ds.getRepository(Dossier);
            const assureRepo  = ds.getRepository(Assure);

            // Vérifier l'assuré existe
            const a = await assureRepo.findOne({ where: { id: assureId } });
            if (!a) {
                res.status(404).json({ message: 'Assuré non trouvé' });
                return;
            }

            // Empêcher doublon sur numeroDossier
            const dup = await dossierRepo.findOne({ where: { numeroDossier } });
            if (dup) {
                res.status(409).json({ message: 'Numéro de dossier déjà utilisé' });
                return;
            }

            // Création du dossier
            const d = dossierRepo.create({
                numeroDossier,
                description,
                montantTotal,
                montantRembourse: 0,
                statut:           'EN_ATTENTE',
                typeSoin,
                assure:           { id: assureId } as any
            });
            const saved = await dossierRepo.save(d);
            res.status(201).json(saved);
        } catch (err) {
            console.error('Erreur createDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** GET /dossiers */
    static getDossiers: RequestHandler = async (req, res): Promise<void> => {
        try {
            const ds   = await getTenantDataSource(req.mutuelle.id);
            const list = await ds.getRepository(Dossier).find();
            res.json(list);
        } catch (err) {
            console.error('Erreur getDossiers :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** GET /dossiers/search?query=… */
    static searchDossiers: RequestHandler = async (req, res): Promise<void> => {
        try {
            const q    = String(req.query.query || '');
            const ds   = await getTenantDataSource(req.mutuelle.id);
            const results = await ds.getRepository(Dossier)
                .createQueryBuilder('d')
                .where('d.numeroDossier ILIKE :q OR d.description ILIKE :q', { q: `%${q}%` })
                .getMany();
            res.json(results);
        } catch (err) {
            console.error('Erreur searchDossiers :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** GET /dossiers/:id */
    static getDossierById: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const ds      = await getTenantDataSource(req.mutuelle.id);
            const d       = await ds.getRepository(Dossier).findOne({ where: { id } });
            if (!d) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            res.json(d);
        } catch (err) {
            console.error('Erreur getDossierById :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** PUT /dossiers/:id */
    static updateDossier: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id }    = req.params;
            const ds        = await getTenantDataSource(req.mutuelle.id);
            const repo      = ds.getRepository(Dossier);
            const existing  = await repo.findOne({ where: { id } });
            if (!existing) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            repo.merge(existing, req.body);
            const updated = await repo.save(existing);
            res.json(updated);
        } catch (err) {
            console.error('Erreur updateDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** DELETE /dossiers/:id */
    static deleteDossier: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id }     = req.params;
            const ds         = await getTenantDataSource(req.mutuelle.id);
            const result     = await ds.getRepository(Dossier).delete(id);
            if (result.affected === 0) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            // Grâce à onDelete: 'CASCADE', les justificatifs et messages liés sont supprimés automatiquement
            res.status(204).send();
        } catch (err) {
            console.error('Erreur deleteDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
}

// Initialisation des routes
DossierController.initializeRoutes();
