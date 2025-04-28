# Projet de Gestion des Mutuelles

## Instructions d'installation

### Prérequis
- Node.js (version 14 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm ou yarn

### Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd project_bdd
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer la base de données :
- Créer une base de données PostgreSQL nommée "mutuelles"
- Configurer les paramètres de connexion dans `ormconfig.json` :
  - host: localhost
  - port: 5432
  - username: postgres
  - password: admin
  - database: mutuelles

4. Configurer les variables d'environnement :
- Créer un fichier `.env` à la racine du projet
- Ajouter la clé de chiffrement :
```
ENCRYPTION_KEY=votre_clé_secrète
```

5. Lancer l'application :
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## Description du modèle

### 1. Architecture multi-tenant

Le système utilise une architecture multi-tenant avec deux niveaux de schémas :

#### Schéma public
- Contient uniquement l'entité `Mutuelle`
- Gère l'authentification et les profils des mutuelles

#### Schémas tenant_<mutuelleId>
- Chaque mutuelle possède son propre schéma
- Contient toutes les données métier :
  - Assure
  - Dossier
  - Justificatif
  - Offre
  - Message
- Le service `getTenantDataSource(mutuelleId)` gère la connexion au schéma approprié

### 2. Entités et relations

```
Mutuelle (public)
└── Offre 1-n Offre.mutuelle (cascade delete)

Schéma tenant_<id>
├── Assure
│    └── Dossier 1-n Dossier.assure (onDelete CASCADE)
│         ├── Justificatif 1-n Justificatif.dossier (onDelete CASCADE)
│         └── Message 1-n Message.dossier (onDelete CASCADE)
└── Message.assure (onDelete CASCADE)
```

#### Détail des entités

**Mutuelle**
- `id`: Identifiant unique
- `nom`: Nom de la mutuelle
- `email`: Email (unique)
- `siret`: Numéro SIRET (unique)
- `motDePasse`: Mot de passe haché
- `telephone`: Numéro de téléphone
- `adresse`: Adresse postale
- `ville`: Ville
- `codePostal`: Code postal
- `pays`: Pays

**Assure**
- `id`: Identifiant unique
- `nom`: Nom de l'assuré
- `prenom`: Prénom de l'assuré
- `email`: Email (unique)
- `telephone`: Numéro de téléphone
- `dateNaissance`: Date de naissance
- `numeroSecuriteSociale`: NSS (chiffré)
- `numeroSecuriteSocialeHash`: Hash du NSS
- `iban`: IBAN (chiffré)
- `ibanHash`: Hash de l'IBAN
- `historiqueMedical`: Historique médical (chiffré)
- `historiqueMedicalHash`: Hash de l'historique médical

**Dossier**
- `id`: Identifiant unique
- `numeroDossier`: Numéro de dossier (unique)
- `description`: Description du dossier
- `montantTotal`: Montant total
- `montantRembourse`: Montant remboursé
- `statut`: Statut du dossier
- `typeSoin`: Type de soin
- `assureId`: Référence à l'assuré

**Justificatif**
- `id`: Identifiant unique
- `nomFichier`: Nom du fichier
- `mimeType`: Type MIME
- `taille`: Taille en octets
- `contenu`: Contenu en bytea
- `dossierId`: Référence au dossier

**Offre**
- `id`: Identifiant unique
- `nom`: Nom de l'offre
- `description`: Description
- `montant`: Montant
- `conditions`: Conditions
- `mutuelleId`: Référence à la mutuelle

**Message**
- `id`: Identifiant unique
- `contenu`: Contenu du message
- `assureId`: Référence à l'assuré
- `dossierId`: Référence au dossier

## Détail du chiffrement et de la recherche

### 1. Sécurité des mots de passe
- Utilisation de bcrypt avec saltRounds = 10
- Stockage sécurisé des hachages en base

### 2. Protection des données sensibles
Pour chaque champ sensible (NSS, IBAN, historique médical) :
- Stockage brut en clair pour restitution
- Hachage SHA-256 via `EncryptionService.createHash`
- Stockage des hachages dans des colonnes dédiées :
  - `numeroSecuriteSocialeHash`
  - `ibanHash`
  - `historiqueMedicalHash`

### 3. Recherche sécurisée
- Recherche insensible à la casse (ILIKE) sur :
  - Nom/prénom des assurés
  - Description des dossiers
- Recherche exacte sur NSS via comparaison du hash SHA-256
- Les valeurs brutes ne sont jamais utilisées dans les requêtes

## Guide des requêtes Postman

### Configuration
Définir les variables dans Postman :
```ini
base_url = http://localhost:3000
token    = <JWT_obtenu>
```

### 1. Mutuelle (public & auth)

| Méthode | Endpoint | Body / Notes |
|---------|----------|--------------|
| POST | `/mutuelles/verifier-email` | `{ "email":"..." }` |
| POST | `/mutuelles/inscription` | `{ nom, email, telephone, adresse, ville, codePostal, pays, siret, motDePasse }` |
| POST | `/mutuelles/connexion` | `{ "email":"...","motDePasse":"..." }` |
| GET | `/mutuelles/profile` | Auth Bearer {{token}} |
| PUT | `/mutuelles/profile` | Auth + `{ nom?, telephone?, adresse?, ... }` |

### 2. Assurés

| Méthode | Endpoint | Body / Query |
|---------|----------|--------------|
| POST | `/assures` | `{ nom, prenom, email, telephone, dateNaissance, numeroSecuriteSociale, iban, historiqueMedical }` |
| GET | `/assures` | Auth Bearer {{token}} |
| GET | `/assures/:id` | Auth |
| PUT | `/assures/:id` | Auth + `{ telephone?, historiqueMedical?, ... }` |
| DELETE | `/assures/:id` | Auth |
| GET | `/assures/search?query=…` | Auth |

### 3. Dossiers

| Méthode | Endpoint | Body / Query |
|---------|----------|--------------|
| POST | `/dossiers` | `{ numeroDossier, description, montantTotal, assureId, typeSoin }` |
| GET | `/dossiers` | Auth Bearer {{token}} |
| GET | `/dossiers/:id` | Auth |
| PUT | `/dossiers/:id` | Auth + `{ statut?, montantRembourse?, ... }` |
| DELETE | `/dossiers/:id` | Auth |
| GET | `/dossiers/search?query=…` | Auth |

### 4. Offres

| Méthode | Endpoint | Body |
|---------|----------|------|
| POST | `/offres` | `{ nom, description, montant, conditions }` |
| GET | `/offres` | Auth Bearer {{token}} |
| GET | `/offres/:id` | Auth |
| PUT | `/offres/:id` | Auth + `{ montant? }` |
| DELETE | `/offres/:id` | Auth |

### 5. Justificatifs

| Méthode | Endpoint | Body / Notes |
|---------|----------|--------------|
| POST | `/dossiers/:dossierId/justificatifs` | multipart/form-data file=_ |
| GET | `/dossiers/:dossierId/justificatifs` | Auth |
| GET | `/justificatifs/:id` | Auth |
| DELETE | `/justificatifs/:id` | Auth |

### 6. Messages

| Méthode | Endpoint | Body |
|---------|----------|------|
| POST | `/dossiers/:dossierId/messages` | `{ "contenu":"…" }` |
| GET | `/dossiers/:dossierId/messages` | Auth |
| GET | `/messages/:id` | Auth |
| PUT | `/messages/:id` | Auth + `{ "contenu":"…" }` |
| DELETE | `/messages/:id` | Auth |

## Sécurité
- Toutes les routes sont protégées par authentification
- Données sensibles chiffrées en base
- Recherche sécurisée via hachage
- Gestion des erreurs et validation des données
