'use strict';

require('should');

var path       = require('path'),
    WmerClient = require('../lib/wmer.js'),
    config     = require(path.join(__dirname, '../', '.config.json'))
;

describe('wmerClient', function() {
    var wmerClient;

    before(function() {
        wmerClient = new WmerClient({
            login   : config.login,
            password: config.password,
            key     : config.key,
            proxy   : config.proxy
        });
    });

    describe('.merchant()', function() {
        it('should throw an error', function (done) {
            wmerClient.merchant()
                .done(done, function (reason) {
                    reason.should.be.instanceof(Error);
                    reason.message.should.be.equal('Mothod #merchant is not implemented yet!');
                    done();
                }, done);
        });
    });

    describe('.currency()', function() {
        it('should return list of currently available currencies', function (done) {
            wmerClient.currency()
                .done(function (res) {
                    res.currencylist.currecy.should.be.instanceOf(Array);
                    res.currencylist.currecy.length.should.be.greaterThan(0);
                    done();
                }, done);
        });
    });

    describe('.rate()', function() {
        it('should return current rates', function (done) {
            wmerClient.rate('WMR', 'account_rur', 100)
                .done(function (res) {
                    res.rates.should.be.instanceOf(Object);
                    res.rates.error.should.be.equal('0');
                    res.rates.result_cnt.should.be.equal('100.00');
                    done();
                }, done);
        });
    });

    describe('.rpistateop()', function() {
        it('should return -4 for unexisting operationId', function (done) {
            var orderId             = 123,
                operationPassworMD5 = '456'
            ;

            wmerClient.rpistateop(orderId, operationPassworMD5)
                .done(function (res) {
                    res.stateop.error.should.be.equal('-4');
                    done();
                }, done);
        });
    });

    describe('.balance()', function() {
        it('should return balance grater than 1', function (done) {
            wmerClient.balance()
                .done(function (res) {
                    res.spi.balance.should.be.greaterThan(1);
                    done();
                }, done);
        });
    });

    describe('.getProviderByPhone(phone)', function() {
        it('should return provider name by phone number', function (done) {
            wmerClient.getProviderByPhone('79175275517')
                .done(function (res) {
                    res.spi.providerId.should.be.equal('1');
                    res.spi.regionId.should.be.equal('77');
                    done();
                }, done);
        });
    });

    describe('.operation(orderId, phone, amount, description)', function() {
        /*
            To prevent money spending through actual payment
            catching error to low balance
         */
        it('should return provider name by phone number', function (done) {
            wmerClient.operation('12', 'osmp_1', '7-917-586-6693', 1.0, 'test payment')
                .done(done, function (reason) {
                    reason.code.should.be.equal('-10');
                    reason.message.should.be.equal('Сумма платежа слишком мала. Минимальная сумма платежа 10 рублей');
                    done();
                });
        });
    });
});