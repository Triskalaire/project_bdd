# API Mutuelle - Gestion des Dossiers et Justificatifs

Ce projet est une API RESTful développée avec Node.js, Express et TypeORM pour la gestion des dossiers et justificatifs d'une mutuelle.

## Structure du Projet

```
project_bdd/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuration de la base de données
│   ├── controllers/
│   │   ├── MutuelleController.ts # Gestion des mutuelles
│   │   ├── DossierController.ts  # Gestion des dossiers
│   │   ├── JustificatifController.ts # Gestion des justificatifs
│   │   ├── AssureController.ts   # Gestion des assurés
│   │   ├── OffreController.ts    # Gestion des offres
│   │   └── MessageController.ts  # Gestion des messages
│   ├── entities/
│   │   ├── Mutuelle.ts          # Entité Mutuelle
│   │   ├── Dossier.ts           # Entité Dossier
│   │   ├── Justificatif.ts      # Entité Justificatif
│   │   ├── Assure.ts            # Entité Assuré
│   │   ├── Offre.ts             # Entité Offre
│   │   └── Message.ts           # Entité Message
│   ├── middleware/
│   │   └── auth.ts              # Middleware d'authentification
│   ├── services/
│   │   └── EncryptionService.ts # Service de chiffrement
│   ├── app.ts                   # Configuration de l'application Express
│   └── index.ts                 # Point d'entrée de l'application
├── package.json                 # Dépendances et scripts
└── tsconfig.json                # Configuration TypeScript
```

## Technologies Utilisées

- **Node.js**: Environnement d'exécution JavaScript
- **Express**: Framework web pour Node.js
- **TypeORM**: ORM pour TypeScript
- **TypeScript**: Langage de programmation typé
- **PostgreSQL**: Base de données relationnelle
- **Multer**: Middleware pour la gestion des fichiers
- **Cors**: Middleware pour gérer les requêtes cross-origin

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer la base de données :
- Créer un fichier `.env` à la racine du projet
- Ajouter les variables d'environnement nécessaires (voir `.env.example`)

4. Lancer l'application :
```bash
npm run dev
```

## Architecture

### Entités

1. **Mutuelle (entities/Mutuelle.ts)**
   - `id`: UUID - Identifiant unique de la mutuelle
   - `nom`: string - Nom de la mutuelle
   - `email`: string - Email de contact
   - `motDePasse`: string - Mot de passe chiffré
   - `adresse`: string - Adresse postale
   - `telephone`: string - Numéro de téléphone
   - `dossiers`: Relation OneToMany avec Dossier
   - `offres`: Relation OneToMany avec Offre
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

2. **Assure (entities/Assure.ts)**
   - `id`: UUID - Identifiant unique de l'assuré
   - `nom`: string - Nom de l'assuré
   - `prenom`: string - Prénom de l'assuré
   - `numeroSecuriteSociale`: string - Numéro de sécurité sociale (chiffré)
   - `dateNaissance`: Date - Date de naissance
   - `adresse`: string - Adresse postale
   - `email`: string - Email de contact
   - `telephone`: string - Numéro de téléphone
   - `iban`: string - IBAN (chiffré)
   - `dossiers`: Relation OneToMany avec Dossier
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

3. **Dossier (entities/Dossier.ts)**
   - `id`: UUID - Identifiant unique du dossier
   - `numeroDossier`: string - Numéro de référence
   - `description`: string - Description du dossier
   - `montantTotal`: number - Montant total du remboursement
   - `statut`: enum - Statut du dossier (EN_ATTENTE, EN_COURS, ACCEPTE, REFUSE)
   - `mutuelle`: Relation ManyToOne avec Mutuelle
   - `assure`: Relation ManyToOne avec Assure
   - `justificatifs`: Relation OneToMany avec Justificatif
   - `messages`: Relation OneToMany avec Message
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

