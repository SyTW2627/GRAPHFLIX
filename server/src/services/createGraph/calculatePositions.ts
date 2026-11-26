import type { Pelicula, PeliculaPosicion, Relacion } from "./type-model";

/* ============================================================================
 *  CÁLCULO DE POSICIONES DEL MAPA DE PELÍCULAS
 *
 *  Las películas se colocan en anillos concéntricos alrededor del centro:
 *    - Nivel 0: películas favoritas (semillas), en el anillo más cercano.
 *    - Nivel 1, 2, 3...: películas recomendadas, cada nivel en un anillo más
 *      alejado.
 *
 *  El objetivo es que las películas relacionadas queden cerca y que las
 *  aristas se crucen lo menos posible. Para ello el algoritmo tiene 3 pasos:
 *
 *    1. Radios: se calcula a qué distancia va cada anillo (separación
 *       uniforme, que crece solo si hay demasiadas películas).
 *    2. Baricentro: se ordenan las películas de cada anillo según el ángulo
 *       medio de sus vecinas (así las relacionadas quedan en el mismo sector).
 *    3. Refinado: se miden los cruces reales de aristas y se prueban
 *       rotaciones e intercambios, conservando solo lo que mejora el mapa.
 * ========================================================================== */


/* ------------------------------ Constantes -------------------------------- */

// Coordenadas del centro del mapa (donde está el nodo central virtual)
const CENTERX = 500;
const CENTERY = 400;

// Separación mínima entre anillos (en px). Es también el radio del anillo
// de semillas cuando hay pocas películas.
const RADIO_BASE = 200;

// Giro inicial de cada anillo respecto al anterior (en radianes), para que
// no empiecen todos en el mismo ángulo.
const DESFASE_ANGULAR = 0.35;

// Espacio que ocupa cada portada a lo largo de su anillo (ancho + margen, en px).
// Si las portadas se siguen tocando, súbelos; si hay demasiado hueco, bájalos.
const ESPACIO_SEMILLA = 100;       // las semillas se ven más grandes
const ESPACIO_NODO = 70;           // resto de películas

// Número de pasadas de cada fase (más pasadas = mejor resultado, pero más lento)
const PASADAS_BARICENTRO = 6;
const PASADAS_REFINADO = 4;

// Rendimiento del refinado:
// - MAX_ROTACIONES: máximo de giros que se prueban por anillo (en vez de todos).
// - TIEMPO_MAX_MS: tiempo máximo del refinado; al agotarse se queda con lo mejor
//   encontrado hasta ese momento.
const MAX_ROTACIONES = 36;
const TIEMPO_MAX_MS = 1500;

const DOS_PI = 2 * Math.PI;

// Identificador del nodo central virtual (no es una película real).
// Es negativo para que nunca coincida con un id_obra.
const ID_CENTRO = -1;


/* -------------------------------- Tipos ----------------------------------- */

type Punto = { x: number; y: number };

// Coste de una disposición: primero importan los cruces, y a igualdad
// de cruces se prefieren las aristas más cortas.
type Costo = { cruces: number; longitud: number };

function exigirDefinido<T>(valor: T | undefined, mensaje: string): T {
    if (valor === undefined) {
        throw new Error(mensaje);
    }

    return valor;
}

/* ----------------------------- Utilidades --------------------------------- */

// Lleva cualquier ángulo al rango [0, 2π)
const normalizar = (a: number) => ((a % DOS_PI) + DOS_PI) % DOS_PI;

// Promedio de ángulos teniendo en cuenta que son circulares
// (el promedio de 350° y 10° es 0°, no 180°).
function promedioCircular(angulos: number[]): number {
    const s = angulos.reduce((acc, a) => acc + Math.sin(a), 0);
    const c = angulos.reduce((acc, a) => acc + Math.cos(a), 0);
    return normalizar(Math.atan2(s, c));
}

// Producto vectorial: indica de qué lado de la recta a→b cae el punto c.
// Se usa para detectar si dos segmentos se cruzan.
const orient = (a: Punto, b: Punto, c: Punto) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

// true si el coste "a" es estrictamente mejor que el coste "b"
const esMejor = (a: Costo, b: Costo) =>
    a.cruces < b.cruces || (a.cruces === b.cruces && a.longitud < b.longitud - 1e-6);


/* ============================== Función principal ========================== */

export function calcularPosiciones(
    peliculasSemilla: Pelicula[],
    peliculasRecomendadas: Pelicula[],
    idsPorNivel: Map<number, number[]>,
    relaciones: Relacion[]
): PeliculaPosicion[] {

    // Diccionario id_obra -> datos de la película
    const datosObra = new Map<number, Pelicula>(
        [...peliculasSemilla, ...peliculasRecomendadas].map(p => [Number(p.id_obra), p])
    );

    // Niveles ordenados de menor a mayor (0, 1, 2, 3...)
    const niveles = [...idsPorNivel.keys()].sort((a, b) => a - b);
    const primerNivel = niveles[0];

    if (primerNivel === undefined) {
        return [];
    }


    /* ---------------------- Estructuras básicas ---------------------------- */

    // nivelDe: id de película -> nivel al que pertenece
    // orden:   nivel -> lista de ids EN EL ORDEN en que se colocan en el anillo
    //          (este orden es lo que vamos optimizando)
    const nivelDe = new Map<number, number>();
    const orden = new Map<number, number[]>();
    for (const nivel of niveles) {
        const ids = [...(idsPorNivel.get(nivel) ?? [])];
        orden.set(nivel, ids);
        ids.forEach(id => nivelDe.set(id, nivel));
    }

    // Grafo no dirigido:
    //   vecinos: id -> conjunto de ids conectados con él
    //   aristas: lista de pares [a, b] sin duplicados
    const vecinos = new Map<number, Set<number>>();
    const aristas: [number, number][] = [];
    const vistas = new Set<string>();

    const conectar = (a: number, b: number) => {
        if (!vecinos.has(a)) vecinos.set(a, new Set());
        vecinos.get(a)!.add(b);
    };

    for (const r of relaciones) {
        const o = Number(r.obra_origen_id);
        const d = Number(r.obra_destino_id);

        // Se ignoran bucles y relaciones con películas que no están en el mapa
        if (o === d || !nivelDe.has(o) || !nivelDe.has(d)) continue;

        // Clave única independiente del sentido (A-B == B-A) para evitar duplicados
        const clave = o < d ? `${o}-${d}` : `${d}-${o}`;
        if (vistas.has(clave)) continue;
        vistas.add(clave);

        conectar(o, d);
        conectar(d, o);
        aristas.push([o, d]);
    }

    // Aristas del nodo central a cada semilla. Se incluyen para que el
    // algoritmo evite que otras aristas las crucen.
    for (const id of orden.get(primerNivel) ?? []) aristas.push([ID_CENTRO, id]);

    // Índice: nodo -> índices de las aristas que lo tocan.
    // Permite recalcular el coste solo de lo que cambia al mover un nodo.
    const aristasDe = new Map<number, number[]>();
    aristas.forEach(([a, b], i) => {
        for (const n of [a, b]) {
            if (!aristasDe.has(n)) aristasDe.set(n, []);
            aristasDe.get(n)!.push(i);
        }
    });


    // Optimización: precalcular, para cada arista, con qué otras aristas PUEDE
    // cruzarse. Dos aristas solo se cruzan si abarcan niveles que se solapan
    // (una arista nivel 0-1 nunca se cruza con una 2-3). Así se evita comparar
    // cada arista con todas las demás en cada evaluación.
    const nivelArista = (id: number) => (id === ID_CENTRO ? primerNivel : nivelDe.get(id)!);

    const rangos = aristas.map(([a, b]) => {
        const la = nivelArista(a), lb = nivelArista(b);
        return { lo: Math.min(la, lb), hi: Math.max(la, lb) };
    });

    const candidatas: number[][] = aristas.map(() => []);
    for (let i = 0; i < aristas.length; i++) {
        for (let j = i + 1; j < aristas.length; j++) {
            const [a1, b1] = exigirDefinido(aristas[i], "Arista no encontrada");
            const [a2, b2] = exigirDefinido(aristas[j], "Arista no encontrada");
    
            // Las que comparten nodo nunca cuentan como cruce
            if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) continue;
    
            // Los rangos de niveles deben solaparse
            const rangoI = exigirDefinido(rangos[i], "Rango de arista no encontrado");
            const rangoJ = exigirDefinido(rangos[j], "Rango de arista no encontrado");
    
            if (rangoI.lo <= rangoJ.hi && rangoJ.lo <= rangoI.hi) {
                exigirDefinido(candidatas[i], "Lista de candidatas no encontrada").push(j);
                exigirDefinido(candidatas[j], "Lista de candidatas no encontrada").push(i);
            }
        }
    }


    /* ---------------------------- Radios ----------------------------------- */

    // Los anillos se colocan a distancias uniformes: radio = separacion * (i + 1).
    // La separación es RADIO_BASE salvo que algún anillo tenga tantas películas
    // que no quepan en su circunferencia; en ese caso se aumenta la separación
    // de TODOS los anillos por igual. Así los anillos siguen equidistantes y el
    // mapa crece de forma gradual (sin saltos bruscos al añadir una favorita).
    let separacion = RADIO_BASE;

    niveles.forEach((nivel, i) => {
        const n = orden.get(nivel)!.length;
        const espacio = nivel === primerNivel ? ESPACIO_SEMILLA : ESPACIO_NODO;

        // Radio que necesita este anillo para que quepan n portadas:
        // circunferencia (2π·r) >= n · espacio
        const necesario = (n * espacio) / DOS_PI;

        // Separación que debería haber entre anillos para que este anillo,
        // situado en la posición (i + 1), tenga ese radio.
        separacion = Math.max(separacion, necesario / (i + 1));
    });

    const radios = new Map<number, number>();
    niveles.forEach((nivel, i) => radios.set(nivel, separacion * (i + 1)));


    /* ------------------------ Colocación de anillos ------------------------ */

    // offsets: giro de cada anillo (ángulo de la primera película)
    // angulos: ángulo actual de cada película
    // pos:     posición (x, y) actual de cada película (y del centro)
    const offsets = new Map<number, number>();
    const angulos = new Map<number, number>();
    const pos = new Map<number, Punto>([[ID_CENTRO, { x: CENTERX, y: CENTERY }]]);

    // Reparte las películas de un anillo a ángulos uniformes, siguiendo el orden
    // actual de orden[nivel] y el giro offsets[nivel]. Actualiza angulos y pos.
    const colocarAnillo = (nivel: number) => {
        const ids = orden.get(nivel)!;
        const radio = radios.get(nivel)!;
        const paso = DOS_PI / (ids.length || 1);
        const off = offsets.get(nivel) ?? 0;

        ids.forEach((id, i) => {
            const a = off + paso * i;
            angulos.set(id, normalizar(a));
            pos.set(id, {
                x: CENTERX + radio * Math.cos(a),
                y: CENTERY + radio * Math.sin(a)
            });
        });
    };

    // Colocación inicial: cada anillo con un giro distinto
    for (const nivel of niveles) {
        offsets.set(nivel, nivel * DESFASE_ANGULAR);
        colocarAnillo(nivel);
    }


    /* ------------------ Fase 1: ordenado por baricentro --------------------- */

    // Cada película "quiere" estar en el ángulo medio de sus vecinas.
    // Se ordena cada anillo según ese ángulo y se gira para encajar con los
    // anillos vecinos. Se alterna el sentido (hacia fuera / hacia dentro) para
    // que los ajustes se propaguen en ambas direcciones.
    for (let pasada = 0; pasada < PASADAS_BARICENTRO; pasada++) {
        const haciaAfuera = pasada % 2 === 0;
        const recorrido = haciaAfuera ? niveles : [...niveles].reverse();

        for (const nivel of recorrido) {
            // Al ir hacia fuera, las semillas se dejan como están (son el ancla)
            if (haciaAfuera && nivel === primerNivel) continue;

            const ids = orden.get(nivel)!;
            if (ids.length < 2) continue;

            // Ángulo preferido de cada película
            const preferido = new Map<number, { angulo: number; conVecinos: boolean }>();
            for (const id of ids) {
                const todos = [...(vecinos.get(id) ?? [])];

                // Hacia fuera: se guía por vecinas de niveles interiores.
                // Hacia dentro: se guía por vecinas de niveles exteriores.
                const preferentes = todos.filter(v =>
                    haciaAfuera ? nivelDe.get(v)! < nivel : nivelDe.get(v)! > nivel
                );
                // Si no tiene vecinas en esa dirección, usa todas las que tenga
                const usar = preferentes.length > 0 ? preferentes : todos;

                preferido.set(id, usar.length > 0
                    ? { angulo: promedioCircular(usar.map(v => angulos.get(v)!)), conVecinos: true }
                    : { angulo: angulos.get(id)!, conVecinos: false }); // sin vecinas: conserva su sitio
            }

            // Se ordena el anillo por ángulo preferido
            ids.sort((a, b) => preferido.get(a)!.angulo - preferido.get(b)!.angulo);

            // Giro óptimo del anillo: promedio de la diferencia entre el ángulo
            // preferido de cada película y el ángulo uniforme que le toca.
            const paso = DOS_PI / ids.length;
            const difs: number[] = [];
            ids.forEach((id, i) => {
                const p = preferido.get(id)!;
                if (p.conVecinos) difs.push(p.angulo - paso * i);
            });
            if (difs.length > 0) offsets.set(nivel, promedioCircular(difs));

            colocarAnillo(nivel);
        }
    }


    /* ------------- Fase 2: refinado midiendo cruces reales ------------------ */

    // true si los segmentos e1 y e2 se cruzan con las posiciones actuales
    const seCruzan = (e1: [number, number], e2: [number, number]) => {
        // Aristas que comparten un nodo no cuentan como cruce
        if (e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) return false;

        const p1 = pos.get(e1[0])!, p2 = pos.get(e1[1])!;
        const p3 = pos.get(e2[0])!, p4 = pos.get(e2[1])!;

        // Se cruzan si cada segmento deja los extremos del otro en lados opuestos
        return orient(p3, p4, p1) * orient(p3, p4, p2) < 0 &&
               orient(p1, p2, p3) * orient(p1, p2, p4) < 0;
    };

    // Coste (cruces + longitud total) de las aristas que tocan a los nodos dados.
    // Solo se miden esas porque son las únicas que cambian al mover estos nodos.
    const costo = (ids: number[]): Costo => {
        const indices = new Set<number>();
        for (const id of ids) for (const e of aristasDe.get(id) ?? []) indices.add(e);

        let cruces = 0;
        let longitud = 0;
        for (const i of indices) {
            const arista = exigirDefinido(aristas[i], "Arista no encontrada");
            const [a, b] = arista;
        
            const pa = pos.get(a)!;
            const pb = pos.get(b)!;
        
            longitud += Math.hypot(pa.x - pb.x, pa.y - pb.y);
        
            // Solo se compara con las aristas que podrían cruzarse con ella
            for (const j of exigirDefinido(candidatas[i], "Lista de candidatas no encontrada")) {
                const otraArista = exigirDefinido(aristas[j], "Arista candidata no encontrada");
        
                if (seCruzan(arista, otraArista)) cruces++;
            }
        }
        return { cruces, longitud };
    };

    const inicioRefinado = Date.now();
    const sinTiempo = () => Date.now() - inicioRefinado > TIEMPO_MAX_MS;

    refinado:
    for (let ronda = 0; ronda < PASADAS_REFINADO; ronda++) {
        let huboMejora = false;

        for (const nivel of niveles) {
            // Presupuesto de tiempo agotado: se termina con lo conseguido hasta ahora
            if (sinTiempo()) break refinado;

            const ids = orden.get(nivel)!;
            const n = ids.length;
            if (n < 2) continue;

            // a) Probar rotaciones del anillo completo y quedarse con la que
            //    tenga menos cruces (o aristas más cortas si empatan).
            //    En anillos grandes se prueban solo MAX_ROTACIONES giros
            //    repartidos por todo el anillo, no todos.
            const base = [...ids];
            let mejorCosto = costo(base);
            let mejorShift = 0;
            const saltoShift = Math.max(1, Math.ceil(n / MAX_ROTACIONES));

            for (let k = saltoShift; k < n; k += saltoShift) {
                for (let i = 0; i < n; i++) {
                    ids[i] = exigirDefinido(
                        base[(i + k) % n],
                        "Película no encontrada durante la rotación"
                    );
                }
            
                colocarAnillo(nivel);
            
                const c = costo(base);
                if (esMejor(c, mejorCosto)) {
                    mejorCosto = c;
                    mejorShift = k;
                }
            }
            
            // Aplicar la mejor rotación encontrada
            for (let i = 0; i < n; i++) {
                ids[i] = exigirDefinido(
                    base[(i + mejorShift) % n],
                    "Película no encontrada al aplicar la rotación"
                );
            }
            colocarAnillo(nivel);
            if (mejorShift !== 0) huboMejora = true;

            // b) Intercambiar películas contiguas del anillo; el intercambio
            //    solo se conserva si mejora el coste.
            if (n < 3) continue;
            for (let i = 0; i < n; i++) {
                if (sinTiempo()) break refinado;

                const j = (i + 1) % n;

                const idI = exigirDefinido(ids[i], "Película no encontrada en el intercambio");
                const idJ = exigirDefinido(ids[j], "Película no encontrada en el intercambio");
                
                const afectados = [idI, idJ];
                const antes = costo(afectados);
                
                // Intercambiar
                ids[i] = idJ;
                ids[j] = idI;
                
                colocarAnillo(nivel);
                
                if (esMejor(costo(afectados), antes)) {
                    huboMejora = true;
                } else {
                    // No mejora: se deshace el intercambio
                    ids[i] = idI;
                    ids[j] = idJ;
                
                    colocarAnillo(nivel);
                }
            }
        }

        // Si una ronda completa no mejora nada, no tiene sentido seguir
        if (!huboMejora) break;
    }


    /* ----------------------------- Resultado -------------------------------- */

    // Se devuelve cada película con su nivel y su posición final
    const peliculasConPosicion: PeliculaPosicion[] = [];
    for (const nivel of niveles) {
        for (const idObra of orden.get(nivel)!) {
            const obra = datosObra.get(idObra);
            const p = pos.get(idObra);
            if (!obra || !p) continue;

            peliculasConPosicion.push({ ...obra, nivel, pos_x: p.x, pos_y: p.y });
        }
    }
    return peliculasConPosicion;
}