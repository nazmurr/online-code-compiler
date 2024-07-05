const express = require("express");
const { exec } = require("child_process");
const { writeFileSync, unlinkSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from public directory

app.post("/compile", (req, res) => {
  const { language, code } = req.body;
  compileCode(language, code, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(400).send({ output: `Error: ${stderr}` });
    }
    res.send({ output: stdout });
  });
});

function compileCode(language, code, callback) {
  let filePath;
  let command;

  switch (language) {
    case "python":
      filePath = join(tmpdir(), "tempCode.py");
      command = `python ${filePath}`;
      break;
    case "javascript":
      filePath = join(tmpdir(), "tempCode.js");
      command = `node ${filePath}`;
      break;
    case "php":
      filePath = join(tmpdir(), "tempCode.php");
      command = `php ${filePath}`;
      break;
    case "java":
      filePath = join(tmpdir(), "TempCode.java");
      const className = "TempCode";
      command = `javac ${filePath} && java -cp ${tmpdir()} ${className}`;
      break;
    default:
      return callback(
        new Error("Unsupported language"),
        null,
        "Unsupported language"
      );
  }

  writeFileSync(filePath, code, "utf8");

  exec(command, (error, stdout, stderr) => {
    unlinkSync(filePath); // Clean up the file after execution
    if (language === "java") {
      const classFilePath = join(tmpdir(), "TempCode.class");
      if (require("fs").existsSync(classFilePath)) {
        unlinkSync(classFilePath);
      }
    }
    callback(error, stdout, stderr);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
