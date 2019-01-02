#!/usr/bin/env node

(function() {
  const path = require("path");
  const fs = require("fs");
  const express = require("express");
  const basicAuth = require("express-basic-auth");
  const app = express();
  const compression = require("compression");

  // CLI arguments
  const port = process.env.PORT || 3000;
  const cobranding = process.env.COBRANDING || "hubstairs";
  const environment = process.env.ENVIRONMENT || "local";
  const rootDir = process.env.ROOTDIR || "";
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const ONE_DAY_IN_SECONDS = 86400000; // 60 * 60 * 24 * 1000
  const cache = parseInt(process.env.CACHE || ONE_DAY_IN_SECONDS, 10);

  const cobrandingDir = path.resolve("cobranding", cobranding);
  const buildDir = path.resolve("build");
  const publicDir = path.resolve("public");
  
  const staticDir = path.join(buildDir, "static");
  const commonsDir = path.join(buildDir, "commons");

  const packageJSONPath = path.resolve("package.json");
  const assetManifestPath = path.join(buildDir, "asset-manifest.json");
  const placeholdersPath = path.join(cobrandingDir, "placeholders.json");

  const assets = require(assetManifestPath);
  const mainUri = assets["main.js"];
  const runtimeUri = assets["runtime~main.js"];
  const version = require(packageJSONPath).version;
  const placeholders = require(placeholdersPath);

  const PARTIALS = ["headStart", "headEnd", "bodyStart", "bodyEnd"];
  const partials = {};

  PARTIALS.forEach(name => {
    const partialFile = path.join(cobrandingDir, "views", `${name}.ejs`);
    partials[name] = fs.existsSync(partialFile);
  });

  app.disable("x-powered-by");

  app.set("view engine", "ejs");
  app.set("views", [publicDir, cobrandingDir]);

  app.use(compression());

  app.use(
    `${rootDir}/static`,
    express.static(staticDir, {
      maxAge: cache,
      setHeaders: res => {
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'SAMEORIGIN');
      } 
    })
  );

  app.use(
    `${rootDir}/commons`,
    express.static(commonsDir, {
      maxAge: cache,
      setHeaders: res => {
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'SAMEORIGIN');
      } 
    })
  );

  app.use(
    `${rootDir}/`,
    express.static(cobrandingDir, {
      maxAge: cache,
      setHeaders: res => {
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'SAMEORIGIN');
      } 
    })
  );

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
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'SAMEORIGIN');
      res.render("index", {
        mainUri,
        runtimeUri,
        environment,
        partials,
        rootDir,
        version,
        ...placeholders
      });
    } catch (e) {
      res.status(500).send(e);
    }
  });

  app.listen(port, () => {
    console.log(`app listening on port : ${port}`);
    console.log(`app cobranding : ${cobranding}`);
  });
})();
