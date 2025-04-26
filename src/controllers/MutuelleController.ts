// src/controllers/MutuelleController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Mutuelle } from '../entities/Mutuelle';
import { getTenantDataSource } from '../services/TenantDataSource';
import { authMiddleware } from '../middleware/auth';

export class MutuelleController {
    public static router = Router();

    static initializeRoutes() {
        // Publiques
        this.router.post('/verifier-email', this.verifierEmail);
        this.router.post('/inscription',      this.inscription);
        this.router.post('/connexion',        this.connexion);

        // Protégées
        this.router.get('/profile', authMiddleware, this.getProfile);
        this.router.put('/profile', authMiddleware, this.updateProfile);
    }

    static verifierEmail: RequestHandler = async (req, res): Promise<void> => {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email requis' });
            return;
        }
        const exists = await AppDataSource
            .getRepository(Mutuelle)
            .exist({ where: { email } });
        res.json({ exists });
        return;
    };

    static inscription: RequestHandler = async (req, res): Promise<void> => {
        try {
            const {
                nom, email, motDePasse,
                telephone, adresse, ville, codePostal, pays, siret
            } = req.body;

            if (
                !nom || !email || !motDePasse ||
                !telephone || !adresse || !ville ||
                !codePostal || !pays || !siret
            ) {
                res.status(400).json({ message: 'Tous les champs sont requis' });
                return;
            }

            const salt   = await bcrypt.genSalt(10);
            const hashPw = await bcrypt.hash(motDePasse, salt);

            const repo  = AppDataSource.getRepository(Mutuelle);
            const saved = await repo.save({
                nom, email, motDePasse: hashPw,
                telephone, adresse, ville, codePostal, pays, siret
            });

            await getTenantDataSource(saved.id);

            const token = jwt.sign(
                { mutuelleId: saved.id },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                token,
                mutuelle: { id: saved.id, nom: saved.nom, email: saved.email }
            });
            return;
        } catch (err) {
            console.error('Erreur inscription :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };

    static connexion: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { email, motDePasse } = req.body;
            if (!email || !motDePasse) {
                res.status(400).json({ message: 'Email et mot de passe requis' });
                return;
            }

            const repo = AppDataSource.getRepository(Mutuelle);
            const m    = await repo.findOne({
                where: { email },
                select: ['id', 'motDePasse']
            });
            if (!m || !(await bcrypt.compare(motDePasse, m.motDePasse!))) {
                res.status(401).json({ message: 'Identifiants invalides' });
                return;
            }

            const token = jwt.sign(
                { mutuelleId: m.id },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );
            res.json({ token });
            return;
        } catch (err) {
            console.error('Erreur connexion :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };

    static getProfile: RequestHandler = async (req, res): Promise<void> => {
        try {
            const repo = AppDataSource.getRepository(Mutuelle);
            const m    = await repo.findOne({ where: { id: req.mutuelle.id } });
            if (!m) {
                res.status(404).json({ message: 'Mutuelle introuvable' });
                return;
            }
            res.json({
                id:    m.id,
                nom:   m.nom,
                email: m.email,
                telephone: m.telephone,
                adresse:   m.adresse,
                ville:     m.ville,
                codePostal:m.codePostal,
                pays:      m.pays,
                siret:     m.siret
            });
            return;
        } catch (err) {
            console.error('Erreur getProfile :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };

    static updateProfile: RequestHandler = async (req, res): Promise<void> => {
        try {
            const {
                nom, email, motDePasse,
                telephone, adresse, ville, codePostal, pays, siret
            } = req.body;

            const repo = AppDataSource.getRepository(Mutuelle);
            const m    = await repo.findOne({ where: { id: req.mutuelle.id } });
            if (!m) {
                res.status(404).json({ message: 'Mutuelle introuvable' });
                return;
            }

            if (nom)  m.nom = nom;
            if (email) m.email = email;
            if (telephone) m.telephone = telephone;
            if (adresse)   m.adresse   = adresse;
            if (ville)     m.ville     = ville;
            if (codePostal) m.codePostal = codePostal;
            if (pays)      m.pays      = pays;
            if (siret)     m.siret     = siret;

            if (motDePasse) {
                const salt = await bcrypt.genSalt(10);
                m.motDePasse = await bcrypt.hash(motDePasse, salt);
            }

            const updated = await repo.save(m);
            res.json({
                id:    updated.id,
                nom:   updated.nom,
                email: updated.email,
                telephone: updated.telephone,
                adresse:   updated.adresse,
                ville:     updated.ville,
                codePostal:updated.codePostal,
                pays:      updated.pays,
                siret:     updated.siret
            });
            return;
        } catch (err) {
            console.error('Erreur updateProfile :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };
}

MutuelleController.initializeRoutes();
