const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const { User} = require("./models/userModel.js");
const Exercise = require("./models/exerciseModel.js")
const expressAsyncHandler = require('express-async-handler');
const bodyParser = require('body-parser');
require('dotenv').config({path : 'sample.env'});


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)

    console.log(`MongoDB connected at ${conn.connection.host}`)
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse application/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', expressAsyncHandler((req,res) => {
  const { username } = req.body
  try {
    User.create({username})
    .then((user) => {
      res.status(201).json(user)
    })
    .catch((err) => {
      res.status(400).send(err.message);
    });
  } catch (err) {
    res.status(400).send(err.message);
  }


}));

app.get('/api/users', expressAsyncHandler((req, res) => {
  try {
    User.find()
    .then((users) => {
      res.status(200).json(users)
    })
    .catch((err) => {
      res.status(400).send(err.message);
    })
  } catch(err) {
    res.status(400).send(err.message);
  }
}));

app.post('/api/users/:_id/exercises', expressAsyncHandler(async (req, res) => {
  try {
    //get the request body
    let _id = req.params;
    let { description, duration, date } = req.body;

    // parse the date to check if the date is valid else current date is used
    date = new Date(date);
    let newdate = isNaN(date) ? new Date() : new Date(date);
    newdate = newdate.toDateString()

    // get the current user
    let user = await User.findOne({_id})
    if (!user) return res.status(404).json({Error: "User not found"});

    //create exercise
    let exercise = await Exercise.create({ description, date: newdate, duration, user})

    let responseExercise = {
      _id: user._id,          // Include the ID from the user own _id
      username: user.username,    // Include the username from the user object
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
  };

    return res.status(201).json(responseExercise)
  } catch(err) {
     return res.status(400).send(err.message)
  }
}));

app.get('/api/users/:_id/logs', expressAsyncHandler(async (req, res) => {
  try{
    let {_id}  = req.params;
    const { from, to, limit } = req.query;

    let filter = {user: _id}

    if (from) {
      filter.date = { ...filter.date, $gte: new Date(from) };
    }
    
    if (to) {
        filter.date = { ...filter.date, $lte: new Date(to) };
    }

    //get the query based on the filter arguments
    let query = Exercise.find(filter).populate("user");

    if (limit) {
      query = query.limit(parseInt(limit));
    }
  
    const exercises = await query.exec();



    if (!exercises || exercises.length <= 0) return res.status(404).json({Error: "Exercise not found"})
    let log = [];

    // get each exercise data and add it to the logs array
    exercises.forEach((exercise) => {
      let logs = {
        description: exercise.description,   
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }
      log.push(logs);
    });

    let result = {
      _id,    // Include the ID from the user own _id
      username: exercises[0].user.username,   // Include the username from the user object
      count: exercises.length,
      log
    }

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message)
  }
}));





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
