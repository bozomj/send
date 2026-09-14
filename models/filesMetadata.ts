import database from "@/database/database";

async function upload(data: FilesMetadataType, client: any) {
  return await runQuery();

  async function runQuery() {
    const query = `
        INSERT INTO files_metadata 
          (file_id, ip_address, user_agent) 
        VALUES
         ($1, $2, $3)
         RETURNING *`;

    if (client) {
      const metadata = await client.query(query, [
        data.file_id,
        data.ip_address,
        data.user_agent,
      ]);
      return metadata.rows[0];
    } else {
      const metadata = await database.query(query, [
        data.file_id,
        data.ip_address,
        data.user_agent,
      ]);
      return metadata[0];
    }
  }
}

const filesMetadata = {
  upload,
};

export default filesMetadata;

type FilesMetadataType = {
  id?: number;
  file_id: string;
  ip_address?: string | string[];
  user_agent: string;
  created_at?: string;
};
