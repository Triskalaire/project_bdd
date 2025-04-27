// src/controllers/AssureController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Assure } from '../entities/Assure';
import { getTenantDataSource } from '../services/TenantDataSource';
import { EncryptionService } from '../services/EncryptionService';
import { authMiddleware } from '../middleware/auth';

export class AssureController {
    public static router = Router();

    static initializeRoutes() {
        this.router.post(   '/',      authMiddleware, this.createAssure);
        this.router.get(    '/',      authMiddleware, this.getAssures);
        this.router.get(    '/:id',   authMiddleware, this.getAssureById);
        this.router.put(    '/:id',   authMiddleware, this.updateAssure);
        this.router.delete( '/:id',   authMiddleware, this.deleteAssure);
        this.router.get(    '/search',authMiddleware, this.searchAssures);
    }

    static createAssure: RequestHandler = async (req, res): Promise<void> => {
        const {
            nom, prenom, email, telephone,
            dateNaissance, numeroSecuriteSociale,
            iban, historiqueMedical
        } = req.body;

        // 1) Doublon sur email OU NSS
        const ds   = await getTenantDataSource(req.mutuelle.id);
        const repo = ds.getRepository(Assure);
        const dup  = await repo.findOne({
            where: [
                { email },
                { numeroSecuriteSociale }
            ]
        });
        if (dup) {
            res.status(409).json({
                message: 'Email ou numéro de sécurité sociale déjà utilisé'
            });
            return;
        }

        // 2) Validation simple
        if (
            !nom || !prenom || !email || !telephone ||
            !dateNaissance || !numeroSecuriteSociale ||
            !iban || !historiqueMedical
        ) {
            res.status(400).json({ message: 'Tous les champs sont requis' });
            return;
        }

        // 3) Hash pour recherche
        const hashNSS  = EncryptionService.createHash(numeroSecuriteSociale);
        const hashIBAN = EncryptionService.createHash(iban);
        const hashHist = EncryptionService.createHash(historiqueMedical);

        // 4) Création de l’assuré
        const newA = repo.create({
            nom,
            prenom,
            email,
            telephone,
            dateNaissance: new Date(dateNaissance),
            numeroSecuriteSociale,
            numeroSecuriteSocialeHash: hashNSS,
            iban,
            ibanHash:                   hashIBAN,
            historiqueMedical,
            historiqueMedicalHash:      hashHist
        });

        const saved = await repo.save(newA);
        res.status(201).json(saved);
    };

    static getAssures: RequestHandler = async (req, res): Promise<void> => {
        const ds   = await getTenantDataSource(req.mutuelle.id);
        const list = await ds.getRepository(Assure).find();
        res.json(list);
    };

    static getAssureById: RequestHandler = async (req, res): Promise<void> => {
        const { id } = req.params;
        const ds     = await getTenantDataSource(req.mutuelle.id);
        const a      = await ds.getRepository(Assure).findOne({ where: { id } });
        if (!a) {
            res.status(404).json({ message: 'Assuré non trouvé' });
            return;
        }
        res.json(a);
    };

    static updateAssure: RequestHandler = async (req, res): Promise<void> => {
        const { id } = req.params;
        const ds     = await getTenantDataSource(req.mutuelle.id);
        const repo   = ds.getRepository(Assure);

        const existing = await repo.findOne({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Assuré non trouvé' });
            return;
        }

        // Si NSS, IBAN ou historique sont modifiés, recalculer
        if (req.body.numeroSecuriteSociale) {
            existing.numeroSecuriteSociale     = req.body.numeroSecuriteSociale;
            existing.numeroSecuriteSocialeHash = EncryptionService.createHash(req.body.numeroSecuriteSociale);
        }
        if (req.body.iban) {
            existing.iban     = req.body.iban;
            existing.ibanHash = EncryptionService.createHash(req.body.iban);
        }
        if (req.body.historiqueMedical) {
            existing.historiqueMedical     = req.body.historiqueMedical;
            existing.historiqueMedicalHash = EncryptionService.createHash(req.body.historiqueMedical);
        }

        repo.merge(existing, req.body);
        const updated = await repo.save(existing);
        res.json(updated);
    };

    static deleteAssure: RequestHandler = async (req, res): Promise<void> => {
        const { id } = req.params;
        const ds     = await getTenantDataSource(req.mutuelle.id);
        const repo   = ds.getRepository(Assure);
        const result = await repo.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: 'Assuré non trouvé' });
            return;
        }
        // Les dossiers, justificatifs et messages
        // sont supprimés automatiquement par le CASCADE
        res.status(204).send();
    };

    static searchAssures: RequestHandler = async (req, res): Promise<void> => {
        const q    = String(req.query.query || '');
        const hash = EncryptionService.createHash(q);
        const ds   = await getTenantDataSource(req.mutuelle.id);

        const results = await ds.getRepository(Assure)
            .createQueryBuilder('a')
            .where('a.nom ILIKE :q OR a.prenom ILIKE :q OR a.numeroSecuriteSocialeHash = :hash', {
                q: `%${q}%`, hash
            })
            .getMany();

        res.json(results);
    };
}

// N’oubliez pas d’initialiser
AssureController.initializeRoutes();
