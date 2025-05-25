const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables here as well, just in case

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true // Allows us to access req in the callback
},
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // If user exists, update their info if necessary and return
            // You might want to update name or other profile info here
            return done(null, user);
        }

        // Check if a user exists with the same email but without googleId
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // If user exists with email but no googleId, link the googleId
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        // If no user exists, create a new one
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value, // Assuming email is available and verified by Google
            // Password is not required for Google OAuth users based on our schema
            role: 'student' // Default role for new users via OAuth
        });

        await newUser.save();

        done(null, newUser);

    } catch (error) {
        done(error, null);
    }
}));

// Passport serialize and deserialize user (needed for sessions, though JWT is primary)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
});

module.exports = passport; 