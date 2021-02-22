const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log(mongoose.connection.readyState);
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

//Create new user
app.post('/api/exercise/new-user', (req, res) => {
  var input = req.body.username;
  var newUser = Exercise({
    username: input
  })
  newUser.save((err) => {
    if (err) return console.error(err);
  })
  res.json(newUser);
});

// Show all users
app.get('/api/exercise/users', (req, res) => {
  Exercise.find({}, 'username', (err, users) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    res.status(200).send(users);
  })
});

// Find all exercises logged by userId
app.get('/api/exercise/log', async (req, res) => {

  Exercise.findById(req.query.userId, {
    "logs._id": 0
  }, (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    var log = result.log;

    if (req.query.from && req.query.to) {
      log = log.filter(log => log.date >= new Date(req.query.from) && log.date <= new Date(req.query.to))
    }
    if (req.query.limit)
    log = log.slice(0, req.query.limit);

    log.forEach((el) => {
      el.date = new Date(el.date).toLocaleDateString();
    });

    res.json({
      ...{
        username: result.username
      },
      ...{
        count: log.length
      },
      log
    });
  })


})

// Add exercise
app.post('/api/exercise/add', (req, res) => {
  const logInput = {
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString(),
    duration: parseInt(req.body.duration),
    description: req.body.description
  }
  Exercise.findOne({
    _id: req.body.userId
  }, (err, user) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    user.log.push(logInput);
    user.markModified('date');
    user.save((err) => {
      if (err) return console.error(err);
    });

    res.send({
      ...{
        _id: req.body.userId,
        username: user.username
      },
      ...logInput
    });
  });
});

const listener = app.listen(process.env.PORT || 8000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})