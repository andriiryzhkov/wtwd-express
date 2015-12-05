/**
* index.js
*
* @description :: Головний машрутизатор сайту
*/

var express = require('express');
var router = express.Router();

// Домашня сторінка
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
