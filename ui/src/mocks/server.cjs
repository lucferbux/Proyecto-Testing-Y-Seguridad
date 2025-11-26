const { setupServer } = require('msw/node');
const { handlers } = require('./handlers.cjs');

// Creamos el server con todos los handlers
const server = setupServer(...handlers);

module.exports = { server };

// También exportamos http y HttpResponse para override en tests
module.exports.http = require('msw').http;
module.exports.HttpResponse = require('msw').HttpResponse;
