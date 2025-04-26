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
        this.router.get(    '/:id',    authMiddleware, this.getDossier);
        this.router.put(    '/:id',    authMiddleware, this.updateDossier);
        this.router.delete( '/:id',    authMiddleware, this.deleteDossier);
    }

    static createDossier: RequestHandler = async (req, res) => {
        try {
            const { numeroDossier, description, montantTotal, assureId, typeSoin } = req.body;
            const ds = await getTenantDataSource(req.mutuelle.id);
            const dossierRepo = ds.getRepository(Dossier);
            const assureRepo  = ds.getRepository(Assure);

            const a = await assureRepo.findOne({
                where: { id: assureId, mutuelle: { id: req.mutuelle.id } }
            });
            if (!a) {
                res.status(404).json({ message: 'Assuré non trouvé' });
                return;
            }

            const d = dossierRepo.create({
                numeroDossier,
                description,
                montantTotal,
                montantRembourse: 0,
                statut: 'EN_ATTENTE',
                typeSoin,
                mutuelle: { id: req.mutuelle.id } as any,
                assure: a
            });
            await dossierRepo.save(d);
            res.status(201).json(d);
        } catch (err) {
            console.error('Erreur createDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static getDossiers: RequestHandler = async (req, res) => {
        try {
            const { statut, typeSoin, dateDebut, dateFin } = req.query;
            const ds = await getTenantDataSource(req.mutuelle.id);
            let qb = ds.getRepository(Dossier)
                .createQueryBuilder('d')
                .leftJoinAndSelect('d.assure','a')
                .where('d.mutuelleId = :m',{ m: req.mutuelle.id });

            if (statut)   qb = qb.andWhere('d.statut = :s',{ s: statut });
            if (typeSoin) qb = qb.andWhere('d.typeSoin = :t',{ t: typeSoin });
            if (dateDebut && dateFin) {
                qb = qb.andWhere('d.dateCreation BETWEEN :b AND :e',{ b: dateDebut, e: dateFin });
            }

            const list = await qb.getMany();
            res.json(list);
        } catch (err) {
            console.error('Erreur getDossiers :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static getDossier: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds = await getTenantDataSource(req.mutuelle.id);
            const d = await ds.getRepository(Dossier).findOne({
                where: { id, mutuelle: { id: req.mutuelle.id } },
                relations: ['assure','messages','justificatifs']
            });
            if (!d) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            res.json(d);
        } catch (err) {
            console.error('Erreur getDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static searchDossiers: RequestHandler = async (req, res) => {
        try {
            const { query, typeSoin, dateDebut, dateFin } = req.query;
            const ds = await getTenantDataSource(req.mutuelle.id);
            let qb = ds.getRepository(Dossier)
                .createQueryBuilder('d')
                .leftJoinAndSelect('d.assure','a')
                .where('d.mutuelleId = :m',{ m: req.mutuelle.id });

            if (query)    qb = qb.andWhere('(a.nom LIKE :q OR a.prenom LIKE :q OR d.numeroDossier LIKE :q)',{ q:`%${query}%` });
            if (typeSoin) qb = qb.andWhere('d.typeSoin = :t',{ t: typeSoin });
            if (dateDebut && dateFin) {
                qb = qb.andWhere('d.dateCreation BETWEEN :b AND :e',{ b: dateDebut, e: dateFin });
            }

            const results = await qb.getMany();
            res.json(results);
        } catch (err) {
            console.error('Erreur searchDossiers :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static updateDossier: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds = await getTenantDataSource(req.mutuelle.id);
            const repo = ds.getRepository(Dossier);
            const d = await repo.findOne({ where: { id, mutuelle: { id: req.mutuelle.id } } });
            if (!d) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            repo.merge(d, req.body);
            const updated = await repo.save(d);
            res.json(updated);
        } catch (err) {
            console.error('Erreur updateDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    static deleteDossier: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const ds = await getTenantDataSource(req.mutuelle.id);
            const result = await ds.getRepository(Dossier).delete({ id, mutuelle: { id: req.mutuelle.id } } as any);
            if (result.affected === 0) {
                res.status(404).json({ message: 'Dossier non trouvé' });
                return;
            }
            res.status(204).send();
        } catch (err) {
            console.error('Erreur deleteDossier :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
}

DossierController.initializeRoutes();
