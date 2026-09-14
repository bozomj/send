import database from "@/database/database";

async function cleanFiles() {
  await database.query("TRUNCATE TABLE files RESTART IDENTITY CASCADE;");
}

async function cleanFilesMetadata() {
  await database.query(
    "TRUNCATE TABLE files_metadata RESTART IDENTITY CASCADE;",
  );
}

const orchestrator = {
  cleanFiles,
  cleanFilesMetadata,
};

export default orchestrator;
