import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import UserHeader from "../../components/UserHeader/UserHeader";
import { getStoreUSer, updateUser } from "../../services/auth.service";
import "./AccountScreen.css";
import { ArrowLeft } from "lucide-react";

interface Feedback {
  type: "success" | "error";
  text: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function AccountScreen() {
  const navigate = useNavigate();

  // Carga inicial
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Datos guardados en el servidor (para detectar cambios)
  const [savedUsername, setSavedUsername] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  // Formulario de perfil
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null);

  // Formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const user = getStoreUSer();
        if (cancelled) return;

        if (!user) {
          throw new Error("No se han podido cargar tus datos.");
        }

        setSavedUsername(user.nombre_usuario);
        setSavedEmail(user.correo);
        setUsername(user.nombre_usuario);
        setEmail(user.correo);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se han podido cargar tus datos."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/"); // cambia por la ruta de inicio que uses
    }
  };

  const hasProfileChanges =
    username.trim() !== savedUsername || email.trim() !== savedEmail;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProfileFeedback(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      setProfileFeedback({
        type: "error",
        text: "El nombre de usuario no puede estar vacío.",
      });
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setProfileFeedback({
        type: "error",
        text: "Introduce un correo electrónico válido.",
      });
      return;
    }

    // Solo enviamos los campos que han cambiado
    const payload: { nombre_usuario?: string; correo?: string } = {};
    if (trimmedUsername !== savedUsername) {
      payload.nombre_usuario = trimmedUsername;
    }
    if (trimmedEmail !== savedEmail) payload.correo = trimmedEmail;

    setIsSavingProfile(true);

    try {
      await updateUser(payload);

      setSavedUsername(trimmedUsername);
      setSavedEmail(trimmedEmail);
      setUsername(trimmedUsername);
      setEmail(trimmedEmail);
      setProfileFeedback({
        type: "success",
        text: "Tus datos se han actualizado correctamente.",
      });
    } catch (error) {
      setProfileFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se han podido guardar los cambios.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Introduce tu contraseña actual.",
      });
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordFeedback({
        type: "error",
        text: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordFeedback({
        type: "error",
        text: "La nueva contraseña debe ser distinta de la actual.",
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      await updateUser({
        password_actual: currentPassword,
        password_nueva: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({
        type: "success",
        text: "Tu contraseña se ha actualizado correctamente.",
      });
    } catch (error) {
      setPasswordFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se ha podido cambiar la contraseña.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="account-screen">
      <UserHeader />

      <div className="account-container">
        <div className="account-topbar">
          <button
            type="button"
            className="account-back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />
            Volver al grafo
          </button>
        </div>

        <section className="account-welcome">
          <div className="account-welcome-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div>
            <h2>Mi cuenta</h2>
            <p>Consulta y gestiona tus datos personales y tu contraseña.</p>
          </div>
        </section>

        {isLoading && <p className="account-status">Cargando tus datos...</p>}

        {loadError && (
          <p className="account-feedback account-feedback--error" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && (
          <div className="account-sections">
            {/* Datos de la cuenta */}
            <section className="account-card">
              <div className="account-card-heading">
                <span className="account-card-number">01</span>

                <div>
                  <h2>Datos de la cuenta</h2>
                  <p>Tu nombre de usuario y tu correo electrónico.</p>
                </div>
              </div>

              <form
                className="account-form"
                onSubmit={handleProfileSubmit}
                noValidate
              >
                <div className="account-field">
                  <label htmlFor="account-username">Nombre de usuario</label>
                  <input
                    id="account-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSavingProfile}
                  />
                </div>

                <div className="account-field">
                  <label htmlFor="account-email">Correo electrónico</label>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSavingProfile}
                  />
                </div>

                {profileFeedback && (
                  <p
                    className={`account-feedback account-feedback--${profileFeedback.type}`}
                    role={profileFeedback.type === "error" ? "alert" : "status"}
                  >
                    {profileFeedback.text}
                  </p>
                )}

                <div className="account-actions">
                  <button
                    type="submit"
                    className="account-submit-button"
                    disabled={!hasProfileChanges || isSavingProfile}
                  >
                    {isSavingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>

            {/* Contraseña */}
            <section className="account-card">
              <div className="account-card-heading">
                <span className="account-card-number">02</span>

                <div>
                  <h2>Contraseña</h2>
                  <p>
                    Usa una contraseña de al menos {MIN_PASSWORD_LENGTH}{" "}
                    caracteres.
                  </p>
                </div>
              </div>

              <form
                className="account-form"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <div className="account-field">
                  <label htmlFor="account-current-password">
                    Contraseña actual
                  </label>
                  <input
                    id="account-current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSavingPassword}
                  />
                </div>

                <div className="account-field">
                  <label htmlFor="account-new-password">Nueva contraseña</label>
                  <input
                    id="account-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSavingPassword}
                  />
                </div>

                <div className="account-field">
                  <label htmlFor="account-confirm-password">
                    Repite la nueva contraseña
                  </label>
                  <input
                    id="account-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSavingPassword}
                  />
                </div>

                {passwordFeedback && (
                  <p
                    className={`account-feedback account-feedback--${passwordFeedback.type}`}
                    role={
                      passwordFeedback.type === "error" ? "alert" : "status"
                    }
                  >
                    {passwordFeedback.text}
                  </p>
                )}

                <div className="account-actions">
                  <button
                    type="submit"
                    className="account-submit-button"
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      isSavingPassword
                    }
                  >
                    {isSavingPassword ? "Guardando..." : "Cambiar contraseña"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default AccountScreen;