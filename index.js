#!/usr/bin/env node

(function () {
    const path = require('path')
    const fs = require('fs')
    const express = require('express')
    const app = express()

    // CLI arguments
    const port = process.env.PORT || 3000
    const cobranding = process.env.COBRANDING || 'hubstairs'
    const environment = process.env.ENVIRONMENT || 'local'
    const rootDir = process.env.ROOTDIR || ''

    // define directories
    const cwd = process.cwd()
    const cobrandingDir = path.join(process.cwd(), 'cobranding', cobranding)
    const buildDir = path.join(process.cwd(), 'build')
    const publicDir = path.join(process.cwd(), 'public')

    // main.js uri
    const mainUri = require(`${buildDir}/asset-manifest`)['main.js']

    // placeholders
    const placeholders = require(`${cobrandingDir}/placeholders.json`)

    // partials
    const PARTIALS = ['headStart', 'headEnd', 'bodyStart', 'bodyEnd']
    const partials = {
        headStart: false,
        headEnd: false,
        bodyStart: false,
        bodyEnd: false,
    }

    PARTIALS.forEach(name => {
        const partial = path.join(buildDir, 'views', `${name}.ejs`)
        if (fs.existsSync(partial)) {
            partials[name] = true
        }
    })

    app.set('view engine', 'ejs')
    app.set('views', buildDir)

    app.use('/static', express.static(`${buildDir}/static`))
    app.use('/', express.static(cobrandingDir))

    app.get('*', (req, res) => {
        try {
            res.render('index', {
                mainUri,
                environment,
                partials,
                rootDir,
                ...placeholders,
            });
        }
        catch (e) {
            res.status(500).send(e)
        }
    })

    app.listen(port, () => {
        console.log(`app listening on port : ${port}`)
        console.log(`app cobranding : ${cobranding}`)
    })

})()