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
  const cache = parseInt(process.env.CACHE || 86400, 10);

  // define directories
  const cwd = process.cwd();
  const cobrandingDir = path.join(process.cwd(), "cobranding", cobranding);
  const buildDir = path.join(process.cwd(), "build");
  const publicDir = path.join(process.cwd(), "public");

  // main.js uri
  const mainUri = require(`${buildDir}/asset-manifest`)["main.js"];

  // version
  const version = require(path.join(cwd, "package.json")).version;

  // placeholders
  const placeholders = require(`${cobrandingDir}/placeholders.json`);

  // partials
  const PARTIALS = ["headStart", "headEnd", "bodyStart", "bodyEnd"];
  const partials = {
    headStart: false,
    headEnd: false,
    bodyStart: false,
    bodyEnd: false
  };

  PARTIALS.forEach(name => {
    const partial = path.join(buildDir, "views", `${name}.ejs`);
    if (fs.existsSync(partial)) {
      partials[name] = true;
    }
  });

  app.disable("x-powered-by");

  app.set("view engine", "ejs");
  app.set("views", buildDir);

  app.use(compression());

  app.use(
    `${rootDir}/static`,
    express.static(`${buildDir}/static`, {
      maxage: cache
    })
  );

  app.use(
    `${rootDir}/`,
    express.static(cobrandingDir, {
      maxage: cache
    })
  );

  if (username && password) {
    app.use(
      basicAuth({
        users: {[username]: password},
        challenge: true
      })
    );
  }

  app.get("*", (req, res) => {
    try {
      res.render("index", {
        mainUri,
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
