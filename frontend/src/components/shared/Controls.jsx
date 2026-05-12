import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import api from "../../api/axios";
import AlertModal from "../../elements/AlertModal";
import Background from "../../elements/Background";
import UserDefault from "../../img/user_default.png";

const PROFILE_IMAGE_CACHE_KEY = "tdt_profile_image";

const fallbackMenuItems = [
  { id: 0, name: "Inicio", icon: "Home", path: "/start", target: "_self", shortAccess: true, menuGroup: "user" },
  { id: 3, name: "Cuenta", icon: "User", path: "/profile", target: "_self", shortAccess: true, menuGroup: "user" },
];

function Controls({ children, maxWidthClass = "max-w-[1800px]" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileQuickControls, setShowMobileQuickControls] = useState(true);
  const [menuItems, setMenuItems] = useState(fallbackMenuItems);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(PROFILE_IMAGE_CACHE_KEY) || UserDefault);

  const unreadNotifications = 4;
  const notificationsRef = useRef(null);

  const userMenuItems = menuItems.filter((item) => String(item.menuGroup || "user") === "user");
  const adminMenuItems = menuItems.filter((item) => String(item.menuGroup || "user") === "admin");
  const desktopMenuItems = menuItems.filter((item) => item.shortAccess);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const { data } = await api.get("/system/menu");
        if (Array.isArray(data?.menuItems) && data.menuItems.length > 0) {
          setMenuItems(data.menuItems);
        } else {
          setMenuItems(fallbackMenuItems);
        }
      } catch (error) {
        console.error("Menu load error:", error);
        setMenuItems(fallbackMenuItems);
      }
    };

    loadMenu();
  }, []);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const { data } = await api.get("/user/profile");
        const user = data?.user || data || {};
        const resolvedProfileImage = user?.avatarUrl || user?.mc_skin_head || user?.profileImage || UserDefault;

        if (!resolvedProfileImage || resolvedProfileImage === profileImage) {
          return;
        }

        const preloadImage = new window.Image();
        preloadImage.onload = () => {
          setProfileImage(resolvedProfileImage);
          localStorage.setItem(PROFILE_IMAGE_CACHE_KEY, resolvedProfileImage);
        };
        preloadImage.onerror = () => {
          setProfileImage(UserDefault);
          localStorage.setItem(PROFILE_IMAGE_CACHE_KEY, UserDefault);
        };
        preloadImage.src = resolvedProfileImage;
      } catch (_error) {
        setProfileImage(UserDefault);
        localStorage.setItem(PROFILE_IMAGE_CACHE_KEY, UserDefault);
      }
    };

    loadProfileImage();
  }, [profileImage]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!notificationsRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const scrollContentToTop = (behavior = "smooth") => {
    const scrollContainer = document.getElementById("inicio");

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  };

  useEffect(() => {
    scrollContentToTop("auto");
    setShowMobileQuickControls(true);
  }, [location.pathname]);

  function handleHeadBarClick() {
    scrollContentToTop();
  }

  const handleNavigate = (path, target) => {
    if (target === "_blank") {
      window.open(path, "_blank", "noopener,noreferrer");
      setIsOpen(false);
      return;
    }

    if (location.pathname === path) {
      scrollContentToTop();
      navigate(0);
      setIsOpen(false);
      return;
    }

    scrollContentToTop();
    navigate(path);
    setIsOpen(false);
    setShowNotifications(false);
    setShowMobileQuickControls(true);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const handleContentScroll = (event) => {
    const scrollTop = event.currentTarget?.scrollTop || 0;
    const shouldShow = scrollTop < 24;

    if (!shouldShow && showNotifications) {
      setShowNotifications(false);
    }

    setShowMobileQuickControls((prev) => (prev === shouldShow ? prev : shouldShow));
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--ins-background)]">
      <AlertModal
        isOpen={showAlert}
        type="warning"
        title="Un momento..."
        message="Estas a punto de cerrar sesión."
        onClose={() => setShowAlert(false)}
        onConfirm={handleLogout}
      />

      <header className="absolute md:fixed top-0 z-50 w-full bg-black/01 md:bg-black/50 md:backdrop-blur-md text-[var(--white-color)]" onClick={handleHeadBarClick}>
        <div className={`mx-auto flex h-[76px] w-full items-center justify-between px-4 sm:px-2 ${maxWidthClass}`}>
          <div className="hidden md:flex items-center justify-start">
            <ul className="hidden md:flex items-center justify-start gap-8">
              {desktopMenuItems.map((item) => {
                const Icon = Icons[item.icon] || Icons.Menu;

                return (
                <li key={item.id} className="inline-block">
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.path, item.target)}
                    className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-300 hover:text-[var(--secondary-color)]"
                  >
                    <Icon size={16} />
                    {item.name}
                  </button>
                </li>
                );
              })}
            </ul>
          </div>

          <div ref={notificationsRef} className="relative ml-auto flex items-center justify-end gap-6 md:gap-8 " onClick={(event) => event.stopPropagation()}>
            <div className={`flex items-center gap-6 md:gap-8 transition-all duration-300 md:opacity-100 md:translate-y-0 md:pointer-events-auto ${showMobileQuickControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
              <button
                type="button"
                aria-label="Abrir notificaciones"
                aria-expanded={showNotifications}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowNotifications((prev) => !prev);
                }}
                className="rounded-full p-2  transition-colors duration-300 text-[var(--white-color)] hover:text-[var(--secondary-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary-color)]"
              >
                <Icons.Bell size={24} />
                {unreadNotifications > 0 && (
                  <span className="pointer-events-none absolute -right-[-60px]  md:-right-[-70px] -top-[-1px] inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>

              <span>
                <button type="button" onClick={() => handleNavigate("/profile", "_self")}>
                  <img
                    src={profileImage}
                    alt="Tierra de Todos"
                    className="select-none h-10 w-10 rounded-full overflow-hidden object-cover"
                    draggable={false}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = UserDefault;
                      localStorage.setItem(PROFILE_IMAGE_CACHE_KEY, UserDefault);
                    }}
                  />
                </button>
              </span>
            </div>

            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setIsOpen(true)}
              className="hidden md:inline-flex  transition-colors duration-300 hover:text-[var(--secondary-color)]  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary-color)]"
            >
              <Icons.Menu size={24} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 overflow-hidden rounded-2xl border border-black/10 bg-[var(--white-color)] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--black-color)]">Notificaciones</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-[var(--secondary-color)] hover:opacity-80"
                    onClick={() => setShowNotifications(false)}
                  >
                    <Icons.X size={16} />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <div className="px-4 py-6 text-sm text-black/65">No hay notificaciones por ahora.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Background
        className={`relative flex-1 min-h-0 overflow-y-auto tdt-scrollbar overflow-x-auto mx-auto w-full ${maxWidthClass}`}
        onScroll={handleContentScroll}
      >
        <div className="absolute inset-0 -z-10 md:mt-[50px] mt-[-20px] ">{children}</div>
      </Background>

      <nav className="w-full flex-shrink-0 bg-[var(--white-color)] z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] block md:hidden">
        <div className="flex w-full justify-between h-16">
          {menuItems
            .filter((item) => item.shortAccess)
            .map((item) => {
              const Icon = Icons[item.icon] || Icons.Menu;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path, item.target)}
                  className={`flex-1 flex flex-col items-center justify-center text-sm transition-all duration-300
                    ${isActive ? "text-[var(--secondary-color)] scale-110" : "text-black/70 hover:text-[var(--secondary-color)]"}`}
                >
                  <Icon size={22} />
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              );
            })}

          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center text-black/70 hover:text-[var(--secondary-color)] transition-all duration-300"
          >
            <Icons.Menu size={22} />
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </nav>

      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100 visible bg-black/20" : "opacity-0 invisible"}`}
      />

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[var(--white-color)] z-50
          transform transition-transform duration-300 ease-out flex flex-col overflow-y-auto
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 flex flex-col gap-6 text-black flex-1 min-h-0 overflow-y-auto">
          <h2 className="text-md font-semibold pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Tierra de Todos
              <img src="img/cubo.webp" className="w-6 mt-1" alt="Cubo" />
            </span>
          </h2>

          <div className="flex flex-col gap-5">
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-black/45">Mis opciones</p>
              {userMenuItems.map((item) => {
                const Icon = Icons[item.icon] || Icons.Menu;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path, item.target)}
                    className={`flex items-center gap-3 text-left transition-all duration-200
                    ${isActive ? "text-[var(--secondary-color)] font-medium" : "text-black/70 hover:text-black"}`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {adminMenuItems.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-black/10">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-black/45">Opciones de admin</p>
                {adminMenuItems.map((item) => {
                  const Icon = Icons[item.icon] || Icons.Menu;
                  const isActive = location.pathname === item.path;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path, item.target)}
                      className={`flex items-center gap-3 text-left transition-all duration-200
                    ${isActive ? "text-[var(--secondary-color)] font-medium" : "text-black/70 hover:text-black"}`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sticky bottom-0 bg-[var(--white-color)] border-t border-black/10">
          <button
            onClick={() => {
              setIsOpen(false);
              setShowAlert(true);
            }}
            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-[var(--cancel-color)] hover:bg-[var(--cancel-color)]/10 transition-all duration-200 font-semibold"
          >
            <Icons.LogOut size={20} />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Controls;