/**
 * Client that connects to configuration service
 * @type {Client}
 */

module.exports = Client;

var log = require('./log')('synccloud:configuration-client'),
    $url = require('url'),
    http = require('http'),
    uuid = require('node-uuid'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require('lodash'),
    FETCH_TIMEOUT = 20000,
    error = require('./error');

function Client(options) {
    if (!(this instanceof Client)) {
        return new Client(options)
    }

    EventEmitter.call(this);

    options = options || {};

    if (!options.url) {
        throw new Error('url to configuration expected: `http://(host:port)/config/(service-name)/(version)@(environment)`')
    }
    this.url = options.url;
    this.config = this.parseConfigUrl(options.url);
}

util.inherits(Client, EventEmitter);

Client.prototype.connect = function () {
    this._connected = this._connected || new Promise(function (resolve, reject) {
        if (this.socket) {
            resolve(this.socket);
            return;
        }

        this.socket = require('socket.io-client')($url.resolve(this.config.baseUrl, 'services'));
        this.socket.on('restart', function () {
            this.emit('restart');
        }.bind(this));

        resolve(this.socket);
    }.bind(this));

    return this._connected;
};

Client.prototype.getClientConfig = function () {
    return new Promise(function (resolve, reject) {
        if (this.clientConfig) {
            resolve(this.clientConfig);
        } else {
            this.fetch({service: 'config-client', version: 'master', env: 'production'})
                .then(function (conf) {
                    this.clientConfig = conf;
                    resolve(conf);
                }.bind(this), reject);
        }
    }.bind(this))
};

Client.prototype.heartbeat = function (data) {
    var interval,
        serviceId = getServiceIdentifier();

    this.getClientConfig()
        .then(function (clientConfig) {
            this.connect().then(function (socket) {
                interval = setInterval(function () {
                    log('sending heartbeat #' + serviceId);
                    socket.emit(clientConfig.heartbeat.path, _.assign({id: serviceId, service: this.config.service, env: this.config.env, version: this.config.version}, data));
                }.bind(this), clientConfig.heartbeat.interval);
            }.bind(this));
        }.bind(this));

    return this;
};

/**
 * Fetch configuration from
 * @returns {Promise}
 */
Client.prototype.fetch = function (options) {
    var configOptions = options || this.config,
        timeout;
    return new Promise(function (resolve, reject) {
        timeout = setTimeout(function () {
            reject(new Error('cannot fetch config due timeout ' + FETCH_TIMEOUT + 'ms'));
        }, FETCH_TIMEOUT);

        this.connect().then(function (socket) {
            log('fetching ' + JSON.stringify(configOptions));
            socket.emit('config', configOptions, function (config) {
                clearTimeout(timeout);
                if (config) {
                    log('receive config: ', config);
                    resolve(config);
                } else {
                    reject(new Error('received empty config for ' + JSON.stringify(configOptions)))
                }
            }.bind(this));
        }.bind(this)).catch(reject);
    }.bind(this));
};

Client.prototype.parseConfigUrl = function (url) {
    var re = /([^\/]+)\/([^\/]+)@(.*)$/,
        urlInfo = $url.parse(url),
        match = url.match(re);

    return {
        baseUrl: urlInfo.protocol + '//' + urlInfo.hostname + (urlInfo.port ? ':' + urlInfo.port : '') + '/',
        service: match[1],
        version: match[2],
        env: match[3]
    }
};

function getServiceIdentifier() {
    var fs = require('fs'),
        path = require('path'),
        idFile = path.join(__dirname, '.service-id'),
        id;

    if (fs.existsSync(idFile)) {
        id = fs.readFileSync(idFile, 'utf8');
    } else {
        id = uuid.v4();
        fs.writeFileSync(idFile, id);
    }
    return id;
}