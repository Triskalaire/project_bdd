const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://jean:kiki@localhost:5432/enfer_sur_terre',
});

client.connect()
  .then(() => {
    console.log('✅ Connexion réussie !');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('🕒 Heure actuelle :', res.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Erreur de connexion :', err.message);
  })
  .finally(() => client.end());
