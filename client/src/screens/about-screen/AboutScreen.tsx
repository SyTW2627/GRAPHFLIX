import React from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./AboutScreen.css";

import Trabajadores from "../../assets/Trabajadores.png";
import Vision from "../../assets/Vision.png";
import Mision from "../../assets/Mision.png";

function AboutScreen() {
  return (
    <>
      <Header isLanding={true} />

      <main className="origin-container">
        {/* 1. SECCIÓN ORIGEN EN 2 COLUMNAS */}
        <section className="origin-section">
          <div className="origin-content">
            <h1>¿Qué es GRAPHFLIX?</h1>
            <p className="normal-text">
              GRAPHFLIX es una plataforma de recomendación de obras y ocio basada en grafos, con el objetivo de ofrecer a los usuarios
              una experiencia de descubrimiento más completa que la que proporcionan los algoritmos de recomendación tradicionales. 
              <br /><br />
              El proyecto nace de un trabajo universitario, pero con la ambición de convertirse en una herramienta útil y accesible para cualquier 
              persona interesada en explorar el mundo del cine, la televisión, la literatura y la música de una manera más profunda y significativa.
            </p>
          </div>

          <div className="origin-image">
            <img src={Trabajadores} alt="Imagen de los trabajadores de GRAPHFLIX" />
          </div>
        </section>

        {/* 2. EQUIPO */}
        <section className="about-section-block">
          <h2>Las personas detrás de GRAPHFLIX</h2>
            <p className="normal-text">
              Somos un equipo de estudiantes del <strong>Grado en Ingeniería Informática </strong>en la <strong>Universidad de La Laguna</strong>, 
              apasionados por el desarrollo Full Stack. Nos motiva el aprendizaje continuo y el desafío de crear nuevas herramientas tecnológicas 
              capaces de simplificar y enriquecer las experiencias cotidianas de nuestros usuarios.
              <br /><br />
              A lo largo del proyecto hemos unido nuestros conocimientos y habilidades en distintas áreas de la ingeniería del software para 
              construir una plataforma que combina tecnología, creatividad y experiencia de usuario.
              <br /><br />
              Más que desarrollar una aplicación, buscamos convertir una idea en una herramienta útil, intuitiva y diferente.
            </p>
        </section>

        {/* 3. PROBLEMÁTICA Y SOLUCIÓN */}
        <section className="about-section-block">
          <h2>Problemática y Solución</h2>
            <div className="cards-problem-grid">
                <div className="standard-card problem-card">
                    <h3>Problemática</h3>
                    <p className="normal-text">
                        Los algoritmos de recomendación tradicionales suelen limitar la diversidad y la calidad de las recomendaciones.
                        Esto produce un descontento en los usuarios, que buscan una experiencia más rica y personalizada, y una mayor transparencia 
                        en cómo se generan las recomendaciones.
                    </p>
                </div>

                <div className="solution-arrow">
                    <span>➜</span>
                </div>

                <div className="standard-card solution-card">
                    <h3>Solución</h3>
                    <p className="normal-text">
                        Diseñamos un sistema de recomendación basado en grafos que permite a los usuarios explorar relaciones entre obras, actores, géneros 
                        y directores. Además de poder especificar concretamente sus obras favoritas, los usuarios pueden descubrir nuevas obras a través 
                        de un mapa interactivo que refleja sus gustos y preferencias.
                    </p>
                </div>
            </div>
        </section>

        {/* 4. MISIÓN Y VISIÓN */}
        <section className="about-section-block">
            <h2>Misión y Visión</h2>

            <div className="cards-grid">
                <div className="purpose-card">
                    <img src={Mision} alt="Misión" className="purpose-image" />
                    <h3>Nuestra Misión</h3>
                    <p className="normal-text">
                        Transformar la forma de descubrir nuevas obras de una manera más interactiva y personalizada, 
                        ofreciendo a los usuarios poder explorar sus gustos y preferencias a través de un mapa visual y modificarlo 
                        según sus necesidades.    
                    </p>
                </div>

                <div className="purpose-card">
                    <img src={Vision} alt="Visión" className= "purpose-image" />
                    <h3>Nuestra Visión</h3>
                    <p className="normal-text">
                        Consolidar GRAPHFLIX como una herramienta de referencia para quienes buscan descubrir contenido audiovisual de forma 
                        sencilla e intuitiva, transformando la búsqueda tradicional en una experiencia interactiva y enriquecedora.
                    </p>
                </div>
            </div>
        </section>

            {/* 5. NUESTRA FILOSOFÍA */}
        <section className="about-section-block philosophy-section">
            <div className="philosophy-content">
                <span className="philosophy-label">LO QUE NOS DEFINE</span>

                <h2>Descubrir una historia debería ser tan interesante como verla.</h2>

                <p>
                En GRAPHFLIX apostamos por una tecnología que da libertad al usuario,
                no que decide por él. Defendemos la transparencia, la exploración y
                la conexión entre contenidos, permitiendo que cada persona construya
                su propio recorrido por el universo cinematográfico.
                </p>
            </div>
            </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutScreen;