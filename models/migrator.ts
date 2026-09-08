import database from "@/database/database";
import { runner } from "node-pg-migrate";

import { resolve } from "path";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra/migrations"),
  direction: "up" as const,
  migrationsTable: "pgmigrations",
  log: () => {},
  noLock: true,
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await runner({
      ...defaultMigrationOptions,
      dbClient,
    });

    return pendingMigrations;
  } catch (error) {
    throw {
      message: "Erro ao buscar migrações pendentes",
      cause: error,
    };
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const runMigrations = await runner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return runMigrations;
  } catch (error) {
    throw {
      message: "Erro ao executar migrações pendentes",
      cause: error,
    };
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
