/**
* order.js
*
* @description :: Машрутизатор запитів щодо заявок (з боку менеджера)
*/

var async = require('async'); // Бібліотека для паралельного виконання
var dateFormat = require('dateformat'); // Бібліотека форматування дати/часу
var express = require('express');
var router = express.Router();

// Виведення заказів
router.get('/orders', function(req, res, next) {
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо всі заявки
    connection.query('SELECT orders.*, user.first_name, user.last_name, type.title FROM orders LEFT JOIN user ON orders.user = user.id_user LEFT JOIN type ON orders.type = type.id_type', function(err, rows) {
      if (err) return next(err);
      // Виправляємо дати - форматуємо поля create_time та complete_time
      rows.forEach(function(item) {
        item.create_time = dateFormat(item.create_time, 'dd.mm.yyyy H:MM');
        if (item.complete_time) item.complete_time = dateFormat(item.complete_time, 'dd.mm.yyyy H:MM');
      });
      // Викликаємо шаблон веб-сторінки orderList та передаємо до неї дані data
      res.render('manager/orderList', {
        data: rows
      });
    });
  });
});

// Створення заявки
router.get('/orders/create', function(req, res, next) {
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    if (err) return next(err);
    // Визначаємо змінну яка міститеме результат кількох запитів до бази даних
    var mult_rows = {};
    // При оформленні заявки ми маємо два поля, що представляють собою список, -
    // список користувачів та список типів послуг. Щоб сформувати такі списки ми
    // спершу маємо виконати два запити до бази даних та отримати відповідні дані.
    // Для виконання більше ніж одного запиту до БД в одному HTTP-запиті ми маємо
    // органузувати їх паралельну роботуза допомогою функції async.parallel.
    // В цьому випадку ми маємо два запити до бази даних, які викликаються
    // паралельно.
    async.parallel([
      // Перший паралельний запит до БД - список користувачів
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT user.id_user, user.first_name, user.middle_name, user.last_name FROM user', function(err, rows) {
          if (err) return parallel_done(err);
          // Додаємо список користувачів до змінної результату
          mult_rows.user = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      },
      // Другий паралельний запит до БД - список типів послуг
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT type.id_type, type.title FROM type', function(err, rows) {
          if (err) return parallel_done(err);
          // Додаємо список типів послуг до змінної результату
          mult_rows.type = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      }
    // Завершення виконання всіх паралельних функцій
    ], function(err) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки orderCreate та передаємо до нього дані data
      res.render('manager/orderCreate', {
        data: mult_rows
      });
    });
  });
});

// Обробка результату cтворення заявки
router.post('/orders/create', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх і змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Формуємо об'єкт даних нової заявки
    var data = {
      user: input.user,
      type: input.type,
      content: input.content
    };
    // Виконуємо запит до БД - додаємо нову заявку
    connection.query("INSERT INTO orders set ? ", data, function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку заявок
      res.redirect('/manager/orders');
    });
  });
});

// Редагування заявки
router.get('/orders/edit/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) заявки з HTTP-запиту
  // (береться з :id в попередньому рядку)
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Визначаємо змінну яка міститеме результат кількох запитів до бази даних
    var mult_rows = {};
    // При редагуванні заявки знову виникає небхідність виконати чотири запити
    // до бази даних в одному HTTP-запиту. Нам необхідні: список користувачів,
    // список питів послуг, інформація заявку яку ми редагуватимемо та список
    // повідомлень в цій заявці. Організовуємо паралельне виконання запитів
    // за допомогою функції async.parallel.
    async.parallel([
      // Перший паралельний запит до БД - список користувачів
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT user.id_user, user.first_name, user.middle_name, user.last_name FROM user', function(err, rows) {
          if (err) return parallel_done(err);
          // Додаємо список користувачів до змінної результату
          mult_rows.user = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      },
      // Другий паралельний запит до БД - список типів послуг
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT type.id_type, type.title FROM type', function(err, rows) {
          if (err) return parallel_done(err);
          // Додаємо список типів послуг до змінної результату
          mult_rows.type = rows;
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      },
      // Третій паралельний запит до БД - інформація про заявку
      function(parallel_done) {
        // Саме формування запиту
        connection.query('SELECT * FROM orders WHERE id_order = ?', [id], function(err, rows) {
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
      // Четвертий паралельний запит до БД - список повідомлень
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
      // Викликаємо шаблон веб-сторінки orderEdit та передаємо до нього дані data
      res.render('manager/orderEdit', {
        data: mult_rows
      });
    });
  });
});

// Обробка результату редагування заявки
router.post('/orders/edit/:id', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх у змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Отмируємо номер (ідентифікатор) заявки з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Формуємо об'єкт даних відредагованої заявки
    var data = {
      user: input.user,
      type: input.type,
      content: input.content
    };
    // Якщо користувач відмітив закриття заявки додаємо дату завершення
    if (input.complete == 'on') data.complete_time = dateFormat((new Date()), 'yyyy-mm-dd HH:MM:ss');
    // Формуємо об'єкт даних нового повідомлення в заявці
    var dataMessage = {
      order: id,
      user: 1, // Треба далі викправити на id поточного користувача
      content: input.message
    };
    // При збереженні відредагованої заявки треба виконати два паралельні запити
    // до бази даних: оновити данні заявки та додати нове повідомлення (за потреби).
    // Організовуємо паралельне виконання запитів за допомогою функції async.parallel.
    async.parallel([
      // Перший паралельний запит до БД - оновлення інформації про заявку
      function(parallel_done) {
        // Саме формування запиту
        connection.query("UPDATE orders set ? WHERE id_order = ? ", [data, id], function(err, rows) {
          if (err) return parallel_done(err);
          // Зворотня функція, яка завершує паралельну операцію і
          // передаєуправління далі
          parallel_done();
        });
      },
      // Другий паралельний запит до БД - додавання повідовлення
      function(parallel_done) {
        if (input.message != "") {
          // Саме формування запиту
          connection.query("INSERT INTO message set ? ", dataMessage, function(err, rows) {
            if (err) return parallel_done(err);
            // Зворотня функція, яка завершує паралельну операцію і
            // передаєуправління далі
            parallel_done();
          });
        } else {
          parallel_done();
        }
      }
    // Завершення виконання всіх паралельних функцій
    ], function(err) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку заявок
      res.redirect('/manager/orders');
    });
  });
});

// Обробка видалення заявки
router.get('/orders/delete/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) заявки з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // Виконуємо запит до БД - видаляємо заявку
    connection.query("DELETE FROM orders WHERE id_order = ? ", [id], function(err, rows) {
      if (err) console.log("Помилка видалення: %s ", err);
      // В разі успішної операції переходимо до сторінки списку заявок
      res.redirect('/manager/orders');
    });
  });
});

module.exports = router;
