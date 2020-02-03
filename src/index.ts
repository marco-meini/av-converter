import * as commander from "commander";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import * as ProgressBar from "progress";

commander
  .version(require("../package.json").version)
  .option("-d, --dir <s>", "root directory")
  .option("-o, --output <s>", "output format")
  .parse(process.argv);

var filesToProcess: string[] = [];

const processFile = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    let destinationPath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}.${commander.output}`
    );
    exec(`ffmpeg -i ${filePath} ${destinationPath}`, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const scanDir = async (dir: string) => {
  try {
    let items = await fs.promises.opendir(dir);
    for await (let item of items) {
      let itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        await scanDir(itemPath);
      } else {
        filesToProcess.push(itemPath);
      }
    }
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

(async () => {
  try {
    await scanDir(commander.dir);
    let bar = new ProgressBar(":bar :percent of :total", {
      total: filesToProcess.length
    });
    for (let file of filesToProcess) {
      await processFile(file);
      bar.tick();
    }
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit();
  }
})();
