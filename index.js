const express = require('express');
const exphbs = require('express-handlebars');
const dotenv = require('dotenv');
const router = express.Router();

//const port = 3000;

const routes = require('./routes.js');

const app = express();

app.set('view engine', 'hbs');

app.use(express.json());
//app.use(express.urlencoded({ extended: true })) // might change later

app.engine("hbs", exphbs.engine({
    extname: "hbs"
    // helpers: require(__dirname + '/public/hbs-helpers/helpers.js')
}));

dotenv.config()
port = process.env.PORT;
hostname = process.env.HOSTNAME;


app.use(express.urlencoded({ extended: true })) // might change later

app.use(express.static('public'));

app.use('/', routes);

/*
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});*/
app.listen(process.env.PORT || 8080)

console.log('here router')
//module.exports = router;
module.exports = app;


