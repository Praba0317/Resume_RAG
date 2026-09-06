import path from "node:path";
import { ResumeIngestionService } from "../src/modules/ingestion/services/ResumeIngestionService";

const directory = path.resolve(process.argv[2] ?? path.join(process.cwd(), "Resumes"));
const batchSize = Number(process.argv[3] ?? 10);

async function main(): Promise<void> {
  const result = await new ResumeIngestionService().ingestDirectory(directory, batchSize);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});