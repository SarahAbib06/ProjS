import axios from 'axios';

export const getLocationFromIP = async (ip) => {
  try {
    // Pour les IP locales, utiliser un service de géolocalisation
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      // Utiliser une IP publique ou un service de géolocalisation par défaut
      const response = await axios.get('http://ip-api.com/json/');
      return {
        ip: response.data.query,
        city: response.data.city || 'Inconnu',
        country: response.data.country || 'Inconnu',
        isp: response.data.isp || 'Inconnu'
      };
    }

    // Pour les IP publiques
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    return {
      ip: ip,
      city: response.data.city || 'Inconnu',
      country: response.data.country || 'Inconnu',
      isp: response.data.isp || 'Inconnu'
    };
  } catch (error) {
    console.error('Erreur géolocalisation:', error);
    return {
      ip: ip,
      city: 'Inconnu',
      country: 'Inconnu',
      isp: 'Inconnu'
    };
  }
};