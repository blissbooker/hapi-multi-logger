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
    return { request: request, error: error };
};

internals.addErrorListener = function (server, logger) {
    server.on('internalError', function (request, err) {
        server.log(['error'], err.message);
        logger.error(internals.wrap(request.id, err), 'Internal server error.');
    });
};

internals.addWarningListener = function (server, logger) {
    var code, error;

    server.on('response', function (request) {
        code = request.response.statusCode;
        error = request.response.source;

        if (code >= 400 && code < 500) {
            request.log(['warning'], internals.toString(request));
            logger.warn(internals.wrap(request.id, error), 'Unexpected response.');
        }
    });
};

exports.register = function (plugin, options, next) {
    var logger, ref;

    if (!options.logger) {
        return next(Boom.notFound('Logger configuration not provided.'));
    }

    logger = Bunyan.createLogger(options.logger);

    for (ref in plugin.servers) {
        internals.addErrorListener(plugin.servers[ref], logger);
        internals.addWarningListener(plugin.servers[ref], logger);
    }

    next();
};

exports.register.attributes = {
    name: 'logger',
    version: '0.0.1'
};