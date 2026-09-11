import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../api/axios";
import Banner from "../../elements/Banner";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import Footer from "../../components/home/Footer";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import MinecraftBackground from "../../components/home/MinecraftBackground";
import { setPendingVerifyAccessUser, setVerifyAccessResendAvailableAt } from "../../utils/verifyAccessStorage";

function CompleteGoogleRegistration() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const registrationToken = sessionStorage.getItem("externalRegistrationToken");
  const email = sessionStorage.getItem("externalRegistrationEmail");

  if (localStorage.getItem("token")) return <Navigate to="/start" replace />;
  if (!registrationToken) return <Navigate to="/login" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/external/complete-registration", { username, registrationToken });
      sessionStorage.removeItem("externalRegistrationToken");
      sessionStorage.removeItem("externalRegistrationProvider");
      sessionStorage.removeItem("externalRegistrationEmail");
      if (data.type === "new_device") {
        setPendingVerifyAccessUser(data.usuario || email);
        setVerifyAccessResendAvailableAt(Date.now() + 60_000);
        return navigate("/verifyAccess");
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("role", data.user.role);
        return navigate("/start");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MinecraftBackground />
      <LoadingOverlay isVisible={loading} />
      <Banner className="h-[800px]">
        <div className="max-w-lg mx-auto rounded-3xl bg-[var(--white-color)] p-10 shadow-2xl">
          <h1 className="text-3xl font-bold text-[var(--black-color)]">Completa tu registro</h1>
          <p className="mt-3 mb-8 text-sm text-[var(--ins-text-dark)]">Elige el username que usarás en Tierra de Todos{email ? `: ${email}` : ""}.</p>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <Input label="Username" context="light" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ej: detonador700xD" error={error} required minLength={3} maxLength={30} />
            <Button variant="primary" className="w-full py-4" type="submit">Continuar</Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Cancelar</Button>
          </form>
        </div>
      </Banner>
      <Footer />
    </>
  );
}

export default CompleteGoogleRegistration;