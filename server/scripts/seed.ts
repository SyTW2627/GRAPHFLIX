import { SQL } from "bun";
import { parse } from "csv-parse/sync"

const CSV_PATH = process.env.CSV_PATH ?? `${import.meta.dir}/../data/peliculasDataset.csv`

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/graphflix";

const sql = new SQL(DATABASE_URL)

// utilidades 

type Row = Record<string, string>;

function clean(v?: string) {
    const t = v?.trim();
    return t ? t : null;
}

function num(v?: string) {
    const t = clean(v);
    if (t === null) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function list(v?: string) {
    return [ ...new Set((v ?? "").split("|").map((s) => s.trim()).filter(Boolean))];
}

function sagaName(v?: string) {
    const t = clean(v);
    return t ? t.replace(/\s*-\s*Colección$/i, "").trim() : null;
}

function withID(names: string[]) {
    return new Map(names.map((n, i) => [n, i+1]))
}

function* chunks<T>(arr: T[], size = 1000) {
  for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size);
}

// lectrua

const raw: Row[] = parse(await Bun.file(CSV_PATH).text(), {columns: true, skip_empty_lines: true, bom: true, trim: true})

const rows = raw.filter((r) => num(r.tmdbId) !== null && clean(r.title));
console.log(`CSV: ${raw.length} filas leídas, ${rows.length} válidas`);

// ingesta

await sql.begin(async (texto) => {

    // protecciond e duplicados
    const [{n}] = await texto`SELECT count(*)::int AS n FROM obra`;
    if (n > 0) {
       if (!process.env.RESET) {
            throw new Error(
            `La tabla obra ya tiene ${n} filas. Usa RESET=1 para recargar ` +
            `(borra también favorita y nodo por el ON DELETE CASCADE).`,
        );
       }
    await texto`TRUNCATE obra, persona, genero, saga RESTART IDENTITY CASCADE`;
    console.log("Tablas vaciadas (RESET=1)");
    }

    // obra

    const obras = rows.map((r, i) => {
        const year = num(r.year);
        return {
        id_obra: i + 1,
        titulo: clean(r.title)!,
        ano_publicacion: year === null ? null : Math.trunc(year),
        descripcion: clean(r.synopsis),
        imagen_url: clean(r.poster_url),
        };
    });
    for (const c of chunks(obras)) await texto`INSERT INTO obra ${texto(c)}`;

    // catalogo
    const generoId = withID([...new Set(rows.flatMap((r) => list(r.genres)))]);
    const personaId = withID([ ...new Set(rows.flatMap((r) => [...list(r.director), ...list(r.cast)])),]);
    const sagaId = withID([ ...new Set(rows.map((r) => sagaName(r.collection)).filter(Boolean)),] as string[]);
    
    const toRows = <K extends string>(m: Map<string, number>, idCol: K) =>
        [...m].map(([nombre, id]) => ({ [idCol]: id, nombre }));
    
    for (const c of chunks(toRows(generoId, "id_genero"))) await texto`INSERT INTO genero ${texto(c)}`;
    for (const c of chunks(toRows(personaId, "id_persona"), 5000)) await texto`INSERT INTO persona ${texto(c)}`;
    for (const c of chunks(toRows(sagaId, "id_saga"))) await texto`INSERT INTO saga ${texto(c)}`;
        
    // tablas intermedias
    const generoObra: { id_genero: number; id_obra: number }[] = [];
    const personaObra: { id_persona: number; id_obra: number; tipo: string }[] = [];
    const sagaObra: { id_saga: number; id_obra: number }[] = [];
    
    rows.forEach((r, i) => {
        const id_obra = i + 1;
        for (const g of list(r.genres)) generoObra.push({ id_genero: generoId.get(g)!, id_obra });
        for (const p of list(r.director)) personaObra.push({ id_persona: personaId.get(p)!, id_obra, tipo: "director" });
        for (const p of list(r.cast)) personaObra.push({ id_persona: personaId.get(p)!, id_obra, tipo: "actor" });
        const s = sagaName(r.collection);
        if (s) sagaObra.push({ id_saga: sagaId.get(s)!, id_obra });
    });
    
    for (const c of chunks(generoObra, 5000)) await texto`INSERT INTO genero_obra ${texto(c)}`;
    for (const c of chunks(personaObra, 10000)) await texto`INSERT INTO persona_obra ${texto(c)}`;
    for (const c of chunks(sagaObra, 5000)) await texto`INSERT INTO saga_obra ${texto(c)}`;

    // ids
    await texto`SELECT setval(pg_get_serial_sequence('obra','id_obra'), (SELECT max(id_obra) FROM obra))`;
    await texto`SELECT setval(pg_get_serial_sequence('persona','id_persona'), (SELECT max(id_persona) FROM persona))`;
    await texto`SELECT setval(pg_get_serial_sequence('genero','id_genero'), (SELECT max(id_genero) FROM genero))`;
    await texto`SELECT setval(pg_get_serial_sequence('saga','id_saga'), (SELECT max(id_saga) FROM saga))`;
    
    console.log(
        `obra: ${obras.length} | géneros: ${generoId.size} | personas: ${personaId.size} | sagas: ${sagaId.size}\n` +
        `genero_obra: ${generoObra.length} | persona_obra: ${personaObra.length} | saga_obra: ${sagaObra.length}`,
    );


});

await sql.close();
console.log("Ingesta completada");

