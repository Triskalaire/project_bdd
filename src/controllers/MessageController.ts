import { Request, Response, Router, RequestHandler } from 'express';
import { Message }     from '../entities/Message';
import { Dossier }     from '../entities/Dossier';
import { getTenantDataSource } from '../services/TenantDataSource';
import { authMiddleware }     from '../middleware/auth';

export class MessageController {
    public static router = Router();

    static initializeRoutes() {
        // 1) Créer un message pour un dossier
        this.router.post(
            '/dossiers/:dossierId/messages',
            authMiddleware,
            this.createMessage
        );

        // 2) Lister tous les messages d’un dossier
        this.router.get(
            '/dossiers/:dossierId/messages',
            authMiddleware,
            this.getMessages
        );

        // 3) Récupérer un message unique
        this.router.get(
            '/messages/:id',
            authMiddleware,
            this.getMessageById
        );

        // 4) Mettre à jour un message
        this.router.put(
            '/messages/:id',
            authMiddleware,
            this.updateMessage
        );

        // 5) Supprimer un message
        this.router.delete(
            '/messages/:id',
            authMiddleware,
            this.deleteMessage
        );
    }

    /** POST /dossiers/:dossierId/messages */
    static createMessage: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { dossierId } = req.params;
            const { contenu }   = req.body;
            if (!contenu) {
                res.status(400).json({ message: 'Le contenu est requis' });
                return;
            }

            const ds      = await getTenantDataSource(req.mutuelle.id);
            const dRepo   = ds.getRepository(Dossier);
            const dossier = await dRepo.findOne({ where: { id: dossierId } });
            if (!dossier) {
                res.status(404).json({ message: 'Dossier introuvable' });
                return;
            }

            const mRepo = ds.getRepository(Message);
            const msg   = mRepo.create({
                contenu,
                dossier: { id: dossierId } as any
            });
            const saved = await mRepo.save(msg);

            res.status(201).json(saved);
        } catch (err) {
            console.error('Erreur createMessage :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** GET /dossiers/:dossierId/messages */
    static getMessages: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { dossierId } = req.params;
            const ds            = await getTenantDataSource(req.mutuelle.id);
            const messages      = await ds.getRepository(Message).find({
                where: { dossier: { id: dossierId } as any },
                order: { dateCreation: 'ASC' }
            });
            res.json(messages);
        } catch (err) {
            console.error('Erreur getMessages :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** GET /messages/:id */
    static getMessageById: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const ds     = await getTenantDataSource(req.mutuelle.id);
            const msg    = await ds.getRepository(Message).findOne({ where: { id } });
            if (!msg) {
                res.status(404).json({ message: 'Message introuvable' });
                return;
            }
            res.json(msg);
        } catch (err) {
            console.error('Erreur getMessageById :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** PUT /messages/:id */
    static updateMessage: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id }       = req.params;
            const { contenu }  = req.body;
            const ds           = await getTenantDataSource(req.mutuelle.id);
            const mRepo        = ds.getRepository(Message);
            const existing     = await mRepo.findOne({ where: { id } });
            if (!existing) {
                res.status(404).json({ message: 'Message introuvable' });
                return;
            }

            if (contenu) existing.contenu = contenu;
            const updated = await mRepo.save(existing);
            res.json(updated);
        } catch (err) {
            console.error('Erreur updateMessage :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };

    /** DELETE /messages/:id */
    static deleteMessage: RequestHandler = async (req, res): Promise<void> => {
        try {
            const { id }    = req.params;
            const ds        = await getTenantDataSource(req.mutuelle.id);
            const mRepo     = ds.getRepository(Message);
            const result    = await mRepo.delete(id);
            if (result.affected === 0) {
                res.status(404).json({ message: 'Message introuvable' });
                return;
            }
            res.status(204).send();
        } catch (err) {
            console.error('Erreur deleteMessage :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
}

// Initialisation des routes
MessageController.initializeRoutes();
