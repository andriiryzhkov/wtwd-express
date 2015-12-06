var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// PassportJS - Авторизація
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

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
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Встановлення підключення до бази даних в якості middleware
var db = {
  host: 'localhost',   // адреса сервера бази даних
  user: 'root',        // користувач бази даних
  password : '153426', // пароль
  port : 3306,
  database:'utilities' // назва бази даних
}
app.use(connection(mysql, db,'request'));

// Проміжний обробник запиту - надсилає в шаблон дані користувача
app.use(function (req, res, next) {
  // Якщо користувач не авторизований - надсилаємо NULL
  if (!req.isAuthenticated()) {
    res.locals.user = null;
    return next();
  }
  // В іншому випадку (авторизований користувач) записуємо дані
  res.locals.user = {
    id: req.user.id_user,
    name: req.user.last_name + ' ' + req.user.first_name,
    manager: req.user.manager
  }
  // Пропускаємо запит далі
  next();
});

// Підключення маршрутизаторів
app.use('/', routes);
app.use('/manager', requireManager, managerUser);
app.use('/manager', requireManager, managerOrder);
app.use('/manager', requireManager, managerType);
app.use('/client', requireAuth, client);

// Налаштування автентифікації PassportJS
// Серіалізація користувача - визначення його id за об'єктом
passport.serializeUser(function(user, done) {
	done(null, user.id_user);
});
// Десеріалізація користувача - визначення об'єкт за його id
passport.deserializeUser(function(id, done) {
  // Підключаємось до бази даних
  mysql.createConnection(db).connect();
  // Виконуємо SQL-запит з таблиці користувачів за номером корситувача
  mysql.createConnection(db).query('SELECT user.id_user, user.first_name, user.last_name, user.email, user.password, user.manager FROM user WHERE id_user = ?', [id], function(err, rows) {
    // Якщо помилка або немає жодного результата - далі повідомлення про помилку
    if (err || !rows.length) return done(err);
    // Повертаємо перший рядок рузультата запиту в якості боб'єкта користувача
    return done(err, rows[0]);
  });
});
// Визначення локальної стратегії авторизації
passport.use(new LocalStrategy({
    // За замовчуванням local strategy використовує username
    // та password, ми замінимо на email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  },
  function(req, username, password, done) {
    // Підключаємось до бази даних
    req.getConnection(function(err, connection) {
      if (err) return next(err);
      // Виконуємо запит до БД - вибираємо користувача за його email'ом
      connection.query('SELECT user.id_user, user.email, user.password, user.manager FROM user WHERE email = ?', [username], function(err, rows) {
        // Якщо помилка
        if (err) return done(err);
        // Якщо не знайдено жодногорезультату
        if (!rows.length) {
          return done(null, false, {message: 'Невірний email'});
        }
        // Якщо пароль не відповідає введеному в формі
        if (rows[0].password != password) {
          return done(null, false, {message: 'Невірний пароль'});
        }
        // Якщо все гаразд - передаємо перший рядок рузультата запиту
        // в якості боб'єкта користувача
        return done(null, rows[0]);
      });
    });
  }
));

// Функція перевірки автентифікованого користувача
function requireAuth(req, res, next){
  // Якщо користувач не автентифікувався, перенаправляємо на головну сторінку
  if(!req.isAuthenticated()) return res.redirect('/login');
  // А якщо автентифікувався - пропускаємо далі
  next();
}

function requireManager(req, res, next){
  // Якщо користувач не автентифікувався, перенаправляємо на головну сторінку
  if (!req.isAuthenticated()) return res.redirect('/login');
  // Якщо користувач не має прав менеджера - перенаправляємо на головну сторінку
  if (!req.user.manager) return res.redirect('/');
  // А якщо автентифікувався та має права менеджера - пропускаємо далі
  next();
}

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
