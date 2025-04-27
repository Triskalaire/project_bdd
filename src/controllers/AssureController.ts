// src/controllers/AssureController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Assure } from '../entities/Assure';
import { getTenantDataSource } from '../services/TenantDataSource';
import { EncryptionService } from '../services/EncryptionService';
import { authMiddleware } from '../middleware/auth';

export class AssureController {
    public static router = Router();

    static initializeRoutes() {
        this.router.post(   '/',           authMiddleware, this.createAssure);
        this.router.get(    '/',           authMiddleware, this.getAssures);
        this.router.get(    '/search',     authMiddleware, this.searchAssures);
        this.router.get(    '/:id',        authMiddleware, this.getAssureById);
        this.router.put(    '/:id',        authMiddleware, this.updateAssure);
        this.router.delete( '/:id',        authMiddleware, this.deleteAssure);
    }

    /** Create */
    static createAssure: RequestHandler = async (req, res): Promise<void> => {
        try {
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

            // validation
            if (
                !nom || !prenom || !email || !telephone ||
                !dateNaissance || !numeroSecuriteSociale ||
                !iban || !historiqueMedical
            ) {
                res.status(400).json({ message: 'Tous les champs sont requis' });
                return;
            }

            const ds    = await getTenantDataSource(req.mutuelle.id);
            const repo  = ds.getRepository(Assure);

            // hashes pour recherche
            const hashNSS  = EncryptionService.createHash(numeroSecuriteSociale);
            const hashIBAN = EncryptionService.createHash(iban);
            const hashHist = EncryptionService.createHash(historiqueMedical);

            const newA = repo.create({
                nom,
                prenom,
                email,
                telephone,
                dateNaissance: new Date(dateNaissance),

                // valeurs en clair
                numeroSecuriteSociale,
                iban,
                historiqueMedical,

                // champs dérivés / hashés
                numeroSecuriteSocialeHash: hashNSS,
                ibanHash:                  hashIBAN,
                historiqueMedicalHash:     hashHist,

                mutuelle: { id: req.mutuelle.id } as any
            });

            const saved = await repo.save(newA);
            res.status(201).json(saved);
        } catch (err) {
            console.error('Erreur createAssure :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** Read all */
    static getAssures: RequestHandler = async (req, res): Promise<void> => {
        try {
            const ds   = await getTenantDataSource(req.mutuelle.id);
            const list = await ds.getRepository(Assure).find({
                where: { mutuelle: { id: req.mutuelle.id } }
            });
            res.json(list);
        } catch (err) {
            console.error('Erreur getAssures :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** Read one */
    static getAssureById: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const ds      = await getTenantDataSource(req.mutuelle.id);
            const assure = await ds.getRepository(Assure).findOne({
                where: { id, mutuelle: { id: req.mutuelle.id } }
            });
            if (!assure) {
                res.status(404).json({ message: 'Assuré non trouvé' });
                return;
            }
            res.json(assure);
        } catch (err) {
            console.error('Erreur getAssureById :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** Update */
    static updateAssure: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const ds     = await getTenantDataSource(req.mutuelle.id);
            const repo   = ds.getRepository(Assure);

            const existing = await repo.findOne({
                where: { id, mutuelle: { id: req.mutuelle.id } }
            });
            if (!existing) {
                res.status(404).json({ message: 'Assuré non trouvé' });
                return;
            }

            // si numéro de sécu ou IBAN modifiés, recalculer hash
            if (req.body.numeroSecuriteSociale) {
                existing.numeroSecuriteSociale      = req.body.numeroSecuriteSociale;
                existing.numeroSecuriteSocialeHash  = EncryptionService.createHash(req.body.numeroSecuriteSociale);
            }
            if (req.body.iban) {
                existing.iban     = req.body.iban;
                existing.ibanHash = EncryptionService.createHash(req.body.iban);
            }
            if (req.body.historiqueMedical) {
                existing.historiqueMedical     = req.body.historiqueMedical;
                existing.historiqueMedicalHash = EncryptionService.createHash(req.body.historiqueMedical);
            }

            // merge des autres champs
            repo.merge(existing, req.body);
            const updated = await repo.save(existing);
            res.json(updated);
        } catch (err) {
            console.error('Erreur updateAssure :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** Delete */
    static deleteAssure: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const ds     = await getTenantDataSource(req.mutuelle.id);
            const result = await ds.getRepository(Assure).delete({
                id,
                mutuelle: { id: req.mutuelle.id } as any
            });
            if (result.affected === 0) {
                res.status(404).json({ message: 'Assuré non trouvé' });
                return;
            }
            res.status(204).send();
        } catch (err) {
            console.error('Erreur deleteAssure :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** Search */
    static searchAssures: RequestHandler = async (req, res): Promise<void> => {
        try {
            const q    = String(req.query.query || '');
            const hash = EncryptionService.createHash(q);
            const ds   = await getTenantDataSource(req.mutuelle.id);

            const results = await ds.getRepository(Assure)
                .createQueryBuilder('a')
                .where('a.mutuelleId = :m', { m: req.mutuelle.id })
                .andWhere(
                    '(a.nom ILIKE :q OR a.prenom ILIKE :q OR a.numeroSecuriteSocialeHash = :hash)',
                    { q: `%${q}%`, hash }
                )
                .getMany();

            res.json(results);
        } catch (err) {
            console.error('Erreur searchAssures :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
}

// n’oubliez pas d’initialiser les routes
AssureController.initializeRoutes();
