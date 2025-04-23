const axios = require('axios');
const { expect } = require('chai');

const API_URL = 'http://localhost:3000';
let authToken = '';
let dossierId = '';

describe('Tests des Dossiers', () => {
    before(async () => {
        // Obtenir le token d'authentification
        const response = await axios.post(`${API_URL}/mutuelles/connexion`, {
            email: "test@mutuelle.com",
            motDePasse: "password123"
        });
        authToken = response.data.token;
    });

    it('devrait créer un nouveau dossier', async () => {
        const response = await axios.post(`${API_URL}/dossiers`, {
            numeroDossier: "DOS-2023-001",
            description: "Remboursement optique",
            montantTotal: 150.00,
            assureId: "<id_assure>" // À remplacer par un ID d'assuré valide
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(201);
        dossierId = response.data.id;
    });

    it('devrait mettre à jour le statut d\'un dossier', async () => {
        const response = await axios.put(`${API_URL}/dossiers/${dossierId}`, {
            statut: "EN_COURS"
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(200);
        expect(response.data.statut).to.equal('EN_COURS');
    });

    it('devrait récupérer la liste des dossiers', async () => {
        const response = await axios.get(`${API_URL}/dossiers`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(200);
        expect(response.data).to.be.an('array');
    });
}); 