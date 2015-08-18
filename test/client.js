var expect = require('chai').expect,
    $url = require('url'),
    BASE_URL = 'http://localhost:3004/',
    error = require('../lib/error'),
    Client = require('../lib/client');

describe('synccloud-configration-client', function() {
	describe('fetch', function() {
        var configUrl = $url.resolve(BASE_URL, '/config/test-service/master@production'),
            expectedConfig = {
                backend: 'http://google.com'
            };

		it('should fetch config with a given url', function(done) {
			Client()
                .fetch(configUrl)
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    console.log('DFSF');
                    done();
                }, done)
                .catch(done);
		});

        it('should initialize with an url and fetch without arguments', function(done) {
            Client({url: configUrl})
                .fetch()
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done)
                .catch(done);
        });

        it('should fetch by specifying service parameters not full url', function(done) {
            Client({url: BASE_URL})
                .fetch({service: 'test-service', version: 'master', env: 'production'})
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done)
                .catch(done);
        });

        it('should fail with bad_url', function(done) {
            //check for error code matching
            expect(function() { Client().fetch(); }).to.throw(error);
        	expect(function() { Client().fetch({service: 'a'}); }).to.throw(error);
        	expect(function() { Client().fetch({env: 'a'}); }).to.throw(error);
        	expect(function() { Client().fetch({version: 'a'}); }).to.throw(error);
        	expect(function() { Client().fetch({service: 'a', env: 'b', version: 'c'}); }).to.throw(error);
            done();
        });
	});

    describe('heartbeat', function() {
    	it('should heartbeat without error', function(done) {
            Client()
                .heartbeat($url.resolve(BASE_URL, '/heartbeat'), {name: 'some-service', pid: 512})
                .then(function () {
                    done();
                })
    	});
    });
});