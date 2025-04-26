// src/controllers/OffreController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Offre } from '../entities/Offre';
import { getTenantDataSource } from '../services/TenantDataSource';
import { authMiddleware } from '../middleware/auth';

export class OffreController {
    public static router = Router();

    static initializeRoutes() {
        this.router.post(   '/',       authMiddleware, this.createOffre);
        this.router.get(    '/',       authMiddleware, this.getOffres);
        this.router.get(    '/:id',    authMiddleware, this.getOffreById);
        this.router.put(    '/:id',    authMiddleware, this.updateOffre);
        this.router.delete( '/:id',    authMiddleware, this.deleteOffre);
    }

    static createOffre: RequestHandler = async (req, res) => {
        try {
            const { nom, description, montant, conditions } = req.body;
            const ds   = await getTenantDataSource(req.mutuelle.id);
            const repo = ds.getRepository(Offre);

            const o = repo.create({
                nom,
                description,
                montant,
                conditions,
                mutuelle: { id: req.mutuelle.id } as any
            });
            await repo.save(o);
            res.status(201).json(o);
        } catch (err) {
            console.error('Erreur createOffre :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static getOffres: RequestHandler = async (req, res) => {
        try {
            const ds   = await getTenantDataSource(req.mutuelle.id);
            const list = await ds.getRepository(Offre).find({ where: { mutuelle: { id: req.mutuelle.id } } });
            res.json(list);
        } catch (err) {
            console.error('Erreur getOffres :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static getOffreById: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds    = await getTenantDataSource(req.mutuelle.id);
            const one   = await ds.getRepository(Offre).findOne({ where: { id, mutuelle: { id: req.mutuelle.id } } });
            if (!one) {
                res.status(404).json({ message: 'Offre non trouvée' });
                return;
            }
            res.json(one);
        } catch (err) {
            console.error('Erreur getOffreById :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static updateOffre: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds    = await getTenantDataSource(req.mutuelle.id);
            const repo  = ds.getRepository(Offre);
            const o     = await repo.findOne({ where: { id, mutuelle: { id: req.mutuelle.id } } });
            if (!o) {
                res.status(404).json({ message: 'Offre non trouvée' });
                return;
            }
            repo.merge(o, req.body);
            const updated = await repo.save(o);
            res.json(updated);
        } catch (err) {
            console.error('Erreur updateOffre :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static deleteOffre: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds    = await getTenantDataSource(req.mutuelle.id);
            const result = await ds.getRepository(Offre).delete({ id, mutuelle: { id: req.mutuelle.id } } as any);
            if (result.affected === 0) {
                res.status(404).json({ message: 'Offre non trouvée' });
                return;
            }
            res.status(204).send();
        } catch (err) {
            console.error('Erreur deleteOffre :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
}

OffreController.initializeRoutes();
