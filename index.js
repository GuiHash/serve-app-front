#!/usr/bin/env node

(function() {
  const path = require("path");
  const fs = require("fs");
  const express = require("express");
  const basicAuth = require("express-basic-auth");
  const app = express();
  const compression = require("compression");
  const morgan = require("morgan");
  const ms = require("ms");

  // CLI arguments
  const port = process.env.PORT || 3000;
  const environment = process.env.ENVIRONMENT || "local";
  const cobrandingRoot = process.env.COBRANDING_ROOT || "hubstairs";
  const cobrandingLocale = process.env.COBRANDING_LOCALE || "fr-FR";
  const rootDir = process.env.ROOTDIR || "";
  const rootDirApp = process.env.ROOTDIR_APP || rootDir;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const ONE_DAY_IN_SECONDS = ms("1 year");
  const cache = Number(process.env.CACHE || ONE_DAY_IN_SECONDS);

  const buildCobrandingDir = path.resolve(
    "build-cobranding",
    cobrandingRoot,
    cobrandingLocale
  );

  const viewsDir = path.resolve(
    "build-views",
    cobrandingRoot,
    cobrandingLocale
  );

  const buildDir = path.resolve("build");

  const packageJSONPath = path.resolve("package.json");
  const assetManifestPath = path.join(buildDir, "asset-manifest.json");
  const placeholdersPath = path.join(viewsDir, "placeholders.json");

  const assets = require(assetManifestPath);
  const mainUri = assets["main.js"];
  const version = require(packageJSONPath).version;
  const placeholders = require(placeholdersPath);

  const PARTIALS = ["headStart", "headEnd", "bodyStart", "bodyEnd"];
  const partials = {};

  PARTIALS.forEach(name => {
    const partialFile = path.join(viewsDir, `${name}.ejs`);
    if (fs.existsSync(partialFile)) {
      partials[name] = partialFile;
    }
  });

  app.use(
    morgan(
      ":date[iso] :method :url :status :res[content-length] - :response-time ms"
    )
  );
  app.disable("x-powered-by");

  app.set("view engine", "ejs");
  app.set("views", [viewsDir]);

  app.use(compression());

  const staticConfig = {
    maxAge: cache,
    setHeaders: res => {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("X-Frame-Options", "SAMEORIGIN");
    }
  };

  app.use(`${rootDir}/`, express.static(buildCobrandingDir, staticConfig));
  app.use(`${rootDir}/`, express.static(buildDir, staticConfig));

  if (username && username !== "null" && password && password !== "null") {
    app.use(
      basicAuth({
        users: {
          [username]: password
        },
        challenge: true
      })
    );
  }

  app.get("*", (req, res) => {
    try {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("X-Frame-Options", "SAMEORIGIN");
      res.render("index", {
        mainUri,
        environment,
        partials,
        rootDir: rootDirApp,
        version,
        ...placeholders
      });
    } catch (e) {
      res.status(500).send(e);
    }
  });

  app.listen(port, () => {
    console.log(`app listening on port : ${port}`);
    console.log(
      `app cobranding root : ${cobrandingRoot}, locale: ${cobrandingLocale}`
    );
  });
})();
