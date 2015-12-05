var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Оголошення для роботи з базою даних MySQL
var connection  = require('express-myconnection');
var mysql = require('mysql');

// Оголошення мартрутизаторів
var routes = require('./routes/index');
var managerUser = require('./routes/manager/user');
var managerOrder = require('./routes/manager/order');
var managerType = require('./routes/manager/type');
var client = require('./routes/client');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Встановлення підключення до бази даних в якості middleware
app.use(
    connection(mysql,{
        host: 'localhost',   // адреса сервера бази даних
        user: 'root',        // користувач бази даних
        password : '153426', // пароль
        port : 3306,
        database:'utilities' // назва бази даних
    },'request')
);

// Підключення маршрутизаторів
app.use('/', routes);
app.use('/manager', managerUser);
app.use('/manager', managerOrder);
app.use('/manager', managerType);
app.use('/client', client);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Не знайдено');
  err.status = 404;
  next(err);
});

// Обробники помилок

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
