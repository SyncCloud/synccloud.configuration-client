var expect = require('chai').expect,
    $url = require('url'),
    BASE_URL = 'http://synccloud-config.elasticbeanstalk.com/',
    error = require('../lib/error'),
    Client = require('../lib/client');

describe('synccloud-configration-client', function() {
	describe('fetch', function() {
        var configUrl = $url.resolve(BASE_URL, '/config/unknown-service/master@test'),
            expectedConfig = {
                backend: 'http://google.com'
            };

		it('should fetch config with a given url', function(done) {
			Client()
                .fetch(configUrl)
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done);
		});

        it('should initialize with an url and fetch without arguments', function(done) {
            Client({url: configUrl})
                .fetch()
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done);
        });

        it('should fetch by specifying service parameters not full url', function(done) {
            Client({url: BASE_URL})
                .fetch({service: 'unknown-service', version: 'master', env: 'test'})
                .then(function (config) {
                    expect(config).to.deep.equal(expectedConfig);
                    done();
                }, done);
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
});