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
        // Routes publiques
        this.router.post('/verifier-email', this.verifierEmail);
        this.router.post('/inscription',      this.inscription);
        this.router.post('/connexion',        this.connexion);

        // Routes protégées
        this.router.get('/profile', authMiddleware, this.getProfile);
        this.router.put('/profile', authMiddleware, this.updateProfile);
    }

    /** Vérifie qu’un email n’est pas déjà utilisé */
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
    };

    /** Inscription d'une nouvelle mutuelle */
    static inscription: RequestHandler = async (req, res) => {
        try {
            const {
                nom,
                email,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret,
                motDePasse
            } = req.body;

            // 1) Validation rapide
            if (
                !nom || !email || !telephone ||
                !adresse || !ville || !codePostal ||
                !pays || !siret || !motDePasse
            ) {
                res.status(400).json({ message: 'Tous les champs sont requis' });
                return;
            }

            const repo = AppDataSource.getRepository(Mutuelle);

            // 2) Empêcher doublon sur email OU SIRET
            const existing = await repo.findOne({
                where: [
                    { email },
                    { siret }
                ]
            });
            if (existing) {
                res.status(409).json({
                    message: 'Une mutuelle existe déjà avec cet email ou ce SIRET'
                });
                return;
            }

            // 3) Hash du mot de passe
            const hashPw = await bcrypt.hash(motDePasse, 10);

            // 4) Création et enregistrement en schema public
            const newMut = repo.create({
                nom,
                email,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret,
                motDePasse: hashPw
            });
            const saved = await repo.save(newMut);

            // 5) Création du schema tenant et seed de la mutuelle
            await getTenantDataSource(saved.id);

            // 6) Exclure le motDePasse du retour
            const { motDePasse: _, ...publicInfo } = saved as any;
            res.status(201).json(publicInfo);
        } catch (err) {
            console.error('Erreur inscription :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };


    /** Connexion : renvoie un JWT si ok */
    static connexion: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { email, motDePasse } = req.body;
            if (!email || !motDePasse) {
                res.status(400).json({ message: 'Email et motDePasse requis' });
                return;
            }

            const repo = AppDataSource.getRepository(Mutuelle);
            const m = await repo.findOne({
                where:  { email },
                select: ['id','motDePasse']
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

    /** Lit le profil de la mutuelle (schema public) */
    static getProfile: RequestHandler = async (req, res): Promise<void> => {
        try {
            const repo = AppDataSource.getRepository(Mutuelle);
            const m    = await repo.findOne({ where: { id: req.mutuelle.id } });
            if (!m) {
                res.status(404).json({ message: 'Mutuelle introuvable' });
                return;
            }
            res.json({
                id:          m.id,
                nom:         m.nom,
                email:       m.email,
                telephone:   m.telephone,
                adresse:     m.adresse,
                ville:       m.ville,
                codePostal:  m.codePostal,
                pays:        m.pays,
                siret:       m.siret
            });
            return;
        } catch (err) {
            console.error('Erreur getProfile :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };

    /** Met à jour le profil (schema public) */
    static updateProfile: RequestHandler = async (req, res): Promise<void> => {
        try {
            const {
                nom,
                email,
                motDePasse,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret
            } = req.body;

            const repo = AppDataSource.getRepository(Mutuelle);
            const m    = await repo.findOne({ where: { id: req.mutuelle.id } });
            if (!m) {
                res.status(404).json({ message: 'Mutuelle introuvable' });
                return;
            }

            if (nom)       m.nom       = nom;
            if (email)     m.email     = email;
            if (telephone) m.telephone = telephone;
            if (adresse)   m.adresse   = adresse;
            if (ville)     m.ville     = ville;
            if (codePostal)m.codePostal= codePostal;
            if (pays)      m.pays      = pays;
            if (siret)     m.siret     = siret;

            if (motDePasse) {
                const salt = await bcrypt.genSalt(10);
                m.motDePasse = await bcrypt.hash(motDePasse, salt);
            }

            const updated = await repo.save(m);
            res.json({
                id:          updated.id,
                nom:         updated.nom,
                email:       updated.email,
                telephone:   updated.telephone,
                adresse:     updated.adresse,
                ville:       updated.ville,
                codePostal:  updated.codePostal,
                pays:        updated.pays,
                siret:       updated.siret
            });
            return;
        } catch (err) {
            console.error('Erreur updateProfile :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
    };
}

// Initialisation des routes
MutuelleController.initializeRoutes();
