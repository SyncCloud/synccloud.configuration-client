/**
 * Client that connects to configuration service
 * @type {Client}
 */

module.exports = Client;

var log = require('./log')('synccloud:configuration-client'),
    $url = require('url'),
    error = require('./error');

function Client(options) {
    if (!(this instanceof Client)) {
        return new Client(options)
    }

    if (options) {
        this._url = options.url;
    }
}

/**
 * Fetch configuration from
 * @returns {Promise}
 */
Client.prototype.fetch = function (url) {
    if (!url) {
        url = this._url;
    }

    if (!url) {
        throw error('bad_url', 'Missing url to config');
    }

    if (typeof url === 'object') {
        if (!this._url) {
            throw error('bad_url', 'Missing base url to configuration manager service')
        }
        if (!url.service || !url.version || !url.env) {
            throw error('bad_url', 'All 3 parameters(service, version, env) must be specified')
        }
        url = $url.resolve(this._url, '/config/' + url.service + '/' + url.version + '@' + url.env);
    }

    return new Promise(function (resolve, reject) {
        require('http').get(url, function (res) {
            log.out('Receiving configuration from ' + url);

            var chunks = [], length = 0;

            res.on('data', function (chunk) {
                chunks.push(chunk);
                length += chunk.length;
            });

            res.on('end', function () {
                log.out('Parsing configuration');

                var bytes, data;
                if (res.statusCode === 200) {
                    try {
                        bytes = Buffer.concat(chunks, length);
                        data = JSON.parse(bytes);
                        log.out('Configuration OK:', JSON.stringify(data, null, 4));
                    }
                    catch (err) {
                        log.trace('Error parsing configuration data:', err);
                        var json = bytes.toString('utf8');
                        log.err('Configuration text:', json);
                        reject(error('parse_error', 'Failed to parse json text: ' + json).wrap(err));
                    }
                    resolve(data);
                }
                else {
                    try {
                        bytes = Buffer.concat(chunks, length);
                        data = bytes.toString('utf8');
                        log.trace('HTTP error (' + res.statusCode + ' ' + res.statusMessage + '):', '\n' + data);
                    }
                    catch (err){
                        log.trace('HTTP error (' + res.statusCode + ' ' + res.statusMessage + '):', err);
                    }

                    reject(error('http_error', 'Request to ' + url + ' failed with code ' + res.statusCode + ' ' + res.statusMessage));
                }
            });

            res.on('error', function (err) {
                log.trace('HTTP error (' + res.statusCode + ' ' + res.statusMessage + '):', err);
                reject(error('http_error', 'Request to ' + url + ' failed with code ' + res.statusCode + ' ' + res.statusMessage).wrap(err));
            });
        });
    }.bind(this));
};

Client.prototype.heartbeat = function (url, data) {
    if (!url) {
        url = this._url;
        data = url;
    }

    if (!url) {
        throw error('bad_url', 'Missing url to config');
    }



    return new Promise(function (resolve, reject) {
        var chunks = [], length = 0;

        var postData = require('querystring').stringify(data);
        var parsedUrl = $url.parse(url);

        var req = require('http').request({
            host: parsedUrl.hostname,
            port: parsedUrl.port || 80,
            path: parsedUrl.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        }, function (res) {

            res.on('data', function (chunk) {
                chunks.push(chunk);
                length += chunk.length;
            });

            res.on('end', function () {
                log.out('Parsing configuration');

                if (res.statusCode === 200) {
                    resolve();
                }
                else {
                    reject(error('http_error', 'Request to ' + url + ' failed with code ' + res.statusCode + ' ' + res.statusMessage));
                }
            });

            res.on('error', function (err) {
                log.trace('HTTP error (' + res.statusCode + ' ' + res.statusMessage + '):', err);
                reject(error('http_error', 'Request to ' + url + ' failed with code ' + res.statusCode + ' ' + res.statusMessage).wrap(err));
            });
        });

        req.write(postData);
        req.end();
    });

};
