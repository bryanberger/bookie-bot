const request = require('request')

megaphone = {}

megaphone.startRandomRace = function startRandomRace() {
  return new Promise((resolve, reject) => {
    randomNumbers = Array.apply(null, Array(4)).map(() => { return Math.floor(Math.random() * 100)})

    request.post(process.env.PI_ADDRESS, body: randomNumbers, function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

module.exports = megaphone