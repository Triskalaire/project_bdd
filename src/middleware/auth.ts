import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Mutuelle } from '../entities/Mutuelle';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Token d\'authentification manquant' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token d\'authentification invalide' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { mutuelleId: string };
        
        // Toujours chercher dans le schéma public pour l'authentification
        await AppDataSource.query(`SET search_path TO public`);
        
        const mutuelleRepository = AppDataSource.getRepository(Mutuelle);
        const mutuelle = await mutuelleRepository.findOne({ 
            where: { id: decoded.mutuelleId },
            select: ['id', 'nom', 'email', 'telephone', 'adresse', 'ville', 'codePostal', 'pays', 'siret']
        });

        if (!mutuelle) {
            return res.status(401).json({ message: 'Mutuelle non trouvée' });
        }

        req.mutuelle = mutuelle;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(401).json({ message: 'Token d\'authentification invalide' });
    }
};

// Déclaration de l'interface Request étendue
declare global {
    namespace Express {
        interface Request {
            mutuelle: Mutuelle;
        }
    }
} 