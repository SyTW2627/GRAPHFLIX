import "./Header.css";
import logo from "../../assets/logo-graphflix.png";


function Header() {
  return (
    <nav className="navbar">
      <img
        src={logo}
        alt="Logo de Graphflix"
        className="navbar-logo"
      />
      <h1 className="navbar-logo">Graphflix</h1>
    </nav>
  );
}

export default Header;