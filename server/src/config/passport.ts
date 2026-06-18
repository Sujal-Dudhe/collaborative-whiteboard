import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from 'passport-github2'

import { User } from '../models/user.model'

// ---------- Google Strategy -------------------
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.CALLBACK_URL!,
},
async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        // Check if existing user OR create new one
        let user = await User.findOne({ provider: 'google', providerId: profile.id })

        if (!user) {
            user = await User.create({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatar: profile.photos?.[0]?.value,
                provider: 'google',
                providerId: profile.id,
            })
        }

        return done(null, user);
    } catch (err) {
        return done(err as Error);
    }
}
))

// ---------- GitHub Strategy -------------------

passport.use(new GitHubStrategy(
  {
    clientID:     process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL:  process.env.GITHUB_CALLBACK_URL!,
    scope:        ['user:email'],
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      let user = await User.findOne({ provider: 'github', providerId: profile.id })

      if (!user) {
        user = await User.create({
          name:       profile.displayName || profile.username,
          email:      profile.emails?.[0]?.value || '',
          avatar:     profile.photos?.[0]?.value || '',
          provider:   'github',
          providerId: String(profile.id),
        })
      }

      return done(null, user)
    } catch (err) {
      return done(err as Error)
    }
  }
))


// Serialize/deserialize for session
passport.serializeUser((user: any, done) => done(null, user._id))
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) { done(err) }
})