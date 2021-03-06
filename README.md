# Приклад курсового проекту/роботи з дисципліни "Веб-технології та веб-дизайн" на базі Express

В якості прикладу буде створено веб-додаток для замовлення комунальних послуг. Передбачається реалізація можливості розмістити замовлення від клієнта для виконання певного виду комунальної послуги (погалодження електрики, прочистака каналізації, тощо). Клієнт при замовленні вибирає тип послуги та описує суть проблеми, яку необхідно вирішити. В процесі обслуговування, клієнт та виконавець можуть обмінуватись повідомленнями для уточнення ситуації. Виконане замовлення відповідно помічається.

## Системні вимоги

- [Node.js](https://nodejs.org/)
- [MySQL Server](https://www.mysql.com/products/community/)

## З чого почати

В цій реалізації проекту викоритовуватимемо фреймворк [Express](http://expressjs.com/ru/). Для генерації проекту виконайте наступні команди:

```
npm install -g express-generator
express -e wtwd-express
cd wtwd-express
npm install
```

Після цього необхідно додати пакети для роботи з базою даних MySQL:

```
npm install --save mysql
npm install --save express-myconnection
```

Для запуска сервера виконайте команду

```
npm start
```

Ваш сайт буде доступний за адресою

```
http://localhost:3000/
```

## Особливості реалізації

Головна особливість запропанованої реалізації курсового проекту полягає в перенесені всієї логіки роботи на серверну частину. Тобто, як і в багатьох інших скриптових серверних мовах програмування, таких як PHP, на сервері відбувається формування веб-сторінки відповідно до направленого користувачем HTTP-запиту. Готова веб-сторінка відправляється в браузер.

Розглянемо принцип роботи веб-сайту на прикладі сторінки списку корситувачів для менеджера, яка доступна за посиланням `http://localhost:3000/manager/users`.

Нам необхідно додати маршрутизатор, який у відповідь на HTTP-запит `manager/users` виконає певні дії та сформує веб-сторінку зі списком користувачів. Цей маршрутизатор знаходится в файлі

```
routes\manager\user.js
```

Але перш ніж цей маршрутизатор буде застосований, його слід підключити в `app.js`. Для цього спочатку в 14-му рядку оголошуємо змінну managerUser та завантажуємо в неї відповідний модуль через функцію `require()`.

```
var managerUser = require('./routes/manager/user');
```

Далі в 44-му рядку даємо команду фреймворку Express використовувати цей маршрутизатор за допомогою функції `app.use()`

```
app.use('/manager', managerUser);
```

Тепер можна повернутись безпосередньо до файла маршрутизатора `routes\manager\user.js`. В ньому додаємо функцію `router.get('/users', function(req, res, next) { });`. Її першим параметром є шлях URL на який ми будемо буувати відповідь. Зверніть увагу, що в нашому випадку тут зазначено шлях `/users`, але його слід додати до шляху визначеного в 44-му рядку файла `app.js` - `/manager`. В результаті наша функція буде реагувати на шлях `/manager/users`, або URL `http://localhost:3000/manager/users`.

Другим параметром є безіменна функція зворотнього виклику, яка і буде виконуватись при надходжені HTTP-запиту GET до `/manager/users`. Параметрами цієї функції є: `req` - змінна об'єкту запита, `res`- змінна об'єкту відповіді, `next` - функція передачі управління.

Текст функції `router.get('/users', function(req, res, next) { });` наведений нижче та добре документований.

```
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
```

Ми бачимо, що тут відбувається підключення до бази даних та формування SQL-запиту всіх користувачів в базі. Результат запиту записується в змінну `rows`. Після цього викликається шаблон веб-сторінки `manager/userList` та передаються до нього раніше отриманий з бази даних список користувачів.

```
res.render('manager/userList', {
  data: rows
});
```

Шаблон веб-сторінки знаходиться в `views\manager\userList.ejs`. Розширення файлу `ejs` вказує на використання шаблонізатора [EJS](http://www.embeddedjs.com/). Він по суті є звичайним HTML-документом, але має спеціальні вставки, що будуть оброблятись сервером перш ніж передати файл в браузер. Ці вставки розміщені в тегу `<% %>`. В межах цього тегу використовується синтаксис JavaScript. Приклад наступног рядка виводить значення відповідної змінної (об'єкту JavaScript) в HTML-документ.

```
<%=data[i].first_name%>
```

Таким чином, в кінці функції маршрутизатора формується веб-сторінка, яка й передається у HTTP-відповіді в браузер.

Інші веб-сторінки нашого сайту формується аналогічним чином. Весь код в проекті добре документован для кращого розуміння його призначення.
