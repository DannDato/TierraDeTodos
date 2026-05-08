import { useEffect, useMemo, useState } from 'react';
import { Save, Settings2 } from 'lucide-react';

import api from '../../../api/axios';
import Input from '../../../elements/Input';
import Button from '../../../elements/Button';
import LoadingOverlay from '../../shared/LoadingOverlay';
import AlertModal from '../../../elements/AlertModal';

const createInitialLinks = () => ({
  website: '',
  youtube: '',
  discord: '',
  instagram: '',
  x: '',
  twitch: '',
});

function SystemPreferencesView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState(createInitialLinks());
  const [authFlags, setAuthFlags] = useState({ loginEnabled: true, registerEnabled: true });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'info',
    title: 'Aviso',
    message: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const openAlert = (type, title, message) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const linkFields = useMemo(() => ([
    { key: 'website', label: 'Website', placeholder: 'https://tierradetodos.com' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@tierradetodos' },
    { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/tdt3' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'x', label: 'X.com', placeholder: 'https://x.com/...' },
    { key: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/...' },
  ]), []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linksRes, settingsRes] = await Promise.allSettled([
        api.get('/admin/system-settings/links'),
        api.get('/admin/system-settings'),
      ]);

      if (linksRes.status === 'fulfilled') {
        const serverLinks = linksRes.value?.data?.links;
        setLinks({ ...createInitialLinks(), ...(serverLinks || {}) });
      }

      if (settingsRes.status === 'fulfilled') {
        const settings = Array.isArray(settingsRes.value?.data?.settings) ? settingsRes.value.data.settings : [];
        const authSetting = settings.find((item) => String(item?.key || '') === 'features.auth');
        if (authSetting?.value && typeof authSetting.value === 'object') {
          setAuthFlags({
            loginEnabled: authSetting.value.loginEnabled !== false,
            registerEnabled: authSetting.value.registerEnabled !== false,
          });
        }
      }
    } catch (_error) {
      openAlert('error', 'No se pudo cargar', 'Error al cargar preferencias del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const patchLink = (key, value) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  const saveLinks = async () => {
    try {
      setSaving(true);
      await api.put('/admin/system-settings/links', { links });
      openAlert('success', 'Links guardados', 'Los links del sistema se actualizaron correctamente.');
    } catch (error) {
      openAlert('error', 'No se pudo guardar', error.response?.data?.message || 'No fue posible guardar links.');
    } finally {
      setSaving(false);
    }
  };

  const saveAuthFlags = async () => {
    try {
      setSaving(true);
      await api.put('/admin/system-settings/features.auth', {
        name: 'Control de autenticacion',
        description: 'Permite habilitar o deshabilitar login y registro.',
        category: 'features',
        valueType: 'json',
        visibility: 'private',
        editable: true,
        active: true,
        value: {
          loginEnabled: authFlags.loginEnabled,
          registerEnabled: authFlags.registerEnabled,
        },
      });
      openAlert('success', 'Configuracion guardada', 'Preferencias de autenticacion actualizadas.');
    } catch (error) {
      openAlert('error', 'No se pudo guardar', error.response?.data?.message || 'No fue posible guardar configuracion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='flex flex-col h-full animate-[fadeIn_0.2s_ease-out]'>
      <LoadingOverlay isVisible={loading || saving} message='Guardando configuracion...' />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />

      <div className='flex items-end justify-between gap-4 mb-8'>
        <div>
          <h2 className='text-2xl font-extrabold text-[var(--ins-text-white)]'>Preferencias del Sistema</h2>
          <p className='text-sm text-[var(--ins-text-gray)] mt-1'>
            Configura links globales y banderas principales para comportamiento del sistema.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className='rounded-3xl bg-[var(--black-color)]/20 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-extrabold text-[var(--ins-text-white)]'>Links Globales</h3>
            <Settings2 size={18} className='text-[var(--ins-text-gray)]' />
          </div>

          <div className='grid grid-cols-1 gap-3'>
            {linkFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={links[field.key] || ''}
                onChange={(e) => patchLink(field.key, e.target.value)}
              />
            ))}
          </div>

          <div className='mt-5 flex justify-end'>
            <Button
              type='button'
              variant='primary'
              className='bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white gap-2'
              onClick={saveLinks}
            >
              <Save size={16} /> Guardar links
            </Button>
          </div>
        </div>

        <div className='rounded-3xl bg-[var(--black-color)]/20 p-6 shadow-sm'>
          <h3 className='text-lg font-extrabold text-[var(--ins-text-white)] mb-2'>Control de Autenticacion</h3>
          <p className='text-sm text-[var(--ins-text-gray)] mb-5'>
            Esta base permite crecer luego con más controles globales sin rediseñar este módulo.
          </p>

          <div className='space-y-4'>
            <label className='flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 hover:bg-white/[0.08] transition-colors'>
              <span className='text-sm font-semibold text-[var(--ins-text-white)]'>Login habilitado</span>
              <input
                type='checkbox'
                checked={authFlags.loginEnabled}
                onChange={(e) => setAuthFlags((prev) => ({ ...prev, loginEnabled: e.target.checked }))}
                className='h-4 w-4 accent-[var(--secondary-color)]'
              />
            </label>

            <label className='flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 hover:bg-white/[0.08] transition-colors'>
              <span className='text-sm font-semibold text-[var(--ins-text-white)]'>Registro habilitado</span>
              <input
                type='checkbox'
                checked={authFlags.registerEnabled}
                onChange={(e) => setAuthFlags((prev) => ({ ...prev, registerEnabled: e.target.checked }))}
                className='h-4 w-4 accent-[var(--secondary-color)]'
              />
            </label>
          </div>

          <div className='mt-5 flex justify-end'>
            <Button
              type='button'
              variant='primary'
              className='bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white gap-2'
              onClick={saveAuthFlags}
            >
              <Save size={16} /> Guardar autenticacion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemPreferencesView;
