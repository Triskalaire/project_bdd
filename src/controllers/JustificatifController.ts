// src/controllers/JustificatifController.ts
import { Request, Response, Router, RequestHandler } from 'express';
import { Justificatif } from '../entities/Justificatif';
import { Dossier }      from '../entities/Dossier';
import { getTenantDataSource } from '../services/TenantDataSource';
import { authMiddleware }     from '../middleware/auth';
import multer from 'multer';
import fs     from 'fs';

export class JustificatifController {
  public static router = Router();
  private static upload = multer({ dest: 'uploads/' });

  static initializeRoutes() {
    this.router.post(
        '/dossiers/:dossierId/justificatifs',
        authMiddleware,
        this.upload.single('file'),
        this.uploadJustificatif
    );
    this.router.get(
        '/justificatifs/:id',
        authMiddleware,
        this.getJustificatif
    );
    this.router.delete(
        '/justificatifs/:id',
        authMiddleware,
        this.deleteJustificatif
    );
  }

  static uploadJustificatif: RequestHandler = async (req, res) => {
    try {
      const dossierId = req.params.dossierId;
      const ds = await getTenantDataSource(req.mutuelle.id);
      const dossierRepo = ds.getRepository(Dossier);

      const dossier = await dossierRepo.findOne({
        where: { id: dossierId, mutuelle: { id: req.mutuelle.id } }
      });
      if (!dossier) {
        res.status(404).json({ message: 'Dossier non trouvé' });
        return;
      }

      const file = req.file!;
      const buffer = fs.readFileSync(file.path);

      const justifRepo = ds.getRepository(Justificatif);
      const justif = justifRepo.create({
        nomFichier: file.originalname,
        typeDocument: file.mimetype,
        contenu: buffer,
        taille: file.size,
        mimeType: file.mimetype,
        dossier
      });
      await justifRepo.save(justif);

      fs.unlinkSync(file.path);
      res.status(201).json(justif);
    } catch (err) {
      console.error('Erreur uploadJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  static getJustificatif: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const ds = await getTenantDataSource(req.mutuelle.id);
      const justifRepo = ds.getRepository(Justificatif);

      const j = await justifRepo.findOne({
        where: { id, dossier: { mutuelle: { id: req.mutuelle.id } } }
      });
      if (!j) {
        res.status(404).json({ message: 'Justificatif non trouvé' });
        return;
      }
      res.setHeader('Content-Disposition', `attachment; filename="${j.nomFichier}"`);
      res.send(j.contenu);
    } catch (err) {
      console.error('Erreur getJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  static deleteJustificatif: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const ds = await getTenantDataSource(req.mutuelle.id);
      const result = await ds.getRepository(Justificatif).delete({
        id,
        dossier: { mutuelle: { id: req.mutuelle.id } } as any
      });
      if (result.affected === 0) {
        res.status(404).json({ message: 'Justificatif non trouvé' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      console.error('Erreur deleteJustificatif :', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
}

JustificatifController.initializeRoutes();
