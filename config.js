const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })

const {
    PORT, HOST, HOST_URL
} = process.env

module.exports = {
    port: PORT,
    host: HOST,
    url: HOST_URL
}