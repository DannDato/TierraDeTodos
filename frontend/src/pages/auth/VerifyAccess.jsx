import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios"
import { useEffect, useRef, useState } from "react"

import Banner from "../../elements/Banner"
import Footer from "../../components/home/Footer"
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import {
  clearPendingVerifyAccessUser,
  getPendingVerifyAccessUser,
  getVerifyAccessResendAvailableAt,
  setVerifyAccessResendAvailableAt,
} from "../../utils/verifyAccessStorage";

import {
  ShieldCheck,
  ArrowLeft,

} from "lucide-react";


function VerifyAccess() {
  let navigate = useNavigate();
  const usuario = getPendingVerifyAccessUser();
  const inputRefs = useRef([]);

  //estados
  const token = localStorage.getItem("token");
  const [codigoDigits, setCodigoDigits] = useState(Array(6).fill(""));
  const [codigoError, setCodigoError] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const codigo = codigoDigits.join("");

  useEffect(() => {
    const syncCooldown = () => {
      const availableAt = getVerifyAccessResendAvailableAt();
      const remaining = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
      setResendCooldown(remaining);
    };

    syncCooldown();
    const intervalId = window.setInterval(syncCooldown, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (token) {return <Navigate to="/start" replace />;}
  if (!usuario) {return <Navigate to="/login" replace />;}

  const handleCode = async (event, forcedCode) => {
    event?.preventDefault();
    const codeToVerify = String(forcedCode ?? codigo).replace(/\D/g, "").slice(0, 6);

    if (loading) return;

    if (codeToVerify.length !== 6) {
      setCodigoError("Ingresa el código completo de 6 dígitos");
      return;
    }

    setCodigoError(false);
    setResendMessage("");
    setLoading(true);
    const { data } = await api.post("/auth/verify-code", {
      usuario,
      codigo: codeToVerify,
    }).catch((error) => {
      error.response ? setCodigoError(error.response.data.message) : setCodigoError("Error de conexión. Por favor, inténtalo de nuevo.");
      return { data: null };
    }).finally(() => {
      setLoading(false);
    });
    if(data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("role", data.user.role);
      clearPendingVerifyAccessUser();
      navigate("/start");
    }

  };

  const handleResendCode = async () => {
    if (!usuario || loading || resending || resendCooldown > 0) return;

    setCodigoError(false);
    setResendMessage("");
    setResending(true);

    await api.post("/auth/resend-verify-code", {
      usuario,
    }).then(({ data }) => {
      const nextAvailableAt = Date.now() + 60_000;
      setVerifyAccessResendAvailableAt(nextAvailableAt);
      setResendCooldown(60);
      setResendMessage(data?.message || "Código reenviado correctamente");
    }).catch((error) => {
      setCodigoError(error.response?.data?.message || "No se pudo reenviar el código. Inténtalo de nuevo.");
    }).finally(() => {
      setResending(false);
    });
  };

  const focusInput = (index) => {
    const nextInput = inputRefs.current[index];
    if (nextInput) nextInput.focus();
  };

  const handleDigitChange = (index, value) => {
    const normalizedValue = String(value || "").replace(/\D/g, "");
    if (!normalizedValue) {
      const nextCodeDigits = [...codigoDigits];
      nextCodeDigits[index] = "";
      setCodigoDigits(nextCodeDigits);
      setCodigoError(false);
      setResendMessage("");
      return;
    }

    const nextDigit = normalizedValue.slice(-1);
    const nextCodeDigits = [...codigoDigits];
    nextCodeDigits[index] = nextDigit;
    const nextCode = nextCodeDigits.join("");
    setCodigoDigits(nextCodeDigits);
    setCodigoError(false);
    setResendMessage("");

    if (index < 5) {
      focusInput(index + 1);
      return;
    }

    if (nextCode.length === 6) {
      handleCode(undefined, nextCode);
    }
  };

  const handleDigitKeyDown = (index, event) => {
    if (event.key === "Backspace" && !codigoDigits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;

    const nextCodeDigits = Array.from({ length: 6 }, (_, index) => pastedCode[index] || "");
    setCodigoDigits(nextCodeDigits);
    setCodigoError(false);
    setResendMessage("");

    if (pastedCode.length < 6) {
      focusInput(pastedCode.length);
      return;
    }

    focusInput(5);
    handleCode(undefined, pastedCode);
  };

  const resendLabel = resending
    ? "Reenviando..."
    : resendCooldown > 0
      ? `Reenviar disponible en ${String(Math.floor(resendCooldown / 60)).padStart(2, "0")}:${String(resendCooldown % 60).padStart(2, "0")}`
      : "¿No recibiste el código? Reenviar correo";

  return (
    <>
      <Banner>
        <LoadingOverlay isVisible={loading} />
        <div className="grid grid-cols-2 max-w-xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col p-8 bg-[var(--white-color)] rounded-3xl shadow-xl" data-aos="fade-left">
            {/* Encabezado */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 text-[var(--black-color)]">Código de verificación</h1>
              <div className="p-10">
                <div className="h-1 w-16 bg-[var(--secondary-color)] rounded-full mb-4" /> {/* Acento visual */}
                <h3 className="text-md mb-4 text-[var(--dirt-color)] font-bold flex items-center gap-2">
                  <ShieldCheck size={20} /> Hemos detectado un nuevo dispositivo
                </h3>
                <p className="font-light text-sm text-[var(--black-color)] leading-relaxed text-left">
                  Para proteger tu cuenta, enviamos un código a tu correo.
                  Por favor, ingresa los dígitos a continuación para verificar tu identidad.
                </p>
                <form className="flex flex-col gap-4 mt-10" onSubmit={handleCode}>
                  <div className="rounded-3xl border border-black/8 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.06))] p-6 shadow-inner">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--secondary-color)]">
                          Codigo de acceso
                        </p>
                        <p className="text-sm text-[var(--ins-text-dark)] mt-1">
                          Ingresa los 6 digitos del correo. Al completar el ultimo, se verifica automaticamente.
                        </p>
                      </div>
                      {/* <span className="rounded-full bg-[var(--secondary-color)]/10 px-3 py-1 text-[11px] font-black text-[var(--secondary-color)]">
                        6 digitos
                      </span> */}
                    </div>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleCodePaste}>
                      {codigoDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            inputRefs.current[index] = element;
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(index, e)}
                          className={`h-16 w-full rounded-2xl border text-center text-2xl font-black shadow-sm outline-none transition-all sm:h-20 sm:text-3xl ${codigoError ? "border-red-300 bg-red-50/80 text-red-700 focus:border-red-400 focus:ring-4 focus:ring-red-100" : "border-black/10 bg-white text-[var(--black-color)] focus:border-[var(--secondary-color)] focus:ring-4 focus:ring-[var(--secondary-color)]/10"}`}
                          aria-label={`Digito ${index + 1} del codigo`}
                        />
                      ))}
                    </div>

                    {codigoError ? (
                      <p className="mt-3 text-sm font-semibold text-red-600">{codigoError}</p>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--ins-text-dark)]/75">
                        Puedes escribirlo manualmente o pegar el codigo completo.
                      </p>
                    )}
                  </div>

                  {/* Links de Acción Secundaria */}
                  <div className="flex flex-col gap-3 mt-2">
                    <button
                      type="button"
                      className="text-xs text-[var(--secondary-color)] hover:underline font-semibold text-left w-fit disabled:opacity-50 disabled:no-underline"
                      onClick={handleResendCode}
                      disabled={resending || loading || !usuario || resendCooldown > 0}
                    >
                      {resendLabel}
                    </button>

                    {resendMessage ? (
                      <p className="text-xs font-semibold text-emerald-600">{resendMessage}</p>
                    ) : null}

                    <div className="flex justify-between items-center pt-4 mt-2">
                      <a href="/login" className="text-xs text-[var(--ins-text-dark)] hover:text-black flex items-center gap-1 transition-colors">
                        <ArrowLeft size={14} /> Volver al inicio de sesión
                      </a>
                      <a href="/help" className="text-xs text-[var(--ins-text-dark)] hover:text-black transition-colors">
                        ¿Necesitas ayuda?
                      </a>
                    </div>
                  </div>

                  {/* <Button variant="primary" className="mt-6 w-full py-4 text-lg" type="submit">
                    Verificar
                  </Button> */}
                </form>
              </div>
            </div>



            {/* Footer de navegación rápida */}
            <div className="mt-8 flex justify-center gap-6">
              <a href="/" className="text-[10px] uppercase tracking-widest text-[var(--ins-text-dark)] hover:text-[var(--secondary-color)] font-bold">Inicio</a>
              <a href="/register" className="text-[10px] uppercase tracking-widest text-[var(--ins-text-dark)] hover:text-[var(--secondary-color)] font-bold">Crear cuenta</a>
            </div>
          </div>

        </div>
      </Banner>
      <Footer></Footer>
    </>
  )
};

export default VerifyAccess