const axios = require('axios');
const { expect } = require('chai');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:3000';
let authToken = '';
let justificatifId = '';

describe('Tests des Justificatifs', () => {
    before(async () => {
        // Obtenir le token d'authentification
        const response = await axios.post(`${API_URL}/mutuelles/connexion`, {
            email: "test@mutuelle.com",
            motDePasse: "password123"
        });
        authToken = response.data.token;
    });

    it('devrait uploader un justificatif', async () => {
        const formData = new FormData();
        formData.append('file', fs.createReadStream('test.pdf'));

        const response = await axios.post(
            `${API_URL}/api/dossiers/<id_dossier>/justificatifs`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${authToken}`
                }
            }
        );
        expect(response.status).to.equal(201);
        justificatifId = response.data.id;
    });

    it('devrait télécharger un justificatif', async () => {
        const response = await axios.get(
            `${API_URL}/api/justificatifs/${justificatifId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
                responseType: 'arraybuffer'
            }
        );
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/pdf');
    });

    it('devrait supprimer un justificatif', async () => {
        const response = await axios.delete(
            `${API_URL}/api/justificatifs/${justificatifId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        expect(response.status).to.equal(204);
    });
}); 