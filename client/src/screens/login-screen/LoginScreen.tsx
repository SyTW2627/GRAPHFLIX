import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./LoginScreen.css";
import logo from "../../assets/logo-graphflix.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function LoginScreen() {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <>
      <Header />

      <div className="login-container">
        <img 
          src={logo} 
          alt="Logo de Graphflix"
          className="login-logo"
        />
        <h2>Iniciar sesión</h2>

        <form className="login-form">

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
              <div className="password-container">
                <input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                />
              </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <div className="password-container">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="Introduce tu contraseña"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>

        </form>

        <p>¿No tienes una cuenta? Regístrate</p>
      </div>

      <Footer />
    </>
  );
}

export default LoginScreen;