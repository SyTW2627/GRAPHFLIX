import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./LoginScreen.css";
import logo from "../../assets/logo-graphflix.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { login } from "../../services/auth.service";
import { Link, useNavigate } from "react-router-dom";

function LoginScreen() {
  const navigate = useNavigate();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Datos del formulario.
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  // Estado para mostrar errores.
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const user = await login({
        correo,
        password
      });

      console.log("Usuario autenticado:", user);

      // redirige al usuario a la página principal.
      navigate("/grafo", { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  }

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

        <form className="login-form" onSubmit={handleLogin}>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <div className="password-container">
              <input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>

        </form>

        <p>
          ¿No tienes una cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </div>

      <Footer />
    </>
  );
}

export default LoginScreen;