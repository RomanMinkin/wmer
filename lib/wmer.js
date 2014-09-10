'use strict';

var util     = require('util'),
    crypto   = require('crypto'),
    debug    = require('debug')('wmer'),
    Promise  = require('bluebird'),
    parseXML = Promise.promisify(require('xml2js').parseString),
    request  = Promise.promisify(require('request').post),
    Iconv    = require('iconv').Iconv,
    conv     = new Iconv('windows-1251', 'utf-8')
;

/**
 * md5 helper forsignature creating
 *
 * @param  {String} string Plain string
 * @return {String}        md5 hex hash string
 */
function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

/**
 * Helper function for cleaning phone number from non-digit character
 * @param  {String} phone Pone number, ex '123-456-54-21'
 * @return {String}       Sinitized string
 */
function sanitizePhone(phone) {
    return phone.toString().replace(/\D/g, '');
}

/**
 * AIP call helper
 * @param  {String} url  WMer's API end-point
 * @param  {Object} data Form data to send
 * @return {Promise}     Result promise
 */
function call(url, data) {
    var config = {
        url     : url,
        form    : data,
        encoding: 'binary',
    }

    debug(config);

    return request( config )
        .spread(function (res, body) {
            body = new Buffer(body, 'binary');
            body = conv.convert(body).toString();

            return parseXML(body, {trim: true, explicitArray: false});
        })
        .then(function (data) {
            debug(data);

            if (data.spi && data.spi.error && parseInt(data.spi.error, 10) !== 0) {
                var error = new Error(data.spi.errormsg)
                error.code = data.spi.error;

                throw error;
            } else {
                return data;
            }
        });
}

/**
 * WmerClient Class
 *
 * @param {Object} config Config object
 */
function WmerClient(config) {
    /*jshint validthis:true */

    if (!config.login) {
        throw new Error('WmerClient - config.login is required');

    } else if (!config.password) {
        throw new Error('WmerClient - config.password is required');

    } else if (!config.key) {
        throw new Error('WmerClient - config.key is required');

    } else {
        this.baseUrl    = config.proxy ? config.proxy : 'https://www.wmer.ru/';
        this.login      = config.login;
        this.password   = md5(config.password);
        this.key        = config.key;

        this.setEndPoint = function(path) {
            var url = (this.baseUrl + '/ru/' + path).toString().replace(/([^:])(\/)+/g, '$1/');
            debug(url);
            return url;
        };

        config.password = null;
    }

}

/**
 * [merchant description]
 *
 *     SYSTEM_NAME=sSystemName&
 *     PAYMENT_USERNAME=sPaymentUsername&
 *     PAYMENT_ORDER_ID=nPaymentOrderId&
 *     PAYMENT_AMOUNT=nPaymentAmount&
 *     PAYMENT_DESCRIPTION=sPaymentDescription&
 *     RESULT_URL=sResultUrl&
 *     SUCCESS_URL=sSuccessUrl&
 *     FAIL_URL=sFailUrl&
 *     SIGN=sSIGN

 * @return {Promise} [description]
 */
WmerClient.prototype.merchant = function(systemName, paymentUsername, paymentOrderId, paymentAmount, paymentDescription, resultUrl, successUrl, failUrl) {
    var self = this,
        url  = self.setEndPoint('moneypool,merchant');

    return new Promise(function(){
        throw new Error('Mothod #merchant is not implemented yet!');
    });
}
/**
 * Getting currencies list
 * @return {Promise}
 */
WmerClient.prototype.currency = function() {
    var self = this,
        url  = self.setEndPoint('moneypool,dyn,currency');

    return call(url);
}

/**
 * Getting current rate for exchange
 * @return {Promise}
 */
WmerClient.prototype.rate = function(sourceCurrency, resultCurrency, resultCount) {
    var self = this,
        url  = self.setEndPoint('moneypool,dyn,rate'),
        data = '<rates>' +
                   '<source_currency>%s</source_currency>' +
                   '<result_currency>%s</result_currency>' +
                   '<result_cnt>%s</result_cnt>' +
               '</rates>'
    ;

   data = util.format(data, sourceCurrency, resultCurrency, resultCount);

    return call(url, data);
}

