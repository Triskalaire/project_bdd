import express from "express";
import cors from "cors";
import { createConnection } from "typeorm";
import { MutuelleController } from "./controllers/MutuelleController";
import { DossierController } from "./controllers/DossierController";
import { JustificatifController } from "./controllers/JustificatifController";
import multer from "multer";

const app = express();

// Configuration de multer pour le stockage en mémoire
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5MB
    },
});

app.use(cors());
app.use(express.json());

// Routes des mutuelles
app.use("/mutuelles", MutuelleController.router);

// Routes des dossiers
app.use("/dossiers", DossierController.getRouter());

// Routes des justificatifs
app.use("/api", JustificatifController.getRouter());

// Middleware pour gérer les erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Une erreur est survenue" });
});

// Connexion à la base de données et démarrage du serveur
createConnection()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Erreur de connexion à la base de données:", error);
    }); 