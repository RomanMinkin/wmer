wmer
====

Payment client for [wmer.ru](wmer.ru)

### Installation

```bash
$ npm wmer express --save
```

### Usage
```js
var Wmer = require('wmer'),
    wmer = new Wmer({
            login   : 'account login',
            password: 'account apassword',
            key     : 'API key',
            proxy   : 'http://proxy' // optional for test and scalability purpose
        });

wmer.rate('WMR', 'account_rur', 100).then(function(result) {
    console.log(result);
    // { rates:
    //    { error: '0',
    //      result_currency: 'account_rur',
    //      result_cnt: '100.00',
    //      date: '2014-08-23 06:39:03',
    //      ratelist: { rate: [Object] }
    //     }
    // }
});
```

### API
Client's methods return [Bluebird](https://github.com/petkaantonov/bluebird) Promises.

#### .merchant()
has not implemented yet

#### .currency()
Getting currencies list
```javascript
    wmer.currency().then(function(result) {
        console.log(result);
        // { currencylist:
        //     {
        //         currecy: [
        //             { code: '24au_rur', name: '24au рубли' },
        //             { code: 'account_rur', name: 'Account RUR' },
        //             { code: 'astron_rur', name: 'Астрон рубли' },
        //             { code: 'atllantv_rur', name: 'Атлантик рубли' },
        //             { code: 'atllan_rur', name: 'Атлантик рубли' },
        //             { code: 'averstelecom_rur', name: 'Аверс-Телеком рубли' },
        //             { code: 'cablecity_rur', name: 'CableCity рубли' },
        //             { code: 'cifromig_rur', name: 'Цифромиг рубли' }
        //             ...
        //         ]
        //     }
        // }
    });
```

#### .rate(sourceCurrency, resultCurrency, resultCount)
Getting current rate for exchange
```javascript
wmer.rate('WMR', 'account_rur', 100).then(function(result) {
    console.log(result);
    // { rates:
    //    { error: '0',
    //      result_currency: 'account_rur',
    //      result_cnt: '100.00',
    //      date: '2014-08-23 06:39:03',
    //      ratelist: { rate: [Object] }
    //     }
    // }
});
```

#### .rpistateop(orderId, operationPassworMD5)
Getting payment iperation state

#### .balance()
Getting account balance

#### .getProviderByPhone(phone)
Get mobile Provider Id By Phone number, undocumented API method

#### .operation(orderId, currency, purse, amount, description)
Send Payment Interface (Интерфейс отправки платежа). Sending money to client account.

#### .operationMobile(orderId, phone, amount, description)
Shortcut method for `.opration()` method for mobile payment operation. Does automatic lookup for providerId

### Testing
For testing you need to run test form production envirement or set up simple proxy server, because [wmer.ru](wmer.ru) requires to specify static IP for API calls. I created simple node.js based proxy server https://github.com/RomanMinkin/simple-proxy-server, feel free to use it.

Before testig you you need to create config file in the root folderon this project `.config.json`:
```javascript
{
    "login"   : "account login",
    "password": "account password",
    "key"     : "AIP service key",
    "proxy"   : "http:proxy-url"
}
```

Run tests
```bash
npm test
```


