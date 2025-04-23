import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { MutuelleController } from './controllers/MutuelleController';
import { DossierController } from './controllers/DossierController';
import { JustificatifController } from './controllers/JustificatifController';
import { authMiddleware } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());

// Initialisation de la connexion à la base de données
AppDataSource.initialize()
    .then(() => {
        console.log("Connexion à la base de données établie");

        // Routes des mutuelles (sans authentification)
        app.use('/mutuelles', MutuelleController.router);

        // Middleware d'authentification pour les routes protégées
        app.use(authMiddleware);

        // Routes des dossiers
        app.use('/dossiers', DossierController.getRouter());

        // Routes des justificatifs
        app.use('/api', JustificatifController.getRouter());

        // Middleware pour gérer les erreurs
        app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error(err.stack);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erreur de connexion à la base de données:', error);
    }); 