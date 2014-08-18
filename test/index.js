'use strict';

var Lab = require('lab');
var Hapi = require('hapi');
var Boom = require('boom');
var Sinon = require('sinon');
var Bunyan = require('bunyan');

var lab = exports.lab = Lab.script();

lab.experiment('Logging plugin', function () {
    var suite = {};

    lab.before(function (done) {
        suite.request = { method: 'GET' };
        suite.server = Hapi.createServer();
        suite.server.pack.register({
            plugin: require('../'),
            options: {
                logger: {
                    name: 'api',
                    level: 'fatal'
                }
            }
        }, function () {
            suite.server.route([
                {
                    path: '/warning',
                    method: 'GET',
                    handler: function (request, reply) {
                        return reply(Boom.badRequest());
                    }
                },
                {
                    path: '/error',
                    method: 'GET',
                    handler: function (request, reply) {
                        return reply(Boom.internal());
                    }
                },
                {
                    path: '/success',
                    method: 'GET',
                    handler: function (request, reply) {
                        return reply();
                    }
                },
                {
                    path: '/redirect',
                    method: 'GET',
                    handler: function (request, reply) {
                        return reply().redirect();
                    }
                }
            ]);

            done();
        });
    });

    lab.test('Logs message with "warning" level for 400 ranged errors', function (done) {
        suite.request.url = '/warning';
        suite.spies = [Sinon.spy(Bunyan.prototype, 'warn')];

        suite.server.inject(suite.request, function (response) {
            Lab.expect(response.statusCode).to.equal(400);
            Lab.expect(suite.spies[0].calledOnce).to.equal(true);

            Bunyan.prototype.warn.restore();

            done();
        });
    });

    lab.test('Logs message with "error" level for 500 ranged errors', function (done) {
        suite.request.url = '/error';
        suite.spies = [Sinon.spy(Bunyan.prototype, 'error')];

        suite.server.inject(suite.request, function (response) {
            Lab.expect(response.statusCode).to.equal(500);
            Lab.expect(suite.spies[0].calledOnce).to.equal(true);

            Bunyan.prototype.error.restore();

            done();
        });
    });

    lab.test('Does not log when there is no error or warning', function (done) {
        suite.request.url = '/success';
        suite.spies = [
            Sinon.spy(Bunyan.prototype, 'warn'),
            Sinon.spy(Bunyan.prototype, 'error')
        ];

        suite.server.inject(suite.request, function (response) {
            Lab.expect(response.statusCode).to.equal(200);

            for (var spy in suite.spies) {
                Lab.expect(suite.spies[spy].callCount).to.equal(0);
            }

            Bunyan.prototype.warn.restore();
            Bunyan.prototype.error.restore();

            done();
        });
    });
});
