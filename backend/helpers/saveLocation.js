import { models } from '../models/index.js';
import handleError from '../handlers/handleError.js';

async function saveLocation(userId, ip) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    if(!userId) return null;
    if(!ip) return null;
    try {
        const response = await fetch(`https://api.ipapi.is/?q=${ip}`, {
            signal: controller.signal
        });

        if (!response.ok) {throw new Error(`ipApi respondió ${response.status}`);}

        const geo = await response.json();

        await models.UserLocations.create({
            userId,
            ip,
            is_bogon: geo.is_bogon || false,
            company: geo.company || '',
            asn: geo.asn || '',
            city: geo.city || '',
            country: geo.country || '',
            lat: geo.lat || null,
            lon: geo.lon || null,
            timezone: geo.timezone || ''
        });
        return geo ? geo : null;
    } catch (error) {
        handleError(null, null, error, `Error al obtener ubicación ip: ${ip}`);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export default saveLocation;