const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({ 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    description: String,
    duration: Number,
    date: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;