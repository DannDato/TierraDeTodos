import crypto from 'crypto';

import { models } from '../../models/index.js';
import { setStat } from '../../helpers/achievementEngine.js';

const DISCORD_PROVIDER = 'DISCORD';
const DISCORD_SCOPE = 'identify email';

class DiscordAuthController {
  start = async (req, res) => {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'JWT no autorizado' });
      if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_REDIRECT_URI) {
        return res.status(503).json({ message: 'Autenticación con Discord no configurada' });
      }

      const state = crypto.randomBytes(32).toString('hex');
      await models.OAuthStates.create({
        stateHash: crypto.createHash('sha256').update(state).digest('hex'),
        provider: DISCORD_PROVIDER,
        mode: 'connect',
        userId: req.user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: DISCORD_SCOPE,
      });
      params.set('state', state);
      return res.json({ authorizationUrl: `https://discord.com/oauth2/authorize?${params.toString()}` });
    } catch (error) {
      await req.logAction({ accion: 'Error al iniciar OAuth Discord', apartado: 'DiscordAuth', userId: req.user?.id, username: req.user?.username, valor: error.message, type: 'error' });
      return res.status(500).json({ message: 'No se pudo iniciar la autenticación con Discord' });
    }
  };

  exchangeCode = async (code) => {
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      const detail = errorData.error_description || errorData.error || `HTTP ${tokenResponse.status}`;
      throw new Error(`Discord rechazó el código OAuth: ${detail}`);
    }
    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}` },
    });
    if (!userResponse.ok) throw new Error(`No se pudo obtener la identidad de Discord (HTTP ${userResponse.status})`);
    const discordUser = await userResponse.json();
    if (!discordUser?.id) throw new Error('Discord no devolvió una identidad válida');

    return {
      provider: DISCORD_PROVIDER,
      providerUserId: String(discordUser.id),
      email: discordUser.email ? String(discordUser.email).trim().toLowerCase() : null,
      displayName: discordUser.global_name || discordUser.username || null,
      avatarUrl: discordUser.avatar && discordUser.id
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
    };
  };

  callback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let stateRecord;
    try {
      const state = String(req.query.state || '');
      const stateHash = crypto.createHash('sha256').update(state).digest('hex');
      stateRecord = await models.OAuthStates.findOne({ where: { stateHash, provider: DISCORD_PROVIDER, used: false } });
      if (!stateRecord || stateRecord.expiresAt <= new Date()) throw new Error('El estado OAuth expiró o ya fue utilizado');
      if (req.query.error) throw new Error('El usuario canceló la autenticación de Discord');

      const providerData = await this.exchangeCode(req.query.code);
      const existing = await models.user_connected_accounts.findOne({ where: { provider: DISCORD_PROVIDER, providerUserId: providerData.providerUserId } });
      if (existing && existing.userId !== stateRecord.userId) throw new Error('Esta cuenta de Discord ya está vinculada a otro usuario');
      if (existing) throw new Error('Esta cuenta de Discord ya está vinculada a tu usuario');

      await models.user_connected_accounts.create({
        userId: stateRecord.userId,
        provider: DISCORD_PROVIDER,
        providerUserId: providerData.providerUserId,
        providerEmail: providerData.email,
        displayName: providerData.displayName,
        avatarUrl: providerData.avatarUrl,
        lastUsedAt: new Date(),
      });

      try {
        const connectedCount = await models.user_connected_accounts.count({ where: { userId: stateRecord.userId } });
        await setStat(stateRecord.userId, 'CONNECTED_ACCOUNTS', connectedCount, req);
      } catch (statError) {
        await req.logAction({ accion: 'No se pudo actualizar CONNECTED_ACCOUNTS', apartado: 'Achievements', userId: stateRecord.userId, valor: statError.message, type: 'error' });
      }

      await stateRecord.update({ result: JSON.stringify({ type: 'connected', provider: DISCORD_PROVIDER }), used: true });
      return res.redirect(`${frontendUrl}/auth/discord/callback?state=${encodeURIComponent(state)}`);
    } catch (error) {
      if (stateRecord) await stateRecord.update({ result: JSON.stringify({ type: 'error', message: error.message }), used: true });
      await req.logAction({ accion: 'Error en callback OAuth Discord', apartado: 'DiscordAuth', userId: stateRecord?.userId, valor: error.message, type: 'error' });
      return res.redirect(`${frontendUrl}/auth/discord/callback?state=${encodeURIComponent(req.query.state || '')}`);
    }
  };

  exchangeResult = async (req, res) => {
    try {
      const state = String(req.body?.state || '');
      const stateHash = crypto.createHash('sha256').update(state).digest('hex');
      const record = await models.OAuthStates.findOne({ where: { stateHash, provider: DISCORD_PROVIDER, used: true } });
      if (!record || record.expiresAt <= new Date() || !record.result) return res.status(401).json({ message: 'El resultado OAuth expiró o ya fue utilizado' });
      const result = JSON.parse(record.result);
      await record.destroy();
      if (result.type === 'error') return res.status(409).json(result);
      return res.json(result);
    } catch {
      return res.status(500).json({ message: 'No se pudo completar la autenticación con Discord' });
    }
  };
}

const ctrlDiscordAuth = new DiscordAuthController();
export { ctrlDiscordAuth };
