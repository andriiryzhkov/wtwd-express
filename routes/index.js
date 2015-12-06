/**
* index.js
*
* @description :: Головний машрутизатор сайту
*/

var express = require('express');
var router = express.Router();
var passport = require('passport');

// Домашня сторінка
router.get('/', function(req, res, next) {
  res.render('index');
});

// Сторінка автентифікації
router.get('/login', function(req, res, next) {
  // Якщо користувач вже автентиікований - перенаправляємо на головну сторінку
  if(req.isAuthenticated()) res.redirect('/');
  // Викликаємо шаблон веб-сторінки автентифікації (входу)
  res.render('auth/login', {message: null});
});

// Сторінка обробки автентифікації
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',     // Перенаправлення в разі успішної автентифікації
  failureRedirect: '/login' // Перенаправлення в разі невірної автентифікації
}));

// Вихід користувача
router.get('/logout', function(req, res, next) {
  // Вихід
  req.logout();
  // Переход на головну сторінку
  res.redirect('/');
});

// Сторінка реєстрації нового користувача
router.get('/register', function(req, res, next) {
  // Викликаємо шаблон веб-сторінки реєстрації нового користувача
  res.render('auth/register');
});

// Сторінка обробки реєстрації нового користувача
router.post('/register', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх у змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Формуємо об'єкт даних нового користувача
    var data = {
      email: input.email,
      password: input.password,
      first_name: input.first_name,
      middle_name: input.middle_name,
      last_name: input.last_name,
      contract: input.contract
    };
    // Виконуємо запит до БД - додаємо нового користувача
    connection.query("INSERT INTO user set ? ", [data], function(err, rows) {
      if (err) return next(err);
        // В разі успішної операції переходимо до головної сторінки сайтуі
        res.redirect('/');
    });
  });
});

module.exports = router;
