// sync-packages.js
const fs = require("fs");
const path = require("path");

const rootPackagePath = path.join(__dirname, "../../", "package.json");

const subPackagePath = path.join(__dirname, "..", "package.json");

const mergePackages = () => {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
  const subPackage = JSON.parse(fs.readFileSync(subPackagePath, "utf8"));

  // Merge dependencies
  rootPackage.dependencies = {
    ...rootPackage.dependencies,
    ...subPackage.dependencies,
  };

  // Write back to the root package.json
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
};

module.exports = { mergePackages };