4. **Justificatif (entities/Justificatif.ts)**
   - `id`: UUID - Identifiant unique du justificatif
   - `nomFichier`: string - Nom original du fichier
   - `typeDocument`: string - Type de document (extension)
   - `contenu`: Buffer - Contenu du fichier
   - `taille`: number - Taille du fichier en octets
   - `mimeType`: string - Type MIME du fichier
   - `dossier`: Relation ManyToOne avec Dossier
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

5. **Offre (entities/Offre.ts)**
   - `id`: UUID - Identifiant unique de l'offre
   - `nom`: string - Nom de l'offre
   - `description`: string - Description de l'offre
   - `tauxRemboursement`: number - Taux de remboursement en pourcentage
   - `plafondAnnuel`: number - Plafond annuel de remboursement
   - `mutuelle`: Relation ManyToOne avec Mutuelle
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

6. **Message (entities/Message.ts)**
   - `id`: UUID - Identifiant unique du message
   - `contenu`: string - Contenu du message
   - `expediteur`: enum - Type d'expéditeur (MUTUELLE, ASSURE)
   - `dossier`: Relation ManyToOne avec Dossier
   - `createdAt`: Date - Date de création
   - `updatedAt`: Date - Date de mise à jour

### Contrôleurs

1. **MutuelleController (controllers/MutuelleController.ts)**
   - `inscription`: POST /mutuelles/inscription
     - Création d'une nouvelle mutuelle
     - Validation des données
     - Chiffrement du mot de passe
   - `connexion`: POST /mutuelles/connexion
     - Authentification
     - Génération du token JWT
   - `getProfile`: GET /mutuelles/:id
     - Récupération des informations de la mutuelle
     - Vérification des permissions

2. **AssureController (controllers/AssureController.ts)**
   - `createAssure`: POST /assures
     - Création d'un nouvel assuré
     - Chiffrement des données sensibles
   - `getAssures`: GET /assures
     - Liste des assurés de la mutuelle
     - Filtrage par critères
   - `getAssure`: GET /assures/:id
     - Détails d'un assuré
     - Vérification des permissions
   - `updateAssure`: PUT /assures/:id
     - Mise à jour des informations
     - Validation des modifications

3. **DossierController (controllers/DossierController.ts)**
   - `createDossier`: POST /dossiers
     - Création d'un nouveau dossier
     - Association avec la mutuelle et l'assuré
   - `getDossiers`: GET /dossiers
     - Liste des dossiers de la mutuelle
     - Filtrage par statut
   - `getDossier`: GET /dossiers/:id
     - Détails d'un dossier
     - Vérification des permissions
   - `updateDossier`: PUT /dossiers/:id
     - Mise à jour d'un dossier
     - Validation des modifications

4. **JustificatifController (controllers/JustificatifController.ts)**
   - `uploadJustificatif`: POST /api/dossiers/:dossierId/justificatifs
     - Upload d'un fichier
     - Association avec le dossier
     - Vérification des permissions
   - `getJustificatif`: GET /api/justificatifs/:id
     - Téléchargement d'un justificatif
     - Vérification des permissions
   - `deleteJustificatif`: DELETE /api/justificatifs/:id
     - Suppression d'un justificatif
     - Vérification des permissions

5. **OffreController (controllers/OffreController.ts)**
   - `createOffre`: POST /offres
     - Création d'une nouvelle offre
     - Association avec la mutuelle
   - `getOffres`: GET /offres
     - Liste des offres de la mutuelle
     - Filtrage par critères
   - `getOffre`: GET /offres/:id
     - Détails d'une offre
     - Vérification des permissions
   - `updateOffre`: PUT /offres/:id
     - Mise à jour d'une offre
     - Validation des modifications

6. **MessageController (controllers/MessageController.ts)**
   - `createMessage`: POST /dossiers/:dossierId/messages
     - Création d'un nouveau message
     - Association avec le dossier
   - `getMessages`: GET /dossiers/:dossierId/messages
     - Liste des messages d'un dossier
     - Filtrage par date
   - `getMessage`: GET /messages/:id
     - Détails d'un message
     - Vérification des permissions

