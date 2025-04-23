const axios = require('axios');
const { expect } = require('chai');

const API_URL = 'http://localhost:3000';
let authToken = '';
let assureId = '';

describe('Tests des Assurés', () => {
    before(async () => {
        // Obtenir le token d'authentification
        const response = await axios.post(`${API_URL}/mutuelles/connexion`, {
            email: "test@mutuelle.com",
            motDePasse: "password123"
        });
        authToken = response.data.token;
    });

    it('devrait créer un nouvel assuré', async () => {
        const response = await axios.post(`${API_URL}/assures`, {
            nom: "Dupont",
            prenom: "Jean",
            numeroSecuriteSociale: "1234567890123",
            dateNaissance: "1990-01-01",
            adresse: "456 rue Assuré",
            email: "jean.dupont@email.com",
            telephone: "0987654321",
            iban: "FR7630006000011234567890189"
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(201);
        assureId = response.data.id;
    });

    it('devrait récupérer la liste des assurés', async () => {
        const response = await axios.get(`${API_URL}/assures`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(200);
        expect(response.data).to.be.an('array');
    });

    it('devrait récupérer un assuré spécifique', async () => {
        const response = await axios.get(`${API_URL}/assures/${assureId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status).to.equal(200);
        expect(response.data.nom).to.equal('Dupont');
    });
}); 