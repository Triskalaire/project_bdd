const jwt = require('jsonwebtoken');
const pool = require('./db'); // fichier pg Pool
require('dotenv').config();

module.exports = async function tenantMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { tenant_id } = decoded;
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id manquant dans le token' });
    }

    const { rows } = await pool.query(
      'SELECT schema_name FROM public.tenants WHERE id = $1',
      [tenant_id]
    );

    const tenant = rows[0];
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' });
    }

    // Change dynamiquement le search_path pour ce request
    await pool.query(`SET search_path TO ${tenant.schema_name}`);

    // Ajoute infos utiles à la requête
    req.user = decoded;
    req.tenantSchema = tenant.schema_name;

    next();
  } catch (err) {
    console.error('Erreur middleware tenant :', err);
    res.status(401).json({ error: 'Token invalide ou erreur interne' });
  }
};
