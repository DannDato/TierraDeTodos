import { ArrowLeft, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import Banner from "../../elements/Banner";
import Footer from "../../components/home/Footer";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import api from "../../api/axios";

export default function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null: loading, false: inválido, true: válido
  const [checking, setChecking] = useState(true);
  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    api.post("/auth/reset-password", { token, check: true })
      .then(() => {
        setTokenValid(true);
      })
      .catch(() => {
        setTokenValid(false);
      })
      .finally(() => setChecking(false));
  }, [token]);

  // Enviar correo de recuperación
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setEmailSent(false);
    if (!email) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/request-password-recovery", { email });
      setSuccess("Correo enviado. Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
      setEmailSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!password || !repeat) {
      setError("Completa ambos campos.");
      return;
    }
    if (password !== repeat) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess("Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Banner className="h-[800px]">
        <LoadingOverlay isVisible={loading || checking} message={checking ? "Validando enlace..." : ""} />
        <div className="grid grid-cols-2 max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-3xl"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {/* LADO IZQUIERDO: FORMULARIO */}
          <div className="col p-10 bg-[var(--white-color)] flex flex-col justify-center" data-aos="fade-left">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--black-color)]">Restablecer contraseña</h1>
              <div className="h-1 w-12 bg-[var(--secondary-color)] rounded-full mt-2" />
            </div>
            {/* Si NO hay token, pedir correo */}
            {!token ? (
              <form className="flex flex-col gap-4" onSubmit={handleSendEmail}>
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  context="light"
                  placeholder="tucorreo@mail.com"
                  autoFocus
                />
                {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
                {success && <div className="text-gray-500 mt-2 text-sm"><Check className="inline-block mr-2" /> {success}</div>}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="mt-6 w-full"
                  disabled={loading || emailSent}
                >
                  {loading ? "Enviando..." : emailSent ? "Correo enviado" : "Restablecer"}
                </Button>
              </form>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {checking && <div className="text-[var(--ins-text-gray)] mb-4">Validando enlace...</div>}
                {!checking && tokenValid === false && (
                  <div className="text-red-400 mb-4">El enlace de recuperación no es válido o ha expirado.</div>
                )}
                {!checking && tokenValid && !success && (
                  <>
                    <Input
                      label="Nueva contraseña"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      context="light"
                    />
                    <Input
                      label="Repetir nueva contraseña"
                      type="password"
                      value={repeat}
                      onChange={e => setRepeat(e.target.value)}
                      context="light"
                    />
                    {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="mt-6 w-full"
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Restablecer contraseña"}
                    </Button>
                  </>
                )}
                {success && <div className="mt-4 text-sm">{success}</div>}
              </form>
            )}
          </div>
          {/* LADO DERECHO: INFO */}
          <div className="col bg-[var(--black-color)] flex-col items-center justify-center p-10 text-[var(--white-color)] hidden md:flex" data-aos="fade-right">
            <a href="/" className="hover:scale-105 transition-transform duration-300">
              <img src="/img/tdtLine.png" alt="Tierra de Todos Logo" className="mb-6 w-48" />
            </a>
            <p className="text-sm font-light mb-10 text-center leading-relaxed opacity-90">
              Necesitamos tu correo electrónico para enviarte un enlace seguro que te permitirá restablecer tu contraseña. Si el correo está registrado, recibirás un mensaje con las instrucciones para crear una nueva contraseña y recuperar el acceso a tu cuenta.
            </p>
            <div className="grid w-full gap-3 grid-cols-1 md:grid-cols-2">
              <Button variant="ghost" href="/" className="flex items-center justify-center gap-2 border-none hover:bg-white/10">
                <ArrowLeft size={16} /> Volver al inicio
              </Button>
              <Button variant="ghost" href="/login">
                Iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </Banner>
         <Footer />
    </>
  );
}
