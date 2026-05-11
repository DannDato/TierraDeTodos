import { useEffect, useRef, useState } from "react";
import { Bell,X } from "lucide-react";

function HeadBar({ maxWidthClass = "max-w-[1800px]" }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadNotifications = 4;
    const notificationsRef = useRef(null);

    function handleHeadBarClick() {
        const scrollContainer = document.getElementById("inicio");

        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!notificationsRef.current?.contains(event.target)) {
                setShowNotifications(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setShowNotifications(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full " onClick={handleHeadBarClick}>
            <div className={`mx-auto grid h-[76px] w-full grid-cols-3 items-center px-4 sm:px-6 ${maxWidthClass}`}>
                <div aria-hidden="true" />

                <div className="flex justify-center">
                    <img
                        src="/img/tdtLine.png"
                        alt="Tierra de Todos"
                        className="select-none h-2 md:h-4"
                        draggable={false}
                    />
                </div>

                <div ref={notificationsRef} className="relative flex justify-end" onClick={(event) => event.stopPropagation()}>
                    <button
                        type="button"
                        aria-label="Abrir notificaciones"
                        aria-expanded={showNotifications}
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowNotifications((prev) => !prev);
                        }}
                        className="rounded-full p-2 text-[var(--white-color)] transition-colors duration-300 hover:text-[var(--secondary-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary-color)]"
                    >
                        <Bell size={24} />
                        {unreadNotifications > 0 && (
                            <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                                {unreadNotifications > 99 ? "99+" : unreadNotifications}
                            </span>
                        )}
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
                                    <X size={16} />
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
    );
}

export default HeadBar;