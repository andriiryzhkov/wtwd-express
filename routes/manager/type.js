/**
* type.js
*
* @description :: Машрутизатор запитів щодо типів послуг (з боку менеджера)
*/

var express = require('express');
var router = express.Router();

// Виведення списку типів послуг
router.get('/types', function(req, res, next) {
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо всі типи послуг
    connection.query('SELECT * FROM type', function(err, rows) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки typeList та передаємо до нього дані data
      res.render('manager/typeList', {
        data: rows
      });
    });
  });
});

// Створення типу послуги
router.get('/types/create', function(req, res, next) {
  // Викликаємо шаблон веб-сторінки typeCreate та передаємо до нього дані data
  res.render('manager/typeCreate');
});

// Обробка результату cтворення типу послуги
router.post('/types/create', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх у змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Формуємо об'єкт даних нового типу послуги
    var data = {
      title: input.title
    };
    // Виконуємо запит до БД - додаємо новий тип послуг
    connection.query("INSERT INTO type set ? ", data, function(err, rows) {
      if (err) return next(err);
        // В разі успішної операції переходимо до сторінки списку типів послуг
        res.redirect('/manager/types');
    });
  });
});

// Редагування типу послуги
router.get('/types/edit/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) типу послуги з HTTP-запиту
  // (береться з :id в попередньому рядку)
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - вибираємо заданий тип послуги
    connection.query('SELECT * FROM type WHERE id_type = ?', [id], function(err, rows) {
      if (err) return next(err);
      // Викликаємо шаблон веб-сторінки typeEdit та передаємо до нього дані data
      res.render('manager/typeEdit', {
        data: rows
      });
    });
  });
});

// Обробка результату редагування типу послуги
router.post('/types/edit/:id', function(req, res, next) {
  // Отримуємо дані передані формою та зберігаємо їх у змінну input
  var input = JSON.parse(JSON.stringify(req.body));
  // Отмируємо номер (ідентифікатор) типу послуги з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Формуємо об'єкт даних відредагованого типу послуги
    var data = {
      title: input.title
    };
    // Виконуємо запит до БД - оновлюємо заданий тип послуги
    connection.query("UPDATE type set ? WHERE id_type = ? ", [data, id], function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку типів послуг
      res.redirect('/manager/types');
    });
  });
});

// Обробка видалення типу послуги
router.get('/types/delete/:id', function(req, res, next) {
  // Отмируємо номер (ідентифікатор) типу послуги з HTTP-запиту
  var id = req.params.id;
  // Відкриваємо з'єднання з базою даних
  req.getConnection(function(err, connection) {
    // В разі помилки завершуємо з'єднання
    if (err) return next(err);
    // Виконуємо запит до БД - видаляємо заданий тип послуги
    connection.query("DELETE FROM type  WHERE id_type = ? ", [id], function(err, rows) {
      if (err) return next(err);
      // В разі успішної операції переходимо до сторінки списку типів послуг
      res.redirect('/manager/types');
    });
  });
});

module.exports = router;
