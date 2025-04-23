import { Request, Response, Router } from "express";
import { getRepository } from "typeorm";
import { Justificatif } from "../entities/Justificatif";
import { Dossier } from "../entities/Dossier";
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Déclaration de l'interface pour étendre Request
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
      };
    }
  }
}

export class JustificatifController {
  public static router = Router();
  private static upload = multer({ dest: "uploads/" });

  static getRouter() {
    return this.router;
  }

  static async uploadJustificatif(req: Request, res: Response) {
    try {
      const dossierId = req.params.dossierId;
      const dossierRepository = getRepository(Dossier);
      const dossier = await dossierRepository.findOne({
        where: {
          id: dossierId,
          mutuelle: { id: req.user.id }
        }
      });

      if (!dossier) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }

      const justificatifRepository = getRepository(Justificatif);
      const justificatif = justificatifRepository.create({
        nomFichier: req.file.originalname,
        typeDocument: path.extname(req.file.originalname),
        contenu: fs.readFileSync(req.file.path),
        taille: req.file.size,
        mimeType: req.file.mimetype,
        dossier: dossier
      });

      // Supprimer le fichier temporaire
      fs.unlinkSync(req.file.path);

      await justificatifRepository.save(justificatif);
      res.status(201).json(justificatif);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors du téléchargement du justificatif" });
    }
  }

  static async getJustificatif(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const justificatifRepository = getRepository(Justificatif);
      const justificatif = await justificatifRepository.findOne({
        where: {
          id: id,
          dossier: {
            mutuelle: { id: req.user.id }
          }
        }
      });

      if (!justificatif) {
        return res.status(404).json({ message: "Justificatif non trouvé" });
      }

      res.setHeader("Content-Type", justificatif.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${justificatif.nomFichier}"`);
      res.send(justificatif.contenu);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération du justificatif" });
    }
  }

  static async deleteJustificatif(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const justificatifRepository = getRepository(Justificatif);
      const justificatif = await justificatifRepository.findOne({
        where: {
          id: id,
          dossier: {
            mutuelle: { id: req.user.id }
          }
        }
      });

      if (!justificatif) {
        return res.status(404).json({ message: "Justificatif non trouvé" });
      }

      await justificatifRepository.remove(justificatif);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la suppression du justificatif" });
    }
  }

  // Routes
  static initializeRoutes() {
    JustificatifController.router.post(
      "/dossiers/:dossierId/justificatifs",
      authMiddleware,
      JustificatifController.upload.single("file"),
      JustificatifController.uploadJustificatif
    );
    JustificatifController.router.get(
      "/justificatifs/:id",
      authMiddleware,
      JustificatifController.getJustificatif
    );
    JustificatifController.router.delete(
      "/justificatifs/:id",
      authMiddleware,
      JustificatifController.deleteJustificatif
    );
  }
}

// Initialiser les routes
JustificatifController.initializeRoutes(); 