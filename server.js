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
  logs: [{
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
// TODO: 2. retrieve part of logs if from, to, limit are added in req.query

app.get('/api/exercise/log', async (req, res) => {
  Exercise.findById(req.query.userId, 'username logs', (err, logs) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    var userLog = logs._doc;
    var logCount = {count: logs.logs.length};
    res.json({...userLog, ...logCount});
    })
  })

  
// Add exercise
app.post('/api/exercise/add', (req, res) => {
  const logInput = {
    description: req.body.description,
    duration: req.body.duration,
    // date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
    date: req.body.date ? req.body.date : new Date()
  }

  console.log(logInput);
  Exercise.findOne({_id: req.body.userId}, (err, user) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    user.logs.push(logInput);
    user.markModified('date');
    user.save((err) =>{
      if (err) return console.error(err);
    });
    res.json(user);
  });
});

const listener = app.listen(process.env.PORT || 8000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})