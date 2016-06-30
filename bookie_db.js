const massive = require('massive')
const db = massive.connectSync({db: 'bookie-bot'})

const BookieDB = {
  user: {
    // Returns one user by id
    find: function find(id) {
      return(
        new Promise((resolve, reject) => {
          const user = db.users.find(id, (err, user) => {
            if (user) {
              resolve(user)
            } else {
              reject({error: 'User not found.'})
            }
          })
        })
      )
    },
    // Returns one user by Slack id
    findBySlack: function findBySlack(slack_id) {
      return(
        new Promise((resolve, reject) => {
          const user = db.users.findOne({ slack_id }, (err, user) => {
            if (err) {
              reject(err)
            } else {
              resolve(user)
            }
          })
        })
      )
    },
    // Returns all users in DB
    all: function all() {
      return(
        new Promise((resolve, reject) => {
          db.users.find((err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    },
    // Returns all admin users
    admin: function admin() {
      return(
        new Promise((resolve, reject) => {
          db.users.find({ admin: true }, (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    },
    // Inserts a new user into the DB
    // Example params: { slack_id, name, admin }
    create: function create(userParams) {
      return(
        new Promise((resolve, reject) => {
          db.users.insert(userParams, (err, newUser) => {
            if (err) {
              reject(err)
            } else {
              resolve(newUser)
            }
          })
        })
      )
    },
    // Sets user's cash money levels by slack id
    setCash: function setCash(slack_id, amount) {
      return(
        new Promise((resolve, reject) => {
          db.users.update({slack_id}, {cash_balance: amount}, (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    },
    setAllBalances: function setAllBalances(amount) {
      return(
        new Promise((resolve, reject) => {
          db.users.update({}, {cash_balance: amount}, (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    }
  }
  // horse: {
  //   // Returns one horse by id
  //   find(id) => {}
  //   // Returns all horses in DB
  //   all() => {}
  // },
  // race: {
  //   // returns bets for this race
  //   bets(race_id) => {}
  //   // Returns a list of horses and their betting odds
  //   odds(race_id) => {}

  //   create(race_name, all_the_pretty_horses) => {}
  // },
  // bet: {
  //   // Adds a new bet!
  //   create(bet_params) => {}
  //   // Returns all bets a user has made
  //   for_user(user_id) => {}
  //   // Clears bets for a user
  //   clear_for_user(user_id) => {}
  //   // Clears bets for a race
  //   clear_for_race(race_id) => {}
  // }
}

module.exports = BookieDB