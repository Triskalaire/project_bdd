// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getTenantDataSource } from '../services/TenantDataSource';

declare global {
    namespace Express {
        interface Request {
            mutuelle: { id: string };
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ message: 'Token d’authentification manquant' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Token d’authentification invalide' });
        return;
    }

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (err) {
        res.status(401).json({ message: 'Token invalide ou expiré' });
        return;
    }

    const mutuelleId = payload.mutuelleId as string | undefined;
    if (!mutuelleId) {
        res.status(401).json({ message: 'Token ne contient pas de mutuelleId' });
        return;
    }

    // Initialise (ou récupère) la DataSource pointant sur le schema du tenant
    try {
        await getTenantDataSource(mutuelleId);
    } catch (err) {
        console.error('Erreur initialisation DataSource tenant :', err);
        res.status(500).json({ message: 'Erreur interne' });
        return;
    }

    // On ne stocke que l’ID : le reste des infos mutuelle
    // vit dans le schema public et sera lu au besoin
    req.mutuelle = { id: mutuelleId };
    next();
};
