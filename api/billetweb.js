 // proxy BilletWeb
 /**
 * Proxy serverless pour l'API BilletWeb.
 * La clé API reste côté serveur (variables d'environnement Vercel).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  
    const userId = process.env.BILLETWEB_USER_ID;
    const apiKey = process.env.BILLETWEB_API_KEY;
    const baseUrl = process.env.BILLETWEB_BASE_URL || 'https://www.billetweb.fr/api';
    const version = process.env.BILLETWEB_VERSION || '1';
    const eventId = process.env.BILLETWEB_EVENT_ID || '';
  
    if (!userId || !apiKey) {
      return res.status(500).json({ error: 'Configuration BilletWeb manquante' });
    }
  
    const params = new URLSearchParams({
      user: userId,
      key: apiKey,
      version: version,
      past: '1',
      online: '1',
      description: '1'
    });
    if (eventId) params.set('event', eventId);
  
    const url = `${baseUrl}/events?${params.toString()}`;
  
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
  
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(502).json({ error: 'Impossible de charger les ateliers' });
    }
  }