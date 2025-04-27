// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { AppDataSource } from './config/database';
import { MutuelleController } from './controllers/MutuelleController';
import { AssureController }   from './controllers/AssureController';
import { DossierController }  from './controllers/DossierController';
import { JustificatifController } from './controllers/JustificatifController';
import { OffreController }    from './controllers/OffreController';
import { MessageController} from "./controllers/MessageController";
import { authMiddleware }     from './middleware/auth';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 1) Routes publiques (auth)
app.use('/mutuelles', MutuelleController.router);

// 2) Auth + initialisation schéma tenant
app.use(authMiddleware);

// 3) Routes privées CRUD
app.use('/assures',  AssureController.router);
app.use('/dossiers', DossierController.router);
app.use('/',         MessageController.router);

app.use('/',         JustificatifController.router);

app.use('/offres',   OffreController.router);

// Erreur globales
app.use(
    (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
);

// Démarrage
AppDataSource.initialize()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });
    })
    .catch((error: Error) => {
        console.error('Erreur connexion DB :', error);
    });