/**
 * Getting payment iperation state
 * @param  {[type]} orderId             [description]
 * @param  {[type]} operationPassworMD5 [description]
 * @return {[type]}                     [description]
 */
WmerClient.prototype.rpistateop = function(orderId, operationPassworMD5) {
    var self = this,
        url  = self.setEndPoint('moneypool,dyn,rpistateop'),
        data = '<stateop>' +
                   '<login>%s</login>' +
                   '<orderid>%s</orderid>' +
                   '<sign>%s</sign>' +
               '</stateop>',
       sign  = md5( [self.login, orderId, operationPassworMD5].join('::') ) // sLogin::nOrderId::md5(пароль платежа)
    ;

    data = util.format(data, self.login, orderId, sign);

    return call(url, data);
}

/**
 * Getting account balance
 * @return {Promise} { error: '0', errormsg: '', balance: '980.39' }
 */
WmerClient.prototype.balance = function() {
    var self = this,
        url  = self.setEndPoint('moneypool,dyn,api,balance');

    return call(url, {
        username: self.login,
        key     : self.key,
        SIGN    : md5( [self.login, self.key].join('::') )
    });
}

/**
 * Get mobile Provider Id By Phone number
 *
 * @param  {String}     phone  11 digits of phone number like '79171234567'
 * @return {Promise}    { providerId: '1', regionId: '77', isPorted: 'false' }
 */
WmerClient.prototype.getProviderByPhone = function(phone) {
    var self  = this,
        url   = self.setEndPoint('moneypool,dyn,api,getproviderbyphone')
    ;

    phone = sanitizePhone(phone);

    return call(url, {
        username: self.login,
        key     : self.key,
        phone   : phone,
        SIGN    : md5( [self.login, self.key, phone].join('::') )
    });
}

/**
 * Send Payment Interface (Интерфейс отправки платежа)
 * Sending money to client account
 *
 * @param  {Number} orderId     Order ID in your store, should be Integer only
 * @param  {String} currency    Currency type or mobile carrier type, ex. 'WMZ', 'osmp_1' => 'MTC'
 * @param  {String} purse       Payee's ID or payee's mobile phone number
 * @param  {Number} amount      Sum to pay
 * @param  {String} description Payment description [optional]
 * @return {Promise}
 */
WmerClient.prototype.operation = function(orderId, currency, purse, amount, description) {
    var self = this,
        url  = self.setEndPoint('moneypool,dyn,api,operation');

    return call(url, {
        username   : self.login,
        key        : self.key,
        order_id   : orderId,
        d_currency : currency,
        d_purse    : purse,
        d_amount   : amount,
        description: description,
        SIGN    : md5( [
            self.login, // sUserName::
            self.key,   // sAuthKey::
            orderId,    // nOrderId::
            currency,   // sResultCurrency::
            purse,      // sResultPurse::
            amount,     // nAmount::
            description // sDescription
        ].join('::') )
    });
}

/**
 * Shortcut method for @opration method for mobile payment operation
 * Does automatic lookup for providerId
 *
 * @param  {Number} orderId     Order ID in your store, should be Integer only
 * @param  {String} phone       11 digits of phone number like '79171234567'
 * @param  {Number} amount      Sum to pay
 * @param  {String} description Payment description [optional]
 * @return {Promise}
 */
WmerClient.prototype.operationMobile = function(orderId, phone, amount, description) {
    var self = this,
        mobileOperatorsPreffix = 'osmp_'
    ;

    phone = sanitizePhone(phone);

    return self.getProviderByPhone(phone)
        .then(function (res) {
            if (!res.spi && !res.spi.providerId) {
                throw new Error('Can not detect `res.spi.providerId` for phone number \'' + phone + '\'');

            } else {
                return res.spi.providerId;
            }
        })
        .then(function (providerId) {
            return self.operation(
                orderId,
                mobileOperatorsPreffix + providerId,
                phone,
                amount,
                description
            );
        });
}

exports = module.exports = WmerClient;