import React from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { Link } from "react-router-dom";
import "./LandingScreen.css";

import RedMorada from "../../assets/RedMorada.png";

function LandingScreen() {
  return (
    <>
      <Header isLanding={true} />
      <main className="landing-container">
        {/*SECCIÓN LANDING */}
        <section className="landing-section">
          <div className="landing-content">
            
            <h1 className="landing-title">Conecta tus gustos y descubre nuevas historias</h1>
            
            <p className="landing-description">
            <strong>Graphflix</strong> transforma tus gustos, intereses y descubrimientos en un universo visual interactivo. Conecta aquello que te apasiona, encuentra nuevas relaciones y descubre intereses que ni siquiera sabías que tenías.
            </p>        

            <div className="landing-buttons">
              <Link to="/login" className="btn-primary">
                  EXPLORA TU MAPA PERSONALIZADO
              </Link>
            </div>
          </div>

          <div className="landing-graph-container">
            <div className="graph-visual">
              <img src={RedMorada} alt="Grafo de recomendaciones de Graphflix" />
            </div>
          </div>
        </section>

        {/*CARACTERÍSTICAS*/}
        <section className="features-section">
          <h2 className="section-title">¿Por qué usar Graphflix?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Visualización de Relaciones con tus pelis favoritas</h3>
              <p>Navega entre actores, géneros y directores mediante mapas interactivos intuitivos.</p>
            </div>

            <div className="feature-card">
              <h3>Algoritmo de Similitud</h3>
              <p>Recomendaciones reales calculadas mediante algoritmos de coincidencia precisos.</p>
            </div>

            <div className="feature-card">
              <h3>Mapas Personalizados</h3>
              <p>Organiza tu colección y guarda tus universos de favoritos en tu perfil.</p>
            </div>
          </div>
        </section>

        {/*CÓMO FUNCIONA */}
        <section id="como-funciona" className="how-it-works-section">
          <h2 className="section-title">¿Cómo funciona Graphflix?</h2>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Selecciona tus favoritas</h3>
              <p>Indica 3 obras que te encanten para crear tu mapa personalizado con tus preferencias.</p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Genera las conexiones</h3>
              <p><strong>Graphflix</strong> genera automáticamente las conexiones entre tus obras favoritas para que puedas explorarlas y descubrir nuevas recomendaciones.</p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Explora y descubre</h3>
              <p>Navega visualmente por los nodos, filtra los resultados y encuentra tu próxima película para ver accediendo a su información detallada.</p>
            </div>
          </div>
        </section>

        {/* CUADRADO FINAL */}
        <section className="final-section">
          <div className="final-banner">
            <h2>¿Listo para construir tu universo de entretenimiento?</h2>
            <p>Únete a <strong>Graphflix</strong> hoy mismo y empieza a conectar tu catálogo personal.</p>
            <Link className="btn-primary btn-large" to="/register"> 
              Crear mi mapa gratis
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default LandingScreen;