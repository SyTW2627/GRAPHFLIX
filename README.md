# Graphflix

Aplicación web que recomienda películas y las presenta como un **grafo interactivo**: cada nodo es una película y cada conexión indica por qué se recomienda. Cada usuario tiene su propio grafo, con sus películas favoritas como nodos raíz.

Proyecto de la asignatura **Sistemas y Tecnologías Web** (Universidad de La Laguna, 2026-2027).

## Autores

- Adrián David Hernández González
- Sofia Bethencourt Márquez
- Karen Alessia Santos Verzilli

## Instalación

```bash
git clone <url-del-repo>
cd GRAPHFLIX

# Server
cd backend
bun install
cd ..

# Client
cd frontend
bun install
cd ..
```

## Configuración de variables de entorno
### Server
Crear un archivo .env en el directorio server con las siguientes variables:
- DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/graphflix
- TOKEN_SECRET_KEY=clave-secreta-para-generar-tokens

Crear un archivo .env.test en server con las siguientes variables:
- DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/graphflix_test

### Client
Crear un archivo .env en client con las siguientes variables:
- VITE_API_URL=http://localhost:3000

## Ingesta de datos
Para poblar la base de datos con películas y recomendaciones, ejecutar el script de ingesta:
```bash
cd server
bun run ingest
```

## Calculo de jaccard
**IMPORTANTE: HACER LA INGESTA DE DATOS ANTES DE CALCULAR EL ÍNDICE DE JACCARD.**
Para calcular el índice de Jaccard entre dos películas, ejecutar el script:
```bash
cd server
bun run db:jaccard
```

## Entorno de pruebas

### Test unitarios
Para ejecutar los tests, primero crear la base de datos de pruebas:
```bash
docker exec -it graphflix_postgres psql -U usuario -d graphflix -c "CREATE DATABASE graphflix_test;"
bun run db-init-test
```

Para ejecutar los tests, usar el siguiente comando:
```bash
bun run test
```

Si quieres ejecutar los tests de alguna carpeta en concreto, puedes usar:
```bash
bun run test <carpeta>
```
### Test E2E
Para ejecutar los tests E2E, primero iniciar el servidor y el cliente, y luego ejecutar los tests:
```bash
# Iniciar servidor
cd server
bun run dev
# Iniciar el cliente
cd ../client
bun run dev
# Ejecutar tests E2E
cd ..
bunx playwright test
```

Para ver el coverage, ir al fichero `coverage-e2e/index.html` y abrirlo en el navegador.


## Ejecución de la aplicación
Para ejecutar la aplicación, primero iniciar el servidor y luego el cliente:
```bash
# Iniciar servidor
cd server
bun run dev

# Iniciar cliente
cd ../frontend
bun run dev
```
Luego tienes que abrir tu navegador y acceder a la URL http://localhost:5173 para ver la aplicación en funcionamiento.

### Primer uso
1. Regístrate (te inicia sesión automáticamente).
2. En el onboarding elige al menos 3 películas y pulsa **Continuar** (o pulsa **Saltar**).
3. Se abre tu grafo en `/grafo`.
- Puedes añadir más películas a tu grafo desde la barra de búsqueda. 
- Pulsa en cualquier nodo para ver la información de la película y sus recomendaciones.
- Puedes ver tus películas favoritas en el corazon arriba a la derecha.
- Puedes filtrar las películas por género, año y otros criterios desde el menú de la izquierda.
- Puedes modificar tu perfil en el icono de usuario arriba a la derecha.
- Puedes cerrar sesión en el icono de usuario arriba a la derecha.
- Puedes eliminar películas favoritas desde el icono de corazón en la película.