### Gestion des Autorisations

1. **Middleware d'Authentification (middleware/auth.ts)**
   - Vérification du token JWT
   - Extraction des informations de l'utilisateur
   - Ajout de l'utilisateur à la requête

2. **Vérification des Permissions**
   - Chaque contrôleur vérifie que l'utilisateur a accès à la ressource demandée
   - Pour les dossiers et justificatifs, vérification que la mutuelle est propriétaire
   - Utilisation des relations TypeORM pour les vérifications

3. **Exemple de Vérification**
```typescript
// Dans DossierController
const dossier = await dossierRepository.findOne({
  where: {
    id: dossierId,
    mutuelle: { id: req.user.id } // Vérification que la mutuelle est propriétaire
  }
});
```

4. **Sécurité des Routes**
   - Toutes les routes (sauf inscription/connexion) sont protégées
   - Le middleware d'authentification est appliqué globalement
   - Les tokens JWT ont une durée de validité limitée

## API Endpoints

### Mutuelles
- `POST /mutuelles/inscription` - Inscription d'une nouvelle mutuelle
- `POST /mutuelles/connexion` - Connexion d'une mutuelle
- `GET /mutuelles/:id` - Récupération des informations d'une mutuelle

### Dossiers
- `POST /dossiers` - Création d'un nouveau dossier
- `GET /dossiers` - Liste des dossiers
- `GET /dossiers/:id` - Détails d'un dossier
- `PUT /dossiers/:id` - Mise à jour d'un dossier

### Justificatifs
- `POST /api/dossiers/:dossierId/justificatifs` - Upload d'un justificatif
- `GET /api/justificatifs/:id` - Téléchargement d'un justificatif
- `DELETE /api/justificatifs/:id` - Suppression d'un justificatif

## Sécurité

- Authentification JWT
- Protection des routes
- Validation des données
- Gestion des erreurs
- Stockage sécurisé des fichiers
- Vérification des permissions par ressource

## Développement

### Scripts NPM
- `npm run dev` - Lancement en mode développement
- `npm run build` - Compilation TypeScript
- `npm run start` - Démarrage en mode production
- `npm run test` - Exécution des tests

### Bonnes Pratiques
- Utilisation de TypeScript pour le typage fort
- Validation des données en entrée
- Gestion des erreurs centralisée
- Documentation des endpoints
- Tests unitaires et d'intégration

## Déploiement

1. Compiler le projet :
```bash
npm run build
```

2. Configurer les variables d'environnement en production

3. Démarrer le serveur :
```bash
npm start
```

## Contribution

1. Fork du projet
2. Création d'une branche (`git checkout -b feature/AmazingFeature`)
3. Commit des changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouverture d'une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

### Services

1. **EncryptionService (services/EncryptionService.ts)**
   - Chiffrement des données sensibles (numéro de sécurité sociale, IBAN)
   - Utilisation de l'algorithme AES avec CryptoJS
   - Gestion des clés de chiffrement via variable d'environnement
   - Méthodes :
     - `encrypt(text: string)`: Chiffrement AES
     - `decrypt(encryptedText: string)`: Déchiffrement AES
     - `createHash(text: string)`: Génération de hash SHA-256

### Configuration

1. **Database (config/database.ts)**
   - Configuration de la connexion à PostgreSQL
   - Paramètres de connexion :
     - Host: `DB_HOST` (localhost par défaut)
     - Port: `DB_PORT` (5432 par défaut)
     - Username: `DB_USER` (postgres par défaut)
     - Password: `DB_PASSWORD` (admin par défaut)
     - Database: `DB_NAME` (mutuelles par défaut)
   - Options :
     - `synchronize: true` - Synchronisation automatique du schéma
     - `logging: true` - Activation des logs SQL
   - Entités configurées :
     - Mutuelle
     - Assure
     - Offre
     - Dossier
     - Message
     - Justificatif
   - Migrations et subscribers configurés
