/**
* client.js
*
* @description :: Машрутизатор запитів клієнта
*/

var async = require('async'); // Бібліотека для паралельного виконання
var dateFormat = require('dateformat'); // Бібліотека форматування дати/часу
var express = require('express');
var router = express.Router();

// Виведення списку заявок поточного користувача
router.get('/', function(req, res, next) {
  // Визначаємо поточного користувача
  var userId = req.user.id_user;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо всі заявки поточного користувача
    connection.query('SELECT orders.*, type.title FROM orders LEFT JOIN type ON orders.type = type.id_type WHERE orders.user = ?', [userId], function(err, rows) {
      if (err) return next(err);
      // Виправляємо дати - форматуємо поля create_time та complete_time
      rows.forEach(function(item) {
        item.create_time = dateFormat(item.create_time, 'dd.mm.yyyy H:MM');
        if (item.complete_time) item.complete_time = dateFormat(item.complete_time, 'dd.mm.yyyy H:MM');
      });
      // Викликаємо шаблон веб-сторінки orderList та передаємо до неї дані data
      res.render('client/orderList', {
        data: rows
      });
    });
  });
});

// Створення нової заявки
router.get('/create', function(req, res, next) {
  // Визначаємо поточного користувача
  var userId = req.user.id_user;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // При оформленні заявки ми одне поле, що представляє собою список, -
    // список типів послуг. Виконаємо запит до БД, що вибрати всі типи послуг
    connection.query('SELECT type.id_type, type.title FROM type', function(err, rows) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки orderCreate та передаємо до неї дані data
      res.render('client/orderCreate', {
        data: {type: rows}
      });
    });
  });
});

// Обробка результату cтворення заявки
router.post('/create', function(req, res, next) {
  // Визначаємо поточного користувача
  var userId = req.user.id_user;
  // Отримуємо дані передані формою та зберігаємо їх і змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Формуємо об'єкт даних нової заявки
    var data = {
      user: userId,
      type: input.type,
      content: input.content
    };
    // Виконуємо запит до БД - додаємо нову заявку
    connection.query("INSERT INTO orders set ? ", data, function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку заявок клієнта
      res.redirect('/client');
    });
  });
});

// Перегляд заявки та додавання повідомлень
router.get('/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) заявки з HTTP-запиту
  // (береться з :id в попередньому рядку)
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Визначаємо змінну яка міститеме результат кількох запитів до бази даних
    var mult_rows = {};
    // При перегляді заявки знову виникає небхідність виконати два запити
    // до бази даних в одному HTTP-запиту. Нам необхідні: інформація про
    // заявку та список повідомлень в цій заявці. Організовуємо паралельне
    // виконання запитів за допомогою функції async.parallel.
    async.parallel([
      // Перший паралельний запит до БД - інформація про заявку
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT orders.*, type.title FROM orders LEFT JOIN type ON orders.type = type.id_type WHERE id_order = ?', [id], function(err, rows) {
          if (err) return parallel_done(err);
          // Виправляємо дати - форматуємо поля create_time та complete_time
          rows.forEach(function(item) {
            item.create_time = dateFormat(item.create_time, 'dd.mm.yyyy H:MM');
            if (item.complete_time) item.complete_time = dateFormat(item.complete_time, 'dd.mm.yyyy H:MM');
          });
          // Додаємо інформацію про заявку до змінної результату
          mult_rows.order = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      },
      // Другий паралельний запит до БД - список повідомлень
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT message.*, user.first_name, user.middle_name, user.last_name FROM message LEFT JOIN user ON message.user = user.id_user WHERE message.order = ?', [id], function(err, rows) {
          if (err) return parallel_done(err);
          // Виправляємо дати - форматуємо поле create_time
          rows.forEach(function(item) {
            item.create_time = dateFormat(item.create_time, 'dd.mm.yyyy H:MM');
          });
          // Додаємо список повідомлень до змінної результату
          mult_rows.message = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      }
    // Завершення виконання всіх паралельних функцій
    ], function(err) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки orderShow та передаємо до нього дані data
      res.render('client/orderShow', {
        data: mult_rows
      });
    });
  });
});

// Обробка додавання повідомлення в заявку
router.post('/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) заявки з HTTP-запиту
  var id = req.params.id;
  // Визначаємо поточного користувача
  var userId = req.user.id_user;
  // Отримуємо дані передані формою та зберігаємо їх і змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Формуємо об'єкт даних нового повідомлення
    var data = {
      order: id,
      user: userId,
      content: input.message
    };
    // Виконуємо запит до БД - додаємо нове повідомлення
    connection.query("INSERT INTO message set ? ", [data], function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку заявок клієнта
      res.redirect('/client');
    });
  });
});

module.exports = router;
