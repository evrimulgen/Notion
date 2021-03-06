sysPath = require 'path'

exports.config =
    # See http://brunch.io/#documentation for documentation.
    modules:
        wrapper: false
    files:
        javascripts:
            joinTo:
                'javascripts/app.js': /^app/
                'javascripts/vendor.js': /^vendor/
                'test/javascripts/test-vendor.js': /^test(\/|\\)(?=vendor)/

            order:
                before: [
                    'vendor/scripts/console-polyfill.js'
                    'vendor/scripts/jquery-2.0.2.js'
                    'vendor/scripts/handlebars-1.0.0.js'
                    'vendor/scripts/ember-1.1.2.js'
                    'vendor/scripts/moment.js'
                    'vendor/scripts/showdown.js'
                ]

        stylesheets:
            joinTo:
                'stylesheets/app.css': /^(app|vendor)/
            order:
                before: ['vendor/styles/bootstrap.css']

        templates:
            precompile: true
            root: 'templates'
            joinTo: 'javascripts/app.js' : /^app/
            defaultExtension: 'hbs'

            modules:
                addSourceURLs: true

    # allow _ prefixed templates so partials work
    conventions:
        ignored: (path) ->
            startsWith = (string, substring) ->
                string.indexOf(substring, 0) is 0
            sep = sysPath.sep
            if path.indexOf("app#{sep}templates#{sep}") is 0
                false
            else
                startsWith sysPath.basename(path), '_'
