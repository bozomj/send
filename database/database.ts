import { Client, Pool } from "pg";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.development" });
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === "production" ? true : false,
  });

  await client.connect();
  return client;
}

async function getTransationClient() {
  const client = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 20, // Número máximo de conexões no pool
    idleTimeoutMillis: 30000, // Fecha conexões inativas após 30 segundos
    connectionTimeoutMillis: 2000, // Tempo limite para conseguir uma conexão
  });

  await client.connect();
  return client;
}

async function query(sql: string, params: any[] = []): Promise<any> {
  let client;
  try {
    client = await getNewClient();

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    throw {
      message: "Erro ao executar query",
      cause: error,
    };
  } finally {
    client?.end();
  }
}

const database = {
  query,
  getNewClient,
  getTransationClient,
};

export default database;
