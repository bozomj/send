import migrator from "@/models/migrator";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);
export default router.handler();

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const migrations = await migrator.listPendingMigrations();
  return res.status(200).json({ migrations });
}
