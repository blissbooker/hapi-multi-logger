'use strict';

var Boom = require('boom');
var Bunyan = require('bunyan');

exports = module.exports = {};

var internals = {};

internals.extract = function (error) {
    return (error.message ? '(' + error.message + ')' : null);
};

internals.toString = function (request) {
    var cause, effect, response;

    response = request.response;
    cause = [request.method.toUpperCase(), request.path].join(' ');
    effect = [response.statusCode, internals.extract(response.source)].join(',');

    return [cause, effect].join('=>');
};

internals.wrap = function (request, error) {
    return {
        request: request,
        error: error
    };
};

internals.addInternalLogListener = function (server, logger) {
    server.on('internalError', function (request, err) {
        server.log(['error'], err.message);
        logger.error(internals.wrap(request.id, err), 'Internal server error.');
    });
};

internals.addDeveloperLogListener = function (server, logger) {
    var code, error;

    server.on('response', function (request) {
        code = request.response.statusCode;
        error = request.response.source;

        if (code >= 400 && code < 500) {
            request.log(['warning'], internals.toString(request));
            logger.warn(internals.wrap(request.id, error), 'Unexpected response.');
        } else if (code >= 500) {
            request.log(['error'], internals.toString(request));
            logger.error(internals.wrap(request.id, error), 'Error response.');
        }
    });
};

exports.register = function (plugin, options, next) {
    var logger;

    if (!options.logger) {
        return next(Boom.notFound('Logger configuration not provided.'));
    }

    logger = Bunyan.createLogger(options.logger);

    plugin.servers.forEach(function (server, index) {
        internals.addInternalLogListener(server, logger);
        internals.addDeveloperLogListener(server, logger);

        if (index === plugin.servers.length - 1) {
            next();
        }
    });
};

exports.register.attributes = {
    name: 'logger',
    version: '0.0.1'
};