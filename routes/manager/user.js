/**
* user.js
*
* @description :: Машрутизатор запитів щодо користувачів (з боку менеджера)
*/

var express = require('express');
var router = express.Router();

// Виведення списку користувачів
router.get('/users', function(req, res, next) {
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо всіх користувачів
    connection.query('SELECT * FROM user', function(err, rows) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки userList та передаємо до нього дані data
      res.render('manager/userList', {
        data: rows
      });
    });
  });
});

// Створення користувача
router.get('/users/create', function(req, res, next) {
  // Викликаємо шаблон веб-сторінки userCreate та передаємо до нього дані data
  res.render('manager/userCreate');
});

// Обробка результату cтворення користувача
router.post('/users/create', function(req, res, next) {
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Формуємо об'єкт даних нового користувача
    var data = {
      email: input.email,
      password: input.password,
      last_name: input.last_name,
      first_name: input.first_name,
      middle_name: input.middle_name,
      address: input.address,
      city: input.city,
      postcode: input.postcode,
      phone: input.postcode,
      contract: input.contract,
      manager: input.manager
    };
    // Виконуємо запит до БД - додаємо нового користувача
    connection.query("INSERT INTO user set ? ", data, function(err, rows) {
      if (err) return next(err);
        // В разі успішної операції переходимо до сторінки списку користувачів
        res.redirect('/manager/users');
    });
  });
});

// Редагування користувача
router.get('/users/edit/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) користувача з HTTP-запиту
  // (береться з :id в попередньому рядку)
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо необхідного користувача
    connection.query('SELECT * FROM user WHERE id_user = ?', [id], function(err, rows) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки userList та передаємо до нього дані data
      res.render('manager/userEdit', {
        data: rows
      });
    });
  });
});

// Обробка результату редагування користувача
router.post('/users/edit/:id', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх у змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Отмируємо номер (ідентифікатор) користувача з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Формуємо об'єкт даних відредагованого користувача
    var data = {
      email: input.email,
      password: input.password,
      last_name: input.last_name,
      first_name: input.first_name,
      middle_name: input.middle_name,
      address: input.address,
      city: input.city,
      postcode: input.postcode,
      phone: input.postcode,
      contract: input.contract,
      manager: input.manager
    };
    // Виконуємо запит до БД - оновлюємо інформацію користувача
    connection.query("UPDATE user set ? WHERE id_user = ? ", [data, id], function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку користувачів
      res.redirect('/manager/users');
    });
  });
});

// Обробка видалення користувача
router.get('/users/delete/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) користувача з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - видаляємо користувача
    connection.query("DELETE FROM user  WHERE id_user = ? ", [id], function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку користувачів
      res.redirect('/manager/users');
    });
  });
});

module.exports = router;
