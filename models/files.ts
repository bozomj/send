import database from "@/database/database";

async function upload(filekey: string, client?: any) {
  return await runQuery();

  async function runQuery() {
    const query = `
        INSERT INTO files 
          ( "fileKey") 
        VALUES
         ($1)
         RETURNING *`;

    if (client) {
      const fileInfo = await client.query(query, [filekey]);
      return fileInfo.rows[0];
    } else {
      const fileInfo = await database.query(query, [filekey]);
      return fileInfo[0];
    }
  }
}
async function del(filekey: string, client: any = null) {
  return await runQuery();

  async function runQuery() {
    const query = `
  DELETE FROM files 
  WHERE "fileKey" = $1
  RETURNING *`;

    if (client) {
      const fileInfo = await client.query(query, [filekey]);
      return fileInfo.rows[0];
    } else {
      const fileInfo = await database.query(query, [filekey]);
      return fileInfo[0];
    }
  }
}

async function get(filekey: string, client: any = null) {
  return await runQuery();

  async function runQuery() {
    const query = `
    SELECT * 
    FROM files 
    WHERE "fileKey" = $1 
    AND status = 'ativo' 
    AND expires_at > CURRENT_TIMESTAMP;
  `;

    if (client) {
      const fileInfo = await client.query(query, [filekey]);
      return fileInfo.rows?.[0] || null;
    } else {
      const fileInfo = await database.query(query, [filekey]);
      return fileInfo?.[0] || null;
    }
  }
}

async function ativar(filekey: string, client: any = null) {
  return await runQuery();

  async function runQuery() {
    const query = `
    UPDATE files 
      SET status = 'ativo' 
      WHERE "fileKey" = $1 AND status = 'pending'
      RETURNING *;
  `;

    if (client) {
      const fileInfo = await client.query(query, [filekey]);
      return fileInfo.rows?.[0] || null;
    } else {
      const fileInfo = await database.query(query, [filekey]);
      return fileInfo?.[0] || null;
    }
  }
}

const filesInfo = {
  upload,
  ativar,
  get,
  del,
};

export default filesInfo;

type FilesInfoType = {
  id: number;

  fileKey: string;

  createdAt: string;

  updated_at: string;

  expires_at: string;

  status: string;
};
