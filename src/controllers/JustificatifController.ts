// src/controllers/JustificatifController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import multer from 'multer';
import { getTenantDataSource } from '../services/TenantDataSource';
import { Justificatif } from '../entities/Justificatif';
import { Dossier }      from '../entities/Dossier';
import { authMiddleware } from '../middleware/auth';

export class JustificatifController {
  public static router = Router();

  // On stocke en mémoire pour récupérer buffer dans req.file.buffer
  private static upload = multer({ storage: multer.memoryStorage() });

  static initializeRoutes() {
    // 1) Créer un justificatif pour un dossier
    this.router.post(
        '/dossiers/:dossierId/justificatifs',
        authMiddleware,
        this.upload.single('file'),
        this.uploadJustificatif
    );

    // 2) Télécharger un justificatif
    this.router.get(
        '/justificatifs/:id',
        authMiddleware,
        this.getJustificatif
    );
    // 3) Lister tous les justificatifs d’un dossier
    this.router.get(
        '/dossiers/:dossierId/justificatifs',
        authMiddleware,
        this.getJustificatifsByDossier
    );
    // 4) Supprimer un justificatif
    this.router.delete(
        '/justificatifs/:id',
        authMiddleware,
        this.deleteJustificatif
    );
  }

  /** POST /dossiers/:dossierId/justificatifs */
  static uploadJustificatif: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { dossierId } = req.params;
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: 'Fichier manquant' });
        return;
      }

      const ds      = await getTenantDataSource(req.mutuelle.id);
      const dossier = await ds.getRepository(Dossier).findOne({
        where: { id: dossierId }
      });
      if (!dossier) {
        res.status(404).json({ message: 'Dossier non trouvé' });
        return;
      }

      const juRepo = ds.getRepository(Justificatif);
      const justif = juRepo.create({
        nomFichier:   file.originalname,
        typeDocument: file.mimetype,
        contenu:      file.buffer,
        taille:       file.size,
        mimeType:     file.mimetype,
        dossier:      { id: dossierId } as any
      });

      const saved = await juRepo.save(justif);
      res.status(201).json({ id: saved.id });
      return;
    } catch (err) {
      console.error('Erreur uploadJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
  };

  /** GET /justificatifs/:id */
  static getJustificatif: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const ds     = await getTenantDataSource(req.mutuelle.id);
      const justif = await ds.getRepository(Justificatif).findOne({
        where: { id }
      });
      if (!justif) {
        res.status(404).json({ message: 'Justificatif introuvable' });
        return;
      }

      res.setHeader('Content-Type', justif.mimeType);
      res.setHeader(
          'Content-Disposition',
          `attachment; filename="${justif.nomFichier}"`
      );
      res.send(justif.contenu);
      return;
    } catch (err) {
      console.error('Erreur getJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
  };

  /** GET /dossiers/:dossierId/justificatifs */
  static getJustificatifsByDossier: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { dossierId } = req.params;
      const ds            = await getTenantDataSource(req.mutuelle.id);
      const list          = await ds.getRepository(Justificatif).find({
        where: { dossier: { id: dossierId } as any },
        order: { dateCreation: 'ASC' }
      });
      res.json(list);
    } catch (err) {
      console.error('Erreur getJustificatifsByDossier :', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  /** DELETE /justificatifs/:id */
  static deleteJustificatif: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const ds     = await getTenantDataSource(req.mutuelle.id);
      const juRepo = ds.getRepository(Justificatif);

      // On s'assure qu'il existe
      const justif = await juRepo.findOne({ where: { id } });
      if (!justif) {
        res.status(404).json({ message: 'Justificatif non trouvé' });
        return;
      }

      // On supprime l'enregistrement
      await juRepo.delete(id);

      res.status(204).send();
      return;
    } catch (err) {
      console.error('Erreur deleteJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
  };
}

// Initialise les routes
JustificatifController.initializeRoutes();
