import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { MutuelleController } from './controllers/MutuelleController';
import { DossierController } from './controllers/DossierController';
import { JustificatifController } from './controllers/JustificatifController';
import { AssureController } from './controllers/AssureController';
import { OffreController } from './controllers/OffreController';
import { authMiddleware } from './middleware/auth';
import { Mutuelle } from './entities/Mutuelle';
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configuration de l'application
app.use(cors());
app.use(express.json());

// Déclaration des types étendus
declare global {
    namespace Express {
        interface Request {
            tenant?: string;
            mutuelle: Mutuelle;
        }
    }
}

// Middleware tenant-aware
const tenantMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).send('Authorization header missing');

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { tenant: string };
        const tenant = decoded.tenant;

        if (!tenant) return res.status(400).send('Tenant not found in token');

        req.tenant = tenant;
        await AppDataSource.query(`SET search_path TO ${tenant}`);

        next();
    } catch (err) {
        res.status(401).send('Invalid token or tenant');
    }
};

// Initialisation de la connexion à la base de données
AppDataSource.initialize()
    .then(() => {
        console.log("Connexion à la base de données établie");

        // Routes publiques
        app.use('/mutuelles', MutuelleController.router);

        // Middleware d'authentification
        app.use(tenantMiddleware);
        app.use(authMiddleware);

        // Routes protégées
        app.use('/assures', AssureController.router);
        app.use('/dossiers', DossierController.router);
        app.use('/justificatifs', JustificatifController.router);
        app.use('/offres', OffreController.router);

        // Middleware pour gérer les erreurs
        app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error(err.stack);
            res.status(500).json({ message: 'Une erre est survenue' });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });
    })
    .catch((error: Error) => {
        console.error('Erreur de connexion à la base de données:', error);
    }); 