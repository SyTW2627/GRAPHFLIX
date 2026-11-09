import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./LoginScreen.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function LoginScreen() {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <>
    <Header/>
    <div className="login-container">
      <h2>Iniciar sesión</h2>

      <form className="login-form">
        <input
          type="email"
          placeholder="Correo electrónico"
        />

        <div className="password-container">
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
          />

          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" className="login-button">
          Iniciar sesión
        </button>
      </form>

      <p>¿No tienes una cuenta? Regístrate</p>
    </div>
    <Footer/>
  </>
  );
}

export default LoginScreen;