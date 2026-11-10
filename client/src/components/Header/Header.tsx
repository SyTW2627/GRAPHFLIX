import { Link } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/logo-graphflix.png";

function Header() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <img
          src={logo}
          alt="Logo de Graphflix"
          className="navbar-logo"
        />
        <Link to="/" className="navbar-title">
          <h1 className="navbar-title">Graphflix</h1>
        </Link>
      </div>

      <nav className="navbar-actions">
        <Link to="/login" className="nav-btn btn-secondary">
          Iniciar sesión
        </Link>
        <Link to="/register" className="nav-btn btn-primary">
          Registrarse
        </Link>
      </nav>
    </header>
  );
}

export default Header;