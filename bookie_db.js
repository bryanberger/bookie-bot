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
  },
  runner: {
    // Returns one horse by id
    find: function find(id) {
      return(
        new Promise((resolve, reject) => {
          const user = db.runners.find(id, (err, user) => {
            if (user) {
              resolve(user)
            } else {
              reject({error: 'User not found.'})
            }
          })
        })
      )
    },
    // Returns all horses in DB
    all: function all() {
      return(
        new Promise((resolve, reject) => {
          db.runners.find((err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    }
  },
  race: {
    // returns bets for this race
    wagers: function wagers(race_id) {
      return(
        new Promise((resolve, reject) => {
          db.bets_by_race.find([race_id], (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    },
    // Returns a list of horses and their betting odds
    odds: function odds(race_id) {
      return(
        new Promise((resolve, reject) => {
          db.odds([race_id], (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          })
        })
      )
    },

    create: function create(race_name, array_of_horse_names) {
      return(
        new Promise((resolve, reject) => {
          db.races.insert({ name: race_name }, (err, race) => {
            if (err) { return reject(err) }
            let newId = race.id

            const colors = ['#7ED321','#4A90E2','#D52B3F','#9641E1']

            newRunners = array_of_horse_names.map((name, index) => { return { race_id: newId ,name: name, color: colors[index]} })

            db.runners.insert(newRunners, (err, results) => {
              if (err) {
                reject(err)
              } else {
                resolve(race)
              }
            })

          })
        })
      )
    },

    setActiveState: function setActiveState(race_id, boolean) {
      return(
        new Promise((resolve, reject) => {
          db.races.update({ id: race_id, active: boolean}, (err, race) => {
            if (err) {
              reject(err)
            } else {
              resolve(race)
            }
          })
        })
      )
    }
  },
  wager: {
    // Adds a new wager!
    // { amount, runner_id, user_id}
    create: function create(wager_params) {
      return(
        new Promise((resolve, reject) => {
          db.wagers.insert(wager_params, (err, wager) => {
            if (err) {
              reject(err)
            } else {
              resolve(wager)
            }
          })
        })
      )
    },
    // Returns all bets a user has made
    forUser: function forUser(user_id) {
      return(
        new Promise((resolve, reject) => {
          db.wagers.find({ user_id }, (err, wagers) => {
            if (err) {
              reject(err)
            } else {
              resolve(wagers)
            }
          })
        })
      )
    },
    // Clears bets for a user
    clearForUser: function clearForUser(user_id) {
      return(
        new Promise((resolve, reject) => {
          db.wagers.destroy({ user_id }, function(err, wagers){
            if (err) {
              reject(err)
            } else {
              resolve(wagers)
            }
          })
        })
      )
    },
    // Clears bets for a race
    clearForRace: function clearForRace(race_id) {
      return(
        new Promise((resolve, reject) => {
          db.destroy_wagers_for_race([race_id], function(err, wagers){
            if (err) {
              reject(err)
            } else {
              resolve(wagers)
            }
          })
        })
      )
    }
  }
}

module.exports = BookieDB