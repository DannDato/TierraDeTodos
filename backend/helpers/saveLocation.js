import { models } from '../models/index.js';

async function saveLocation(userId, ip) {
    const response = await fetch(`https://api.ipapi.is/?q=${ip}`);
    const geo = await response.json();
    
    //registrar en modelo userLocation
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

    return geo;
}

export default saveLocation;