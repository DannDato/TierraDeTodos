import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { models, db } from '../../models/index.js';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { createAccessCode } from '../../helpers/createCodes.js';
import { CreateSession } from '../../helpers/CreateSession.js';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';
import { getActualEdition } from '../../utils/getEdition.js';

const GOOGLE_PROVIDER = 'GOOGLE';

class GoogleAuthController {
  buildUserFolio = (userId) => `TDT-${String(userId).padStart(8, '0')}`;

  verifyGoogleCredential = async (credential) => {
    if (!process.env.GOOGLE_CLIENT_ID || !credential) return null;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) return null;
    return { provider: GOOGLE_PROVIDER, providerUserId: payload.sub, email: payload.email.trim().toLowerCase(), displayName: payload.name || null, avatarUrl: payload.picture || null };
  };

  ensureUserInActiveEdition = async ({ userId, source, transaction }) => {
    const edition = await getActualEdition();
    if (!edition) return null;
    await models.UserEdition.findOrCreate({ where: { editionId: edition.id, userID: userId }, defaults: { source }, transaction });
    return edition;
  };

  createTdtSession = async ({ user, req }) => {
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await CreateSession({ token, userId: user.id, req });
    return token;
  };

  checkDevice = async ({ user, req }) => {
    const deviceHash = generateDeviceHash(req);
    const denied = await models.UserDevices.findOne({ where: { user: user.id, device_hash: deviceHash, authorized: 'DENIED' } });
    if (denied) return { type: 'denied', status: 403, response: { message: 'Tu dispositivo ha sido bloqueado. Contacta a un administrador.' } };
    const authorized = await models.UserDevices.findOne({ where: { user: user.id, device_hash: deviceHash, authorized: 'AUTHORIZED' } });
    if (authorized) {
      await authorized.update({ last_login: new Date(), ip_address: req.ip, user_agent: req.headers['user-agent'] });
      return { type: 'authorized' };
    }
    await models.UserDevices.destroy({ where: { user: user.id, device_hash: deviceHash, authorized: 'PENDING' } });
    await models.UserDevices.create({ user: user.id, device_hash: deviceHash, user_agent: req.headers['user-agent'], ip_address: req.ip, authorized: 'PENDING' });
    if (!await createAccessCode(user, deviceHash, req)) return { type: 'error', status: 500, response: { message: 'No se pudo generar el código de verificación' } };
    return { type: 'pending', status: 200, response: { type: 'new_device', provider: 'google', usuario: user.email, message: 'Nuevo dispositivo detectado. Se ha enviado un código de verificación a tu correo.' } };
  };

  finishLogin = async ({ user, req, res, providerData, created = false }) => {
    const device = await this.checkDevice({ user, req });
    if (device.type !== 'authorized') {
      await req.logAction({ accion: 'Login Google requiere verificación de dispositivo', apartado: 'GoogleAuth', userId: user.id, username: user.username, type: 'info' });
      return res.status(device.status).json({ ...device.response, registered: created });
    }
    const token = await this.createTdtSession({ user, req });
    await models.Attempts.create({ user: user.id, action_type: 'GOOGLE_LOGIN', status: 'SUCCESS', ip_address: req.ip, user_agent: req.headers['user-agent'] });
    await req.logAction({ accion: created ? 'Registro y login Google exitoso' : 'Login Google exitoso', apartado: 'GoogleAuth', userId: user.id, username: user.username, valor: req.ip, type: 'info' });
    return res.status(created ? 201 : 200).json({ type: 'authenticated', provider: 'google', registered: created, token, user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName, email: user.email, picture: providerData?.avatarUrl || null } });
  };

  getGoogleConfig = async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      await req.logAction({ accion: 'Google Auth solicitado sin GOOGLE_CLIENT_ID configurado', apartado: 'GoogleAuth', type: 'error' });
      return res.status(503).json({ message: 'Autenticación con Google no configurada' });
    }
    return res.json({ enabled: true, clientId: process.env.GOOGLE_CLIENT_ID });
  };

  authenticate = async (req, res) => {
    try {
      const providerData = await this.verifyGoogleCredential(req.body?.credential);
      if (!providerData) return res.status(401).json({ message: 'Credencial de Google inválida o correo no verificado' });
      const account = await models.user_connected_accounts.findOne({ where: { provider: GOOGLE_PROVIDER, providerUserId: providerData.providerUserId }, include: [{ model: models.Users, as: 'user' }] });
      if (!account) {
        const existingUser = await models.Users.findOne({ where: { email: providerData.email } });
        if (existingUser) {
          await req.logAction({ accion: 'Google rechazado: email existente sin proveedor vinculado', apartado: 'GoogleAuth', userId: existingUser.id, username: existingUser.username, type: 'warn' });
          return res.status(409).json({ type: 'external_account_unlinked', message: 'Este correo ya tiene una cuenta en Tierra de Todos. Inicia sesión con tu método actual y vincula Google desde tu perfil.' });
        }
        const registrationToken = jwt.sign({ purpose: 'EXTERNAL_REGISTRATION', provider: GOOGLE_PROVIDER, providerUserId: providerData.providerUserId, email: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl }, process.env.JWT_SECRET, { expiresIn: '15m' });
        await req.logAction({ accion: 'Google requiere completar registro', apartado: 'GoogleAuth', valor: providerData.email, type: 'info' });
        return res.json({ type: 'registration_required', provider: 'google', email: providerData.email, registrationToken });
      }
      if (!account.user) return res.status(409).json({ message: 'La cuenta externa no tiene un usuario válido' });
      await account.update({ providerEmail: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl, lastUsedAt: new Date() });
      await this.ensureUserInActiveEdition({ userId: account.user.id, source: 'GOOGLE_LOGIN' });
      return this.finishLogin({ user: account.user, req, res, providerData });
    } catch (error) {
      await req.logAction({ accion: 'Error interno durante autenticación Google', apartado: 'GoogleAuth', valor: error.message, type: 'error' });
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  completeRegistration = async (req, res) => {
    let transaction;
    try {
      const { username, registrationToken } = req.body || {};
      if (!username || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) return res.status(400).json({ message: 'El nombre de usuario debe tener entre 3 y 30 caracteres válidos' });
      const registration = jwt.verify(registrationToken, process.env.JWT_SECRET);
      if (registration.purpose !== 'EXTERNAL_REGISTRATION' || !registration.provider || !registration.providerUserId) throw new Error('Token de registro externo inválido');
      if (await models.Users.findOne({ where: { username } })) return res.status(409).json({ message: 'El nombre de usuario ya existe' });
      if (await models.Users.findOne({ where: { email: registration.email } })) return res.status(409).json({ message: 'Este correo ya tiene una cuenta. Inicia sesión con tu método actual y vincula Google desde tu perfil.' });
      const edition = await getActualEdition();
      if (!edition) return res.status(409).json({ message: 'No hay inscripciones activas en este momento' });
      transaction = await db.transaction();
      const user = await models.Users.create({ email: registration.email, username, password: null, displayName: registration.displayName || username, role: 'USER' }, { transaction });
      await user.update({ folio: this.buildUserFolio(user.id) }, { transaction });
      await applyRolePresetPermissions({ userId: user.id, role: user.role, transaction });
      await models.UserEdition.findOrCreate({ where: { editionId: edition.id, userID: user.id }, defaults: { source: 'GOOGLE_REGISTER' }, transaction });
      await models.user_connected_accounts.create({ userId: user.id, provider: GOOGLE_PROVIDER, providerUserId: registration.providerUserId, providerEmail: registration.email, displayName: registration.displayName, avatarUrl: registration.avatarUrl, lastUsedAt: new Date() }, { transaction });
      await transaction.commit();
      transaction = null;
      return this.finishLogin({ user, req, res, providerData: registration, created: true });
    } catch (error) {
      if (transaction) await transaction.rollback();
      await req.logAction({ accion: 'Error al completar registro Google', apartado: 'GoogleAuth', valor: error.message, type: 'error' });
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'El registro externo expiró. Vuelve a iniciar sesión con Google.' });
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  listConnectedAccounts = async (req, res) => {
    const accounts = await models.user_connected_accounts.findAll({ where: { userId: req.user.id }, attributes: ['id', 'provider', 'providerEmail', 'displayName', 'avatarUrl', 'lastUsedAt'] });
    return res.json({ accounts, hasPassword: Boolean(req.user.password) });
  };

  connectGoogleAccount = async (req, res) => {
    try {
      const providerData = await this.verifyGoogleCredential(req.body?.credential);
      if (!providerData) return res.status(401).json({ message: 'Credencial de Google inválida o correo no verificado' });
      const existing = await models.user_connected_accounts.findOne({ where: { provider: GOOGLE_PROVIDER, providerUserId: providerData.providerUserId } });
      if (existing && existing.userId !== req.user.id) return res.status(409).json({ message: 'Esta cuenta de Google ya está vinculada a otro usuario' });
      if (existing) return res.status(409).json({ message: 'Esta cuenta de Google ya está vinculada a tu usuario' });
      await models.user_connected_accounts.create({ userId: req.user.id, provider: GOOGLE_PROVIDER, providerUserId: providerData.providerUserId, providerEmail: providerData.email, displayName: providerData.displayName, avatarUrl: providerData.avatarUrl, lastUsedAt: new Date() });
      await req.logAction({ accion: 'Proveedor externo vinculado', apartado: 'GoogleAuth', userId: req.user.id, username: req.user.username, valor: `provider=${GOOGLE_PROVIDER}`, type: 'info' });
      return res.status(201).json({ message: 'Google vinculado correctamente' });
    } catch (error) {
      await req.logAction({ accion: 'Error al vincular proveedor externo', apartado: 'GoogleAuth', userId: req.user?.id, username: req.user?.username, valor: error.message, type: 'error' });
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  removeConnectedAccount = async (req, res) => {
    const account = await models.user_connected_accounts.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Cuenta externa no encontrada' });
    if (!req.user.password && await models.user_connected_accounts.count({ where: { userId: req.user.id } }) <= 1) return res.status(409).json({ message: 'No puedes eliminar tu último método de autenticación' });
    await account.destroy();
    await req.logAction({ accion: 'Proveedor externo desvinculado', apartado: 'GoogleAuth', userId: req.user.id, username: req.user.username, valor: `provider=${account.provider}`, type: 'info' });
    return res.json({ message: 'Proveedor desvinculado correctamente' });
  };
}

const ctrlGoogleAuth = new GoogleAuthController();
export { ctrlGoogleAuth };
