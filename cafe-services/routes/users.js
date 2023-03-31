const express = require('express');
const connection = require('../connection');
const router = express.Router();

router.post('/signup', (req, res) => {
  let user = req.body;
  query = "select email, password, role, status from users where email = ?"
  connection.query(query, [user.email], (err, result) => {
    if(!err) {
      if(result.length <= 0) {
        query = "insert into users (name, contact_number, email, password, status, role) values (?, ?, ?, ?, 'false', 'user')"
        connection.query(query, [user.name, user.contact_number, user.email, user.password], (err, result) => {
          if(!err) {
            res.status(200).json({message: "Successfully Registered."});
          } else {
            res.status(500).json(err);
          }
        })
      } else {
        return res.status(400).json({message: "Email Already Exist!"});
      }
    } else {
      res.status(500).json(err);
    }
  })
})

module.exports = router;