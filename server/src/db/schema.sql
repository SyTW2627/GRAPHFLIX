CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS obra (
    id_obra SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ano_publicacion INTEGER,
    descripcion TEXT,
    imagen_url TEXT
);

CREATE TABLE IF NOT EXISTS persona (
    id_persona SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS mapa (
    id_mapa SERIAL PRIMARY KEY,
    tipo_mapa VARCHAR(50),
    nombre_mapa VARCHAR(100),
    id_usuario INTEGER NOT NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorita (
    id_usuario INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    PRIMARY KEY (id_usuario, id_obra),
    CONSTRAINT fk_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_obra FOREIGN KEY (id_obra)
        REFERENCES obra(id_obra) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nodo (
    id_nodo SERIAL PRIMARY KEY,
    pos_x DOUBLE PRECISION,
    pos_y DOUBLE PRECISION,
    id_mapa INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    CONSTRAINT fk_mapa FOREIGN KEY (id_mapa)
        REFERENCES mapa(id_mapa) ON DELETE CASCADE,
    CONSTRAINT fk_obra FOREIGN KEY (id_obra)
        REFERENCES obra(id_obra) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arista (
    nodo_origen INTEGER NOT NULL,
    nodo_destino INTEGER NOT NULL,
    tipo VARCHAR(50),
    PRIMARY KEY (nodo_origen, nodo_destino),
    CONSTRAINT fk_nodo_origen FOREIGN KEY (nodo_origen)
        REFERENCES nodo(id_nodo) ON DELETE CASCADE,
    CONSTRAINT fk_nodo_destino FOREIGN KEY  (nodo_destino)
        REFERENCES nodo(id_nodo) ON DELETE CASCADE,
    CONSTRAINT check_nodos CHECK (nodo_destino > nodo_origen)
);

CREATE TABLE IF NOT EXISTS saga (
    id_saga SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS genero (
    id_genero SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- TABLAS INTERMEDIAS

CREATE TABLE IF NOT EXISTS genero_obra (
    id_genero INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    PRIMARY KEY (id_genero, id_obra),
    CONSTRAINT fk_genero FOREIGN KEY (id_genero)
        REFERENCES genero(id_genero) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS persona_obra (
    id_persona INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_persona, id_obra),
    CONSTRAINT fk_persona FOREIGN KEY (id_persona)
        REFERENCES persona(id_persona) ON DELETE CASCADE,
    CONSTRAINT fk_obra FOREIGN KEY (id_obra)
        REFERENCES obra(id_obra) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saga_obra (
    id_saga INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    PRIMARY KEY (id_saga, id_obra),
    CONSTRAINT fk_saga FOREIGN KEY (id_saga)
        REFERENCES saga(id_saga) ON DELETE CASCADE,
    CONSTRAINT fk_obra FOREIGN KEY (id_obra)
        REFERENCES obra(id_obra) ON DELETE CASCADE
);