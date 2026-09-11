import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import Banner from "../../elements/Banner";
import Footer from "../../components/home/Footer";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import MinecraftBackground from "../../components/home/MinecraftBackground";
import { setPendingVerifyAccessUser, setVerifyAccessResendAvailableAt } from "../../utils/verifyAccessStorage";

function TwitchCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completando autenticación con Twitch...");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const exchange = async () => {
      const state = searchParams.get("state");
      if (!state) {
        setMessage("No se recibió un estado válido de Twitch.");
        setIsProcessing(false);
        return;
      }

      try {
        const { data } = await api.post("/auth/twitch/exchange", { state });
        if (data.type === "authenticated" && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.user.username);
          localStorage.setItem("role", data.user.role);
          navigate("/start", { replace: true });
          return;
        }

        if (data.type === "new_device") {
          setPendingVerifyAccessUser(data.usuario || data.email);
          setVerifyAccessResendAvailableAt(Date.now() + 60_000);
          navigate("/verifyAccess", { replace: true });
          return;
        }

        if (data.type === "registration_required") {
          sessionStorage.setItem("externalRegistrationToken", data.registrationToken);
          sessionStorage.setItem("externalRegistrationProvider", data.provider);
          sessionStorage.setItem("externalRegistrationEmail", data.email || "");
          navigate("/complete-registration", { replace: true });
          return;
        }

        if (data.type === "connected") {
          navigate("/profile", { replace: true });
          return;
        }

        setMessage(data.message || "No se pudo completar la autenticación con Twitch.");
        setIsProcessing(false);
      } catch (error) {
        setMessage(error.response?.data?.message || "No se pudo completar la autenticación con Twitch.");
        setIsProcessing(false);
      }
    };

    exchange();
  }, [navigate, searchParams]);

  return (
    <>
      <MinecraftBackground/>
      <LoadingOverlay isVisible={isProcessing} />
      <Banner className="h-[800px]">
        <div
          className="grid max-w-4xl mx-auto overflow-hidden rounded-3xl shadow-2xl"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
        >
          <div className="hidden flex-col items-center justify-center bg-[var(--black-color)] p-10 text-[var(--white-color)] md:flex" data-aos="fade-left">
            <a href="/" className="transition-transform duration-300 hover:scale-105">
              <img src="/img/tdtLine.png" alt="Tierra de Todos Logo" className="mb-6 w-48" />
            </a>
            <p className="mb-10 text-center text-sm font-light leading-relaxed opacity-90">
              Conecta tus cuentas externas de forma segura y continúa tu aventura en <span className="font-bold text-[var(--secondary-color)]">Tierra de Todos 3</span>.
            </p>
            <a href="/" className="text-sm font-semibold text-[var(--white-color)] transition-colors hover:text-[var(--secondary-color)]">
              Volver al inicio
            </a>
          </div>

          <div className="flex min-h-[360px] flex-col justify-center bg-[var(--white-color)] p-10" data-aos="fade-right">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--black-color)]">
                {isProcessing ? "Conectando Twitch" : "Autenticación de Twitch"}
              </h1>
              <div className="mt-2 h-1 w-12 rounded-full bg-[var(--secondary-color)]" />
            </div>

            <p className="text-sm leading-relaxed text-[var(--ins-text-dark)]">{message}</p>

            {!isProcessing && (
              <div className="mt-8 flex flex-col items-center gap-4 text-sm font-semibold sm:flex-row sm:justify-center">
                <a href="/login" className="text-[var(--black-color)] transition-colors hover:text-[var(--secondary-color)]">
                  Iniciar sesión
                </a>
                <a href="/register" className="text-[var(--black-color)] transition-colors hover:text-[var(--secondary-color)]">
                  Crear cuenta
                </a>
                {/* <a href="/" className="text-[var(--black-color)] transition-colors hover:text-[var(--secondary-color)]">
                  Volver al inicio
                </a> */}
              </div>
            )}
          </div>
        </div>
      </Banner>
      <Footer />
    </>
  );
}

export default TwitchCallback;
