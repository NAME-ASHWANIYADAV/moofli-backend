const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Not a valid email");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    dateOfBirth: {
        day: {
            type: Number,
            required: true
        },
        month: {
            type: Number,
            required: true
        },
        year: {
            type: Number,
            required: true
        }
    },

    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    postalCode: {
        type: Number,
        required: true
    },
    termsAccepted: {
        type: Boolean,
        required: true,
        default: false
    },
    profilePicture :{
        type:String,
        default: null
    },
  
    
   
   
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ],
    passwordResetToken: {
        type: String,
        required: false
    },
    passwordResetExpires: {
        type: Date,
        required: false
    }
    
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

// Generate JWT token

userSchema.methods.generateAuthToken = async function() {
    try {
        // Generate JWT token
        const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Append the new token to the tokens array in the user document
        this.tokens = this.tokens.concat({ token });

        // Save the updated user document with the new token appended to the tokens array
        await this.save();

        // Return the generated token to the caller
        return token;
    } catch (error) {
        throw new Error("Error generating token");
    }
};
// creating model
const users = new mongoose.model("users", userSchema);

module.exports = users;
