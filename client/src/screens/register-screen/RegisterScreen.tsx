import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./RegisterScreen.css";
import logo from "../../assets/logo-graphflix.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { register } from "../../services/auth.service";

function RegisterScreen() {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  // Datos del formulario.
  const [nombre_usuario, setNombreUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // Estado para mostrar errores.
  const [error, setError] = useState("");

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Comprobar que las contraseñas coincidan.
    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const user = await register({
        nombre_usuario,
        correo,
        password
      });

      console.log("Usuario registrado:", user);

      // Más adelante redirigiremos al usuario a la página principal.

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    }
  }

  return (
    <>
      <Header />

      <div className="register-container">
        <img
          src={logo}
          alt="Logo de Graphflix"
          className="register-logo"
        />

        <h2>Crear cuenta</h2>

        <form className="register-form" onSubmit={handleRegister}>

          {/* Nombre de usuario */}
          <div className="form-group">
            <label htmlFor="nombre_usuario">Nombre de usuario</label>

            <div className="input-container">
              <input
                id="nombre_usuario"
                type="text"
                placeholder="Introduce tu nombre de usuario"
                value={nombre_usuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Correo electrónico */}
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <div className="input-container">
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

          {/* Contraseña */}
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

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar contraseña</label>

            <div className="password-container">
              <input
                id="confirmarPassword"
                type={mostrarConfirmarPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
              >
                {mostrarConfirmarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="register-button">
            Registrarse
          </button>

        </form>
      </div>

      <Footer />
    </>
  );
}

export default RegisterScreen;