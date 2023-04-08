const express = require('express');
const exphbs = require('express-handlebars');
const dotenv = require('dotenv');
const router = express.Router();

const port = 3000;

const routes = require('./routes.js');

const app = express();

app.set('view engine', 'hbs');

app.use(express.json());
//app.use(express.urlencoded({ extended: true })) // might change later

app.engine("hbs", exphbs.engine({
    extname: "hbs"
    // helpers: require(__dirname + '/public/hbs-helpers/helpers.js')
}));

//dotenv.config();
//port = process.env.PORT || 3000;
//hostname = process.env.HOSTNAME || 3000;

app.use(express.urlencoded({ extended: true })) // might change later

app.use(express.static('public'));

/*
const mysql = require('mysql2');
var con = mysql.createConnection({
    //host: '172.16.3.142',
    host: 'localhost',
    port: '3306',
    user: 'root',
	password: 'net11142',
});

con.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + con.threadId);
});
*/

/*
app.get('/', function (req, res) {
    //   res.sendFile(path.join(__dirname, '/index.html'));
    var query = "SELECT * FROM movies.central LIMIT 10;"
    con.query(query, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        // connected!
        res.render('report', { tuple: results });
    });
});
*/
//module.exports = router;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = router;

app.use('/', routes);
//app.use('/addEntry', routes);

