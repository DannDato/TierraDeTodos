import Banner from "../../elements/Banner";
import Button from "../../elements/Button";
import Timeline from "../../components/Timeline";
import News from "../../components/News";
import Streamers from "../../components/Streamers";
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Reglas from "../../components/Reglas";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const createInitialSocialLinks = () => ({
  website: "",
  youtube: "",
  discord: "",
  instagram: "",
  x: "",
  twitch: "",
});

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [socialLinks, setSocialLinks] = useState(createInitialSocialLinks());

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const { data } = await api.get("/system/public-settings?keys=links.social");
        const links = data?.config?.["links.social"];
        if (links && typeof links === "object") {
          setSocialLinks({ ...createInitialSocialLinks(), ...links });
        }
      } catch (_error) {
        setSocialLinks(createInitialSocialLinks());
      }
    };

    loadSocialLinks();
  }, []);

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    let attempts = 0;
    const maxAttempts = 60;

    const scrollWhenReady = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        navigate(location.pathname, { replace: true, state: null });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) requestAnimationFrame(scrollWhenReady);
    };

    scrollWhenReady();
  }, [location.pathname, location.state, navigate]);

  return (
    <>
      <Navbar></Navbar>
      <Banner>
        <center className="h-full flex items-center justify-center px-4">
          <div className="w-full max-w-3xl text-[var(--white-color)] flex flex-col items-center z-20">
            <img
              src="img/tdtLine.png"
              alt="Tierra de Todos Logo"
              className="w-full max-w-[550px] mb-5 -my-30"
              data-aos="fade-down"
              data-aos-duration="2000"
            />
            <p className="text-base md:text-lg font-light mb-8 leading-relaxed"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              Bienvenido a TDT, un servidor de Minecraft donde la comunidad,
              la aventura y la creatividad se unen en una nueva edición.
            </p>
            <Button variant="primary" size="lg" href={"/login"} data-aos="fade" data-aos-duration="3000">¡Juega ya!</Button>
          </div>
        </center>
      </Banner>
      {/* noticias */}
      <News></News>
      {/* Reglas */}
      <Reglas></Reglas>
      {/* Streamers */}
      <Streamers socialLinks={socialLinks}></Streamers>
      {/* Linea de tiempo */}
      <Timeline></Timeline>

      <Footer socialLinks={socialLinks}></Footer>
    </>
  );
}


export default Home;