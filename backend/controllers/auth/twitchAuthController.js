import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { models } from '../../models/index.js';
import { ctrlGoogleAuth } from './googleAuthController.js';
import { setStat, incrementStat } from '../../helpers/achievementEngine.js';

const TWITCH_PROVIDER = 'TWITCH';
const TWITCH_SCOPE = 'user:read:email';

class TwitchAuthController {
  getConfig = (req, res) => {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_REDIRECT_URI) {
      return res.status(503).json({ message: 'Autenticación con Twitch no configurada' });
    }
    return res.json({ enabled: true });
  };

  start = async (req, res) => {
    try {
      const mode = req.user ? 'connect' : 'login';
      if (mode === 'connect' && !req.user?.id) return res.status(401).json({ message: 'JWT no autorizado' });
      if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET || !process.env.TWITCH_REDIRECT_URI) {
        return res.status(503).json({ message: 'Autenticación con Twitch no configurada' });
      }

      const state = crypto.randomBytes(32).toString('hex');
      await models.OAuthStates.create({
        stateHash: crypto.createHash('sha256').update(state).digest('hex'),
        provider: TWITCH_PROVIDER,
        mode,
        userId: req.user?.id || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
        response_type: 'code',
        scope: TWITCH_SCOPE,
        state,
      });
      return res.json({ authorizationUrl: `https://id.twitch.tv/oauth2/authorize?${params.toString()}` });
    } catch (error) {
      await req.logAction({ accion: 'Error al iniciar OAuth Twitch', apartado: 'TwitchAuth', userId: req.user?.id, username: req.user?.username, valor: error.message, type: 'error' });
      return res.status(500).json({ message: 'No se pudo iniciar la autenticación con Twitch' });
    }
  };

  exchangeCode = async (code) => {
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.TWITCH_CLIENT_ID, client_secret: process.env.TWITCH_CLIENT_SECRET, code, grant_type: 'authorization_code', redirect_uri: process.env.TWITCH_REDIRECT_URI }),
    });
    if (!tokenResponse.ok) throw new Error('Twitch rechazó el código OAuth');
    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID },
    });
    if (!userResponse.ok) throw new Error('No se pudo obtener la identidad de Twitch');
    const userData = await userResponse.json();
    const twitchUser = userData.data?.[0];
    if (!twitchUser?.id || !twitchUser.email) throw new Error('Twitch no devolvió una identidad verificable');

    return {
      provider: TWITCH_PROVIDER,
      providerUserId: twitchUser.id,
      email: twitchUser.email.trim().toLowerCase(),
      displayName: twitchUser.display_name || twitchUser.login,
      avatarUrl: twitchUser.profile_image_url || null,
    };
  };

  callback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let stateRecord;
    try {
      const state = String(req.query.state || '');
      const stateHash = crypto.createHash('sha256').update(state).digest('hex');
      stateRecord = await models.OAuthStates.findOne({ where: { stateHash, provider: TWITCH_PROVIDER, used: false } });
      if (!stateRecord || stateRecord.expiresAt <= new Date()) throw new Error('El estado OAuth expiró o ya fue utilizado');
      if (req.query.error) throw new Error('El usuario canceló la autenticación de Twitch');

      const providerData = await this.exchangeCode(req.query.code);
      let result;
      if (stateRecord.mode === 'connect') {
        const existing = await models.user_connected_accounts.findOne({ where: { provider: TWITCH_PROVIDER, providerUserId: providerData.providerUserId } });
        if (existing && existing.userId !== stateRecord.userId) throw new Error('Esta cuenta de Twitch ya está vinculada a otro usuario');
        if (existing) throw new Error('Esta cuenta de Twitch ya está vinculada a tu usuario');
        await models.user_connected_accounts.create({ userId: stateRecord.userId, provider: TWITCH_PROVIDER, providerUserId: providerData.providerUserId, providerEmail: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl, lastUsedAt: new Date() });
        try {
          const connectedCount = await models.user_connected_accounts.count({ where: { userId: stateRecord.userId } });
          await setStat(stateRecord.userId, 'CONNECTED_ACCOUNTS', connectedCount, req);
        } catch (statError) {
          await req.logAction({ accion: 'No se pudo actualizar CONNECTED_ACCOUNTS', apartado: 'Achievements', userId: stateRecord.userId, valor: statError.message, type: 'error' });
        }
        result = { type: 'connected', provider: TWITCH_PROVIDER };
      } else {
        const account = await models.user_connected_accounts.findOne({ where: { provider: TWITCH_PROVIDER, providerUserId: providerData.providerUserId }, include: [{ model: models.Users, as: 'user' }] });
        if (!account) {
          const existingUser = await models.Users.findOne({ where: { email: providerData.email } });
          if (existingUser) throw new Error('Este correo ya tiene una cuenta en Tierra de Todos. Inicia sesión con tu método actual y vincula Twitch desde tu perfil.');
          const registrationToken = jwt.sign({ purpose: 'EXTERNAL_REGISTRATION', provider: TWITCH_PROVIDER, providerUserId: providerData.providerUserId, email: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl }, process.env.JWT_SECRET, { expiresIn: '15m' });
          result = { type: 'registration_required', provider: TWITCH_PROVIDER, email: providerData.email, registrationToken };
        } else {
          if (!account.user) throw new Error('La cuenta externa no tiene un usuario válido');
          await account.update({ providerEmail: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl, lastUsedAt: new Date() });
          await ctrlGoogleAuth.ensureUserInActiveEdition({ userId: account.user.id, source: 'TWITCH_LOGIN' });
          result = await this.buildLoginResult(account.user, providerData, req);
        }
      }

      await stateRecord.update({ result: JSON.stringify(result), used: true });
      return res.redirect(`${frontendUrl}/auth/twitch/callback?state=${encodeURIComponent(state)}`);
    } catch (error) {
      if (stateRecord) await stateRecord.update({ result: JSON.stringify({ type: 'error', message: error.message }), used: true });
      await req.logAction({ accion: 'Error en callback OAuth Twitch', apartado: 'TwitchAuth', valor: error.message, type: 'error' });
      return res.redirect(`${frontendUrl}/auth/twitch/callback?state=${encodeURIComponent(req.query.state || '')}`);
    }
  };

  buildLoginResult = async (user, providerData, req) => {
    const device = await ctrlGoogleAuth.checkDevice({ user, req });
    if (device.type !== 'authorized') return { ...device.response, registered: false };
    const token = await ctrlGoogleAuth.createTdtSession({ user, req });
    try {
      await incrementStat(user.id, 'LOGIN_COUNT', 1, req);
    } catch (statError) {
      await req.logAction({ accion: 'No se pudo actualizar LOGIN_COUNT', apartado: 'Achievements', userId: user.id, username: user.username, valor: statError.message, type: 'error' });
    }
    return { type: 'authenticated', provider: TWITCH_PROVIDER, token, user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName, email: user.email, picture: providerData.avatarUrl } };
  };

  exchangeResult = async (req, res) => {
    try {
      const state = String(req.body?.state || '');
      const stateHash = crypto.createHash('sha256').update(state).digest('hex');
      const record = await models.OAuthStates.findOne({ where: { stateHash, provider: TWITCH_PROVIDER, used: true } });
      if (!record || record.expiresAt <= new Date() || !record.result) return res.status(401).json({ message: 'El resultado OAuth expiró o ya fue utilizado' });
      const result = JSON.parse(record.result);
      await record.destroy();
      if (result.type === 'error') return res.status(409).json(result);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: 'No se pudo completar la autenticación con Twitch' });
    }
  };
}

const ctrlTwitchAuth = new TwitchAuthController();
export { ctrlTwitchAuth };
