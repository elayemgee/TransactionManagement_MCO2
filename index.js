const express = require('express');
const exphbs = require('express-handlebars');
const dotenv = require('dotenv');
const cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs');
const router = express.Router();
const path = require('path');

//const port = 3000;

const routes = require('./routes.js');

const app = express();

app.set('view engine', 'hbs');

app.use(express.json());
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(express.urlencoded({ extended: true })) // might change later

app.engine("hbs", exphbs.engine({
    extname: "hbs"
    // helpers: require(__dirname + '/public/hbs-helpers/helpers.js')
}));
app.set('view engine', '.hbs')
app.use(express.static(path.join(__dirname, '/public')))

const config = require('./config');
const { error } = require('console');

dotenv.config()
port = process.env.PORT;
hostname = process.env.HOSTNAME;

app.use(express.urlencoded({ extended: true })) // might change later

app.use(express.static('public'));

app.use('/', routes);


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(error)
});
//app.listen(process.env.PORT || 8080)

console.log('here router')
//module.exports = router;
module.exports = app;


