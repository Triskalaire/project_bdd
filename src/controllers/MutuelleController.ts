import { Request, Response, Router } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Mutuelle } from '../entities/Mutuelle';
import { EncryptionService } from '../services/EncryptionService';

export class MutuelleController {
    static router = Router();

    static async inscription(req: Request, res: Response) {
        try {
            const { nom, email, motDePasse, telephone, adresse, ville, codePostal, pays, siret } = req.body;

            // Validation des données requises
            if (!nom || !email || !motDePasse || !telephone || !adresse || !ville || !codePostal || !pays || !siret) {
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            const existingMutuelle = await mutuelleRepository.findOne({ where: { email } });

            if (existingMutuelle) {
                return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
            }

            const hashedPassword = await bcrypt.hash(motDePasse, 10);
            const mutuelle = mutuelleRepository.create({
                nom,
                email,
                motDePasse: hashedPassword,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret
            });

            await mutuelleRepository.save(mutuelle);

            // Création du schéma pour la mutuelle
            await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS mutuelle_${mutuelle.id}`);

            const token = jwt.sign(
                { mutuelleId: mutuelle.id },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Mutuelle créée avec succès',
                token
            });
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({ message: 'Erreur lors de l\'inscription' });
        }
    }

    static async connexion(req: Request, res: Response) {
        try {
            const { email, motDePasse } = req.body;

            // Validation des données requises
            if (!email || !motDePasse) {
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            const mutuelle = await mutuelleRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'motDePasse'] // Inclure le mot de passe dans la sélection
            });

            if (!mutuelle) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const isValidPassword = await bcrypt.compare(motDePasse, mutuelle.motDePasse);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const token = jwt.sign(
                { mutuelleId: mutuelle.id },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );

            res.json({ token });
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({ message: 'Erreur lors de la connexion' });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            res.json(mutuelle);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            const mutuelle = req.mutuelle;
            const { nom, email, telephone, adresse, ville, codePostal, pays, siret } = req.body;

            const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
            await mutuelleRepository.update(mutuelle.id, {
                nom,
                email,
                telephone,
                adresse,
                ville,
                codePostal,
                pays,
                siret
            });

            res.json({ message: 'Profil mis à jour avec succès' });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
        }
    }
}

// Configuration des routes
MutuelleController.router.post('/inscription', MutuelleController.inscription);
MutuelleController.router.post('/connexion', MutuelleController.connexion);
MutuelleController.router.get('/profile', MutuelleController.getProfile);
MutuelleController.router.put('/profile', MutuelleController.updateProfile); 