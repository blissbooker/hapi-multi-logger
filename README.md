# hapi-multi-logger

Hapi.js plugin for basic server-side logging.


## How to use

The plugin uses [Bunyan](//github.com/trentm/node-bunyan) for external logging, so when loading the it in the server, you need to provide the proper buyan configuration profile using the plugin options object like so:

```javascript
var server = Hapi.createServer(1337);

server.pack.register([
    {
        plugin: require('hapi-multi-logger'),
        options: {
            logger: {
                name: '<project_name>',
                level: 'fata|error|warn|info|debug|trace',
                // Log to a file [optional]
                path: '/var/log/<namespace>/<project_name>.log'
            }
        }
    },

    // more plugins you might have
]);
```

It also uses the internal logging system for the same purpose which allows to use modules like [Good](//github.com/hapijs/good) for better server monitoring.