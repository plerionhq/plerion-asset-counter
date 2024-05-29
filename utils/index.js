import { exec } from "child_process";

export const execCommand = async (cmd, parseJson) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
        return;
      }
      try {
        resolve(parseJson ? JSON.parse(stdout) : stdout);
      } catch (error) {
        reject(error);
      }
    });
  });
};
