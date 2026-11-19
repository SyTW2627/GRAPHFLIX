import { useNavigate } from "react-router-dom";
import UserHeader from "../../components/UserHeader/UserHeader";
import "./HelpScreen.css";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  description: string;
  questions: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "Primeros pasos",
    description: "Empieza a utilizar Graphflix.",
    questions: [
      {
        question: "¿Qué es Graphflix?",
        answer:
          "Graphflix es una plataforma que permite explorar películas y otras obras audiovisuales mediante mapas visuales. Puedes descubrir relaciones entre distintas obras y organizar tus propios mapas.",
      },
      {
        question: "¿Cómo empiezo a utilizar la aplicación?",
        answer:
          "Después de registrarte e iniciar sesión, podrás acceder a tu espacio personal. Desde ahí podrás acceder al buscador de películas y seleccionar las que te gusten. Tras añadirlas a favoritos, se mostraran peliculas similares en base a genero, directores, actores, ¡y demás cosas!. ",
      },
      {
        question: "¿Qué es un mapa?",
        answer:
          "Un mapa es un espacio visual donde puedes organizar diferentes obras. Cada obra aparece representada mediante un nodo y las conexiones entre ellas se muestran mediante aristas.",
      },
    ],
  },
  {
    title: "Mapas y exploración",
    description: "Aprende a gestionar y explorar tus mapas.",
    questions: [
      {
        question: "¿Qué representan los nodos?",
        answer:
          "Cada nodo representa una obra dentro del mapa, como una película. Al seleccionar un nodo podrás consultar información sobre esa obra y explorar sus relaciones.",
      },
      {
        question: "¿Qué representan las conexiones?",
        answer:
          "Las conexiones representan relaciones entre las obras del mapa. Permiten visualizar qué elementos tienen características o aspectos en común.",
      },
      {
        question: "¿Puedo añadir nuevas obras a mi mapa?",
        answer:
          "Sí. Graphflix permite explorar nuevas obras y ampliar tus mapas con contenido relacionado, según las funcionalidades disponibles para cada tipo de mapa.",
      },
    ],
  },
  {
    title: "Cuenta y perfil",
    description: "Gestiona tu información personal.",
    questions: [
      {
        question: "¿Dónde puedo consultar mi perfil?",
        answer:
          "Puedes acceder a la sección «Mi cuenta» desde el menú de usuario situado en la parte superior de la aplicación.",
      },
      {
        question: "¿Puedo modificar mis datos personales?",
        answer:
          "Desde la sección «Mi cuenta» podrás consultar y gestionar los datos personales que la aplicación permita modificar.",
      },
      {
        question: "¿Cómo puedo cerrar sesión?",
        answer:
          "En la parte superior de la pantalla verás un botón «Cerrar sesión», pulsalo y ya habrás salido.",
      },
    ],
  },
];

function HelpScreen() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Si hay historial previo dentro de la app, volvemos; si no, vamos al inicio
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/"); // cambia por la ruta de inicio que uses
    }
  };

  return (
    <>
    <UserHeader/>
    <main className="help-screen">
        
      <div className="help-container">
        

        <div className="help-topbar">
          <button
            type="button"
            className="help-back-button"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver
          </button>
        </div>

        <section className="help-welcome">
          <div className="help-welcome-icon">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div>
            <h2>¿En qué podemos ayudarte?</h2>
            <p>
              Consulta las preguntas frecuentes para conocer mejor las
              funcionalidades de Graphflix.
            </p>
          </div>
        </section>

        <div className="help-sections">
          {faqSections.map((section, sectionIndex) => (
            <section className="help-section" key={section.title}>
              <div className="help-section-heading">
                <span className="help-section-number">
                  {String(sectionIndex + 1).padStart(2, "0")}
                </span>

                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="help-questions">
                {section.questions.map((item) => (
                  <details className="help-question" key={item.question}>
                    <summary>
                      <span>{item.question}</span>

                      <svg
                        className="help-question-arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>

                    <div className="help-answer">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="help-footer">
          <div className="help-footer-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
            </svg>
          </div>

          <div>
            <h3>¿Sigues teniendo dudas?</h3>
            <p>
              Si no encuentras lo que buscas, puedes ponerte en contacto con
              el equipo de Graphflix.
            </p>
          </div>
        </section>
      </div>
    </main>
    </>
  );
}

export default HelpScreen;