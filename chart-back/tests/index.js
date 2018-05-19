const config = require('config');
const {server, mongoose} = require('../app');
const langError = require('../lang/errors');
const langSuc = require('../lang/success');
// const request = require('request-promise').defaults({
//     encoding: null,
//     resolveWithFullResponse: true
// });
const request = require('request-promise');
const User = require('../models/user');
const DataType = require('../models/dataType');
const assert = require('assert');
// const seed = require('../seed/index');

describe('RESTapi chart', () => {
    let app,
    user = {
        username: 'cvaize',
        email: 'cvaize@gmail.com',
        password: '123HGhu1$%',
        token: ''
    },
    types = [
        {
            name: 'Ток',
            login: 'current'
        },
        {
            name: 'Влажность',
            login: 'wetness'
        },
        {
            name: 'Напряжение',
            login: 'voltage'
        },
    ],
    host = config.get('URI') || 'http://localhost:3000';
    before(function() {
        mongoose.connect(config.mongoose.uri);
        app = server.listen(config.port);
        // seed.init();
    });
    after(function () {
        mongoose.connection.close();
        app.close();
    });
    context('Users', function () {

        it('Remove all collection', async function() {
            await User.remove({});
            await DataType.remove({});
        });
        context('Check registration', function () {
            let options = {
                method: 'POST',
                uri: host+'/registration',
                simple: false,
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;

            it('Check empty fields', async function() {
                results = await request(options);
                assert.equal(results.errorMessages.email, langError["E-mail empty"]);
                assert.equal(results.errorMessages.username, langError["username empty"]);
            });

            it('Check empty Email', async function() {
                options.body.username = user.username;
                results = await request(options);
                assert.equal(results.errorMessages.email, langError["E-mail empty"]);
            });

            it('Check empty Username', async function() {
                options.body.username = '';
                options.body.email = user.email;
                results = await request(options);
                assert.equal(results.errorMessages.username, langError["username empty"]);
            });

            it('Check on correct Email', async function() {
                options.body.username = user.username;
                options.body.email = 'cvaize';
                results = await request(options);
                assert.equal(results.errorMessages.email, langError["Please specify a valid email address."]);
            });

            it('Check corrected Email', async function() {
                options.body.username = user.username;
                options.body.email = user.email;
                results = await request(options);
                assert.equal(results.errorMessages.password, langError["The password no current"]);
            });

            it('Check on correct Password', async function() {
                options.body.username = user.username;
                options.body.email = user.email;
                options.body.password = "12";
                results = await request(options);
                assert.equal(results.errorMessages.password, langError["The password no current"]);

                options.body.username = user.username;
                options.body.email = user.email;
                options.body.password = "12sSFSdg";
                results = await request(options);
                assert.equal(results.errorMessages.password, langError["The password no current"]);
            });

            it('Check corrected registration data', async function() {
                options.body.username = user.username;
                options.body.email = user.email;
                options.body.password = user.password;
                results = await request(options);
                assert.equal(results.successMessages.registration, langSuc["Registration was successful!"]);
            });

            it('Check double account', async function() {
                options.body.username = user.username;
                options.body.email = user.email;
                options.body.password = user.password;
                results = await request(options);
                assert.equal(results.errorMessages.email, langError["Two users cannot use the same Email."]);
            });
        });
        context('Check login', function () {
            let options = {
                method: 'POST',
                uri: host+'/login',
                simple: false,
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Check empty data', async function() {
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Email or password is not correct"]);
            });
            it('Check empty password', async function() {
                options.body.email = user.email;
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Email or password is not correct"]);
            });
            it('Check no corrected data', async function() {
                options.body.email = user.email;
                options.body.password = '2152535';
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Email or password is not correct"]);
            });
            it('Check corrected data', async function() {
                options.body.email = user.email;
                options.body.password = user.password;
                results = await request(options);
                user.token = results.token;
            });
        });
        context('Check authentication', function () {
            let options = {
                method: 'GET',
                uri: host+'/',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Token empty', async function() {
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Login failed, please log in."]);
            });
            it('Token no correct', async function() {
                options.body.token = '25236';
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Login failed, please log in."]);
            });
            it('Token correct', async function() {
                options.headers.Authorization = user.token;
                results = await request(options);
                assert.equal(results.user.username, user.username);
                assert.equal(results.user.email, user.email);
                user.token = results.token;
            });
            it('Generate new token', async function() {
                options.headers.Authorization = user.token;
                results = await request(options);
                assert.equal(results.user.username, user.username);
                assert.equal(results.user.email, user.email);
                user.token = results.token;
            });

            // TODO: Дописать удаление и изменение аккаунта

        });
    });
    context('Data Types', function () {
        it('Check GET First request Data Types', async function () {
            let options = {
                method: 'GET',
                uri: host+'/types',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            results = await request(options);
            assert.equal(results.errorMessages.login, langError["Login failed, please log in."]);

            options.headers.Authorization = user.token;
            results = await request(options);
            assert.equal(results.message.dataType, langSuc["Data types have not been created yet!"]);
            user.token = results.token;
        });
        context('Data Types STORE', function () {
            let options = {
                method: 'POST',
                uri: host+'/types',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Not authorized user', async function () {
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["Login failed, please log in."]);
            });
            it('Empty fields', async function () {
                options.headers.Authorization = user.token;
                results = await request(options);
                assert.equal(results.errorMessages.name, langError["Enter a name for the data type."]);
                assert.equal(results.errorMessages.login, langError["Specify the Login of the data type."]);
            });
            it('Not correct login language', async function () {
                options.body.Authorization = user.token;
                options.body.name = types[0].name;
                options.body.login = 'угашп';
                results = await request(options);
                assert.equal(results.errorMessages.login, langError["The login must be only Latin letters."]);
            });
            it('Corrected data save', async function () {
                options.body.Authorization = user.token;
                options.body.name = types[0].name;
                options.body.login = types[0].login;
                results = await request(options);
                assert.equal(results.type.login, types[0].login);
                assert.equal(results.type.name, types[0].name);
                user.token = results.token;
            });
            it('Corrected double data save', async function () {
                options.body.Authorization = user.token;
                options.body.name = types[0].name;
                options.body.login = types[0].login;
                results = await request(options);
                assert.equal(results.message.dataType, langError["This data type login already exists"]);
                user.token = results.token;
            });
            it('Save +2 new data type', async function () {
                options.body.Authorization = user.token;
                options.body.name = types[1].name;
                options.body.login = types[1].login;
                results = await request(options);
                assert.equal(results.type.login, types[1].login);
                assert.equal(results.type.name, types[1].name);
                user.token = results.token;

                options.body.Authorization = user.token;
                options.body.name = types[2].name;
                options.body.login = types[2].login;
                results = await request(options);
                assert.equal(results.type.login, types[2].login);
                assert.equal(results.type.name, types[2].name);
                user.token = results.token;
            });
        });
        context('Data Types GET', function () {
            let options = {
                method: 'GET',
                uri: host+'/types',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('GET All DataType', async function () {
                options.headers.Authorization = user.token;
                results = await request(options);
                user.token = results.token;
                assert.equal(typeof(results.dataTypes), 'object');
            });
        });
        context('Data Types UPDATE', function () {
            let options = {
                method: 'PUT',
                uri: host+'/types',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('The data type change: empty fields', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.uri = host+'/types/'+types[0].login;
                results = await request(options);
                assert.equal(results.type.login, types[0].login);
                assert.equal(results.type.name, types[0].name);
                user.token = results.token;
            });
            it('The data type change: field name', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.name = 'Ток Updated';
                options.uri = host+'/types/'+types[0].login;
                results = await request(options);
                assert.equal(results.type.login, types[0].login);
                assert.equal(results.type.name, 'Ток Updated');
                user.token = results.token;
            });
            it('The data type change: field login', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.login = 'current2';
                options.uri = host+'/types/'+types[0].login;
                results = await request(options);
                user.token = results.token;
            });
            it('The verification of the change by repeating the login', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.login = 'wetness';
                options.uri = host+'/types/'+types[0].login;
                results = await request(options);
                assert.equal(results.message.dataType, langSuc["You have already created such a login."]);
                user.token = results.token;
            });
        });
        context('Data Types REMOVE', function () {
            let options = {
                method: 'DELETE',
                uri: host+'/types',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Deleting data types by logins.', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.uri = host+'/types';
                options.body.types = ["current2", "wetness"];
                results = await request(options);
                user.token = results.token;
            });
            it('Attempt to delete nonexistent items', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.uri = host+'/types';
                options.body.types = ["current2", "wetness"];
                results = await request(options);
                user.token = results.token;
            });
            //TODO: Добавить рекурсивное удаление всех данных связанных с данным типом данных
        });
    });
    context('Data', function () {
        it('The first data acquisition when there is no data', async function () {
            await request({
                method: 'DELETE',
                uri: host+'/types',
                simple: false,
                headers: {
                    Authorization: user.token
                },
                body: {
                    Authorization: user.token,
                    types: ["voltage"]
                },
                json: true // Automatically stringifies the body to JSON
            });

            let options = {
                method: 'GET',
                uri: host+'/data',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            options.headers.Authorization = user.token;
            options.body.Authorization = user.token;
            options.body.types = [types[0].login, types[1].login, types[2].login];
            results = await request(options);
            user.token = results.token;

            await request({
                method: 'POST',
                uri: host+'/types',
                simple: false,
                headers: {
                    Authorization: user.token
                },
                body: {
                    Authorization: user.token,
                    login: types[2].login,
                    name: types[2].name,
                },
                json: true // Automatically stringifies the body to JSON
            });
        });
        context('Data POST', function () {
            let options = {
                method: 'POST',
                uri: host+'/data',
                simple: false,
                headers: {},
                body: {},
                resolveWithFullResponse: true,
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Add the correct data', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[2].login] = [
                    { value: 1241, time: new Date() },
                    { value: 141, time: new Date() },
                    { value: 124 },
                ];
                results = await request(options);
                assert.equal(results.statusCode, 200);
                user.token = results.body.token;
            });
            it('Adding data without specifying time', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[2].login] = [
                    { value: 1241 },
                    { value: 141 },
                    { value: 124 },
                    { value: 124 },
                ];
                results = await request(options);
                assert.equal(results.statusCode, 200);
                user.token = results.body.token;
            });
            it('Validation adding data: no value', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[2].login] = [
                    { },
                    { value: 141 },
                    { value: 124 },
                    { value: 124 },
                ];
                results = await request(options);
                assert.equal(!!results.body.errorMessages, true);
            });
            it('Add a data set consisting of 10 values for each of the 3 data types', async function () {

                let optionsPOST = {
                    method: 'POST',
                    uri: host+'/types',
                    simple: false,
                    headers: {},
                    body: {},
                    json: true // Automatically stringifies the body to JSON
                };
                let resultPOST;
                optionsPOST.headers.Authorization = user.token;
                optionsPOST.body.Authorization = user.token;
                optionsPOST.body.name = types[0].name;
                optionsPOST.body.login = types[0].login;
                resultPOST = await request(optionsPOST);
                user.token = resultPOST.token;

                optionsPOST.headers.Authorization = user.token;
                optionsPOST.body.Authorization = user.token;
                optionsPOST.body.name = types[1].name;
                optionsPOST.body.login = types[1].login;
                resultPOST = await request(optionsPOST);
                user.token = resultPOST.token;

                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[0].login] = [
                    { value: 1 },
                    { value: 2 },
                    { value: 3 },
                    { value: 4 },
                    { value: 5 },
                    { value: 6 },
                    { value: 7 },
                    { value: 8 },
                    { value: 9 },
                    { value: 10 },
                ];
                results = await request(options);
                assert.equal(results.statusCode, 200);
                user.token = results.body.token;

                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[1].login] = [
                    { value: 1, time: new Date(2018, 1, 1, 1, 10) },
                    { value: 2, time: new Date(2018, 2, 2, 1, 10) },
                    { value: 3, time: new Date(2018, 2, 3, 1, 10) },
                    { value: 4, time: new Date(2018, 2, 4, 1, 10) },
                    { value: 5, time: new Date(2018, 2, 5, 1, 10) },
                    { value: 6, time: new Date(2018, 2, 6, 1, 10) },
                    { value: 7, time: new Date(2018, 3, 7, 1, 10) },
                    { value: 8, time: new Date(2018, 4, 8, 1, 10) },
                    { value: 9, time: new Date(2018, 5, 9, 1, 10) },
                    { value: 10, time: new Date(2018, 8, 10, 1, 10) },
                ];
                results = await request(options);
                assert.equal(results.statusCode, 200);
                user.token = results.body.token;

                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.data = {};
                options.body.data[types[2].login] = [
                    { value: 1, time: new Date(2018, 1, 1, 1, 10) },
                    { value: 2, time: new Date(2018, 2, 2, 1, 10) },
                    { value: 3, time: new Date(2018, 2, 3, 1, 10) },
                    { value: 4, time: new Date(2018, 2, 4, 1, 10) },
                    { value: 5, time: new Date(2018, 2, 5, 1, 10) },
                    { value: 6, time: new Date(2018, 2, 6, 1, 10) },
                    { value: 7, time: new Date(2018, 3, 7, 1, 10) },
                    { value: 8, time: new Date(2018, 4, 8, 1, 10) },
                    { value: 9, time: new Date(2018, 5, 9, 1, 10) },
                    { value: 10, time: new Date(2018, 8, 10, 1, 10) },
                ];
                results = await request(options);
                assert.equal(results.statusCode, 200);
                user.token = results.body.token;
            });
        });
        context('Data GET', function () {
            let options = {
                method: 'GET',
                uri: host+'/data',
                simple: false,
                headers: {},
                body: {},
                json: true // Automatically stringifies the body to JSON
            };
            let results;
            it('Получение набора данных без указания границы времени и выборкой из 5 элементов', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.types = [types[0].login, types[1].login, types[2].login];
                options.body.length = 5;
                results = await request(options);
                // console.log(results.dataTypes);
                // assert.equal(!!results.dataTypes[0].data, true);
                user.token = results.token;
            });
            it('Получение набора данных с указанием левой и правой границы времени', async function () {
                options.headers.Authorization = user.token;
                options.body.Authorization = user.token;
                options.body.types = [types[0].login, types[1].login, types[2].login];
                options.body.length = 100;
                options.body.start = new Date(2018, 4, 7, 1, 10);
                options.body.end = new Date(2018, 6, 7, 1, 10);
                results = await request(options);
                // console.log(results.dataTypes);
                // assert.equal(!!results.dataTypes[1].data, true);
                user.token = results.token;
            });
            // it('Получение набора данных с указанием правой границы времени', async function () {
            //
            // });
            // it('Получение набора данных с указанием левой и правой границы времени', async function () {
            //
            // });
        });
        // context('Data UPDATE', function () {
        //     it('Обновление данных по ID', async function () {
        //
        //     });
        // });
        // context('Data DELETE', function () {
        //     it('Удаление набора данных по ID', async function () {
        //
        //     });
        // });
    });
});