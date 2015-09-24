var expect = require('chai').expect,
    $url = require('url'),
    BASE_URL = 'http://localhost:3004/',
    error = require('../lib/error'),
    Client = require('../lib/client');

describe.skip('synccloud-configration-client', function() {
	describe('fetch', function() {
        var configUrl = $url.resolve(BASE_URL, '/config/test-service/master@production'),
            expectedConfig = {
                backend: 'http://google.com'
            };

        it('should initialize with an url and fetch without arguments', function(done) {
            Client({url: configUrl})
                .fetch()
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done)
                .catch(done);
        });

        it('should fail if cannot obtain config by timeout', function(done) {
            done(); //todo
        });

        it('should connect to same socket', function(done) {
            var c = Client({url: configUrl});
            c.connect().then(function (s1) {
                c.connect().then(function (s2) {
                    expect(s1).to.equal(s2);
                    done();
                });
            })
        });

	});

    describe('parse config url', function() {
    	it('should parse', function(done) {
            var url = $url.resolve(BASE_URL, '/config/test-service/master@production');
    		var configInfo = Client.prototype.parseConfigUrl(url);
            expect(configInfo).to.have.property('baseUrl', BASE_URL);
            expect(configInfo).to.have.property('service', 'test-service');
            expect(configInfo).to.have.property('version', 'master');
            expect(configInfo).to.have.property('env', 'production');
            done();
        });
    });
});