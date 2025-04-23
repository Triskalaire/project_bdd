const axios = require('axios');
const { expect } = require('chai');

const API_URL = 'http://localhost:3000';
let authToken = '';

describe('Tests d\'Authentification', () => {
    it('devrait créer une nouvelle mutuelle', async () => {
        const response = await axios.post(`${API_URL}/mutuelles/inscription`, {
            nom: "Mutuelle Test",
            email: "test@mutuelle.com",
            motDePasse: "password123",
            telephone: "0123456789",
            adresse: "123 rue Test",
            ville: "Paris",
            codePostal: "75000",
            pays: "France",
            siret: "12345678901234"
        });
        expect(response.status).to.equal(201);
    });

    it('devrait se connecter et obtenir un token', async () => {
        const response = await axios.post(`${API_URL}/mutuelles/connexion`, {
            email: "test@mutuelle.com",
            motDePasse: "password123"
        });
        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('token');
        authToken = response.data.token;
    });

    it('devrait refuser l\'accès sans token', async () => {
        try {
            await axios.get(`${API_URL}/dossiers`);
        } catch (error) {
            expect(error.response.status).to.equal(401);
        }
    });
}); 