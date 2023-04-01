const express = require('express');
const connection = require('../connection');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

var auth = require('../services/authentications');
var checkRole = require('../services/check-role');

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

router.post('/login', (req, res) => {
  const user = req.body;
  query = "select email, password, role, status from users where email = ?";
  connection.query(query, [user.email], (err, results) => {
    if(!err) {
      if(results.length <= 0 || results[0].password !== user.password) {
        return res.status(401).json({message: "Incorrect username or password."});
      } else if(results[0].status === 'false') {
        return res.status(401).json({message: "Wait for admin approval."});
      } else if(results[0].password === user.password) {
        const response = {email: results[0].email, role: results[0].role}
        const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: "8h" });
        res.status(200).json({token: accessToken});
      } else {
        return res.status(400).json({message: "Something went wrong. Please try again later."});
      }
    } else {
      return res.status(500).json(err);
    }
  })
})

// get user details
router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  var query = "select * from users where role = 'user'";
  connection.query(query, (err, result) => {
    return err ? res.status(500).json(err) : res.status(200).json(result);
  })
})

// update user status
router.patch('/update-status', auth.authenticateToken, checkRole.checkRole,  (req, res) => {
  const user = req.body;
  var query = "update users set status = ? where id = ?";
  connection.query(query, [user.status, user.id], (err, result) => {
    return (result.affected === 0) ? res.status(404).json({message: "User id does not exist."}) : res.status(200).json({message: "User status updated successfully."});
  })
})

router.get('/check-token', auth.authenticateToken, (req, res) => {
    return res.status(200).json({message: "true"});
})

router.post('/change-password', auth.authenticateToken, (req, res) => {
  const user = req.body;
  const email = res.locals.email;
  var query = "select * from users where email = ? and password = ?";

  connection.query(query, [email, user.oldPassword], (err, results) => {
    if(!err) {
      if(results.length <= 0) {
        return res.status(400).json({message: "Incorrect old password."})
      } else if (results[0].password == user.oldPassword) {
        query = "update users set password = ? where email = ?";
        connection.query(query, [user.newPassword, email], (err, results) => {
          console.log('ELSE IF');
          
          return !err ? res.status(200).json({message: "Password updated successfully."}) : res.status(500).json(err)
        })
      } else {
        return res.status(400).json({message: "Something went wrong. Please try again later."});
      }
    } else {
      return res.status(500).json(err);
    }
  })
})
module.exports = router;