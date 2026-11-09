import React from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { Link } from "react-router-dom";
import "./LandingScreen.css";

import RedMorada from "../../assets/RedMorada.png";

function LandingScreen() {
  return (
    <>
      <Header />

      <main className="landing-container">
        {/*SECCIÓN LANDING */}
        <section className="landing-section">
          <div className="landing-content">
            
            <h1 className="landing-title">Conecta tus gustos y descubre nuevas historias</h1>
            
            <p className="landing-description">
              GRAPHFLIX transforma tus gustos, intereses y descubrimientos en un universo visual interactivo. Conecta aquello que te apasiona, encuentra nuevas relaciones y descubre intereses que ni siquiera sabías que tenías.
            </p>        

            <div className="landing-buttons">
              <Link to="/login" className="btn-primary">
                  EXPLORA TU MAPA PERSONALIZADO
              </Link>
              <a href="#como-funciona" className="btn-secondary">
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="landing-graph-container">
            <div className="graph-visual">
              <img src={RedMorada} alt="Grafo de recomendaciones de GRAPHFLIX" />
            </div>
          </div>
        </section>

        {/*CARACTERÍSTICAS*/}
        <section className="features-section">
          <h2 className="section-title">¿Por qué usar GRAPHFLIX?</h2>

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
          <h2 className="section-title">Cómo funciona GRAPHFLIX</h2>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Selecciona tus favoritas</h3>
              <p>Indica 3 películas que te encanten para romper el inicio en frío y activar tu mapa.</p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Genera las conexiones</h3>
              <p>GRAPHFLIX traza las aristas de similitud conectando títulos afines.</p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Explora y descubre</h3>
              <p>Navega visualmente por los nodos y encuentra tu próxima película para ver.</p>
            </div>
          </div>
        </section>

        {/* CUADRADO FINAL */}
        <section className="final-section">
          <div className="final-banner">
            <h2>¿Listo para construir tu universo de entretenimiento?</h2>
            <p>Únete a GRAPHFLIX hoy mismo y empieza a conectar tu catálogo personal.</p>
            <Link className="btn-primary btn-large" to="/login"> 
            {/*Cambiar a /register cuando esté disponible la ruta de registro*/}
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