import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Header/Header.css";
import "./UserHeader.css";
import logo from "../../assets/logo-graphflix.png";
import { logout } from "../../services/auth.service"; 

function UserHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cierra el menú al hacer clic fuera o pulsar Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // para cerrar la sesion
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("No se pudo cerrar la sesión en el servidor:", err);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logo de Graphflix" className="navbar-logo" />
        <h1 className="navbar-title">Graphflix</h1>
      </div>

      <div className="user-menu" ref={menuRef}>
        <button
          className="user-menu-trigger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menú de usuario"
        >
          {/** flecha y perfil*/}
          <svg className="user-avatar" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id="avatar-clip">
                <circle cx="12" cy="12" r="10" />
              </clipPath>
            </defs>
            {/* Aro exterior */}
            <circle cx="12" cy="12" r="11.4" fill="#fff" stroke="#e2e8f0" strokeWidth="1.2" />
            {/* Fondo */}
            <circle cx="12" cy="12" r="10" fill="#cbd5e1" />
            {/* Cabeza y hombros, recortados dentro del círculo */}
            <g clipPath="url(#avatar-clip)" fill="#64748b">
              <circle cx="12" cy="9.5" r="3.8" />
              <ellipse cx="12" cy="22" rx="7.5" ry="6" />
            </g>
          </svg>

          <svg
            className={`user-chevron ${menuOpen ? "user-chevron--open" : ""}`} viewBox="0 0 24 24" aria-hidden="true"
          >
            <polyline points="5 9 12 16 19 9" />
          </svg>
        </button>

        {menuOpen && (
          <ul className="user-dropdown" role="menu">
            <li role="none">
              {/** falta crear eso para la cuenta */}
              <Link
                to="/perfil"
                role="menuitem"
                className="user-dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                Mi cuenta
              </Link>
            </li>

            <li role="none">
               {/** aqui tambien hay que ponerle otro /ayuda */}
              <button
                role="menuitem"
                className="user-dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                Ayuda
              </button>
            </li>

            <li role="none">
              <button
                role="menuitem"
                className="user-dropdown-item"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </li>

            
          </ul>
        )}
      </div>
    </header>
  );
}

export default UserHeader;