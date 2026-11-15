import { inspectRepository } from "../src/repository.mjs";
try {
  console.log(
    JSON.stringify(inspectRepository(process.argv[2] ?? "."), null, 2),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
