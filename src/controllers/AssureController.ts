// src/controllers/AssureController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Assure } from '../entities/Assure';
import { getTenantDataSource } from '../services/TenantDataSource';
import { EncryptionService } from '../services/EncryptionService';
import { authMiddleware } from '../middleware/auth';

export class AssureController {
    public static router = Router();

    static initializeRoutes() {
        this.router.post('/', authMiddleware, this.createAssure);
        // ...
    }

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

            // Validation rapide
            if (
                !nom ||
                !prenom ||
                !email ||
                !telephone ||
                !dateNaissance ||
                !numeroSecuriteSociale ||
                !iban ||
                !historiqueMedical
            ) {
                res.status(400).json({ message: 'Tous les champs sont requis' });
                return;
            }

            const ds       = await getTenantDataSource(req.mutuelle.id);
            const repo     = ds.getRepository(Assure);
            const hashNSS  = EncryptionService.createHash(numeroSecuriteSociale);
            const hashIBAN = EncryptionService.createHash(iban);
            const hashHist = EncryptionService.createHash(historiqueMedical);

            const assure = repo.create({
                nom,
                prenom,
                email,
                telephone,
                dateNaissance: new Date(dateNaissance),

                // version “raw”
                numeroSecuriteSociale,
                iban,
                historiqueMedical,

                // version “hash” pour recherche sécurisée
                numeroSecuriteSocialeHash: hashNSS,
                ibanHash:                 hashIBAN,
                historiqueMedicalHash:    hashHist,

                mutuelle: { id: req.mutuelle.id } as any
            });

            const saved = await repo.save(assure);
            res.status(201).json(saved);
            return;
        } catch (error) {
            console.error('Erreur createAssure :', error);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };
}
AssureController.initializeRoutes();
