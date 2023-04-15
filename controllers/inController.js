const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const inController = {
    inPage: function (req, res) {   
        res.render('in');
    },

    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    inRecord: async function (req, res) { 

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        var flag = false;
        var flag2 = false;

        if(year < 1980){
            //select from node 1
            try {
                console.log('central node');
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to central node');

                await node1Connection.query("set autocommit = 0;")
                await console.log('autocommit = 0')
                await node1Connection.query("START TRANSACTION;")
                await console.log('started transaction')
                //await node1Connection.query("LOCK TABLES node1a write;")
                //await console.log('Locked tables node1a');

                //insert new movie
                node1Connection.query(`INSERT INTO node1a (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`);
                node1Connection.query("COMMIT;")
                node1Connection.query("UNLOCK TABLES;")
                console.log('Insert to node 1 has been committed and table is unlocked')

                //update logs

                //end connection
                node1Connection.end()
                flag = true

            } catch (err) {
                if (node1Connection != null) {
                    node1Connection.end()
                }
                //insert in node 2 if node 1 is not successful
                try {
                    console.log('node2');
                    node2Connection = await mysql.createConnection(config.node2conn);
                    console.log('created connection to node 2');
                    await node2Connection.query("set autocommit = 0;");
                    await node2Connection.query("START TRANSACTION;");
                    await node2Connection.query("LOCK TABLES node2 write;");
                    await node2Connection.query(`INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                        if (error) throw error;
                        console.log(results);
                        res.render('insert', { records: results });
                    });
                    await node2Connection.query("COMMIT;");
                    await node2Connection.query("UNLOCK TABLES;");

                    node2Connection.end()
                    console.log('gonna render results');
                    res.render('in',  { records: results });

                } catch (err) {
                    if (node2Connection != null) {
                        node2Connection.end()
                    }
                    console.log('node2 failed')   
                    res.render('in')     
                
                //update log status
                /*
                try {
                    nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                    await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node2');")
                    console.log("Logs in node2_logs terminated")

                    await nodeLogsConnection.query("INSERT INTO `node1_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node1');")
                    console.log("Logs in node1_logs terminated")

                } catch(err) {
                    console.log(err)
                    if(nodeLogsConnection != null) {
                        nodeLogsConnection.end()
                    }
                }
                */
            }
            if (flag) { //if insert in node 1 was successful, insert in node 2
                try {
                    node2Connection = await mysql.createConnection(config.node2conn)
                    await node2Connection.query("set autocommit = 0;")
                    await node2Connection.query("START TRANSACTION;")
                    await node2Connection.query("LOCK TABLES node2 write;")

                    // insert in logs
                        //await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node2');")
                        //console.log("Start log inserted to node 2")

                    // insert new movie
                    //await node2Connection.query("INSERT INTO `node2` (`name`, `year`, `rank`) values ('" + movieName + "'," + movieYear + "," + movieRank + ");")
                    await node2Connection.query(`INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                        if (error) throw error;
                        console.log(results);
                        res.render('insert', { records: results });
                    });
                    // update logs 
                    /*
                    await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node2';", [movieName])
                    console.log("Log updated to write in node 2")
                    */
                    await node2Connection.query("COMMIT;")
                    await node2Connection.query("UNLOCK TABLES;")

                    node2Connection.end()

                } catch (err) {
                    // log to node 1 na di gumana ung node 2, may unCOMMITted sa node 2, node 1 = on RECOVERY
                    if (node2Connection != null) {
                        node2Connection.end()
                    }

                    //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                    // create log in node1 na di pumasok sa node 2 ung insert, pero successful in node 1
                    // log na nag fail sa node 2
                    /*
                    try {
                        
                        await nodeLogsConnection.query("INSERT INTO `node1_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node2');")
                        console.log("Successful insert in node1 but unsuccessful in node2")
                        nodeLogsConnection.end()
                    } catch(err) {
                        if(nodeLogsConnection != null) {
                            nodeLogsConnection.end()
                        }
                    }
                    */
                }
        } 
        }
    }else if (year >= 1980) { 
        try {
            // throw Error // simulate
            node1Connection = await mysql.createConnection(config.node1conn)
            //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

            await node1Connection.query("set autocommit = 0;")
            await node1Connection.query("START TRANSACTION;")
            await node1Connection.query("LOCK TABLES node1b write;")

            // insert in logs
            /*
            await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1_2');")
            console.log("Start log inserted to node 1 table 2")
            */

            // insert new movie
            //await node1Connection.query("INSERT INTO `node1b` (`name`, `year`, `rank`) values ('" + movieName + "'," + movieYear + "," + movieRank + ");")
            await node1Connection.query(`INSERT INTO node1b (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                if (error) throw error;
                console.log(results);
                res.render('insert', { records: results });
            });

            // update logs 
            /*
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node1_2';", [movieName])
            console.log("Log updated to write in node 1 table 2")
            */
            await node1Connection.query("COMMIT;")
            await node1Connection.query("UNLOCK TABLES;")

            // update logs
            /*
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committing', movieName])
            console.log("Log updated to committing in node 1 table 2")
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committed', movieName])
            console.log("Log updated to committed in node 1 table 2")
            */
            console.log("Inserted to node 1 table b")

            // end connections
            node1Connection.end()
            //nodeLogsConnection.end()

            flag = true //insert in node 1 was successful
        } catch (err) {
            if (node1Connection != null) {
                node1Connection.end()
            }

            /*
            if (nodeLogsConnection != null) {
                nodeLogsConnection.end()
            }*/

            try { //if connection to node 1 fails, try connecting to node 3
                // throw Error // simulate
                node3Connection = await mysql.createConnection(config.node3conn)
                //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                await node3Connection.query("set autocommit = 0;")
                await node3Connection.query("START TRANSACTION;")
                await node3Connection.query("LOCK TABLES node3 write;")

                // insert in logs
                /*
                await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node3');")
                console.log("Start log inserted to node3")
                */

                // insert new movie
                //await node3Connection.query("INSERT INTO `node3` (`name`, `year`, `rank`) values ('" + movieName + "'," + movieYear + "," + movieRank + ");")
                await node3Connection.query(`INSERT INTO node3 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                    if (error) throw error;
                    console.log(results);
                    res.render('insert', { records: results });
                });

                // update logs 
                /*
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node3';", [movieName])
                console.log("Log updated to write in node3")
                */
                await node3Connection.query("COMMIT;")
                await node3Connection.query("UNLOCK TABLES;")

                /*
                // update logs
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committing', movieName])
                console.log("Log updated to committing in node3")
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committed', movieName])
                console.log("Log updated to committed in node3")
                */
                console.log("Inserted to node3")

                // log na nag fail sa node 1
                /*
                await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node1_2');")
                console.log("Successful insert in node3 but unsuccessful in node1")
                */

                // end connections
                node3Connection.end()
                //nodeLogsConnection.end()

                //
            } catch (err) {
                flag2 = true //if there's a failure to connect to node 1 and node 3
                if (node3Connection != null) {
                    node3Connection.end()
                }
                /*
                if (nodeLogsConnection != null) {
                    node3Connection.end()
                }*/

                // update logs status = terminated, since nag error sa lahat
                /*
                try {
                    nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                    await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node3');")
                    console.log("Logs in node3_logs terminated")

                    await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node1');")
                    console.log("Logs in node1_logs terminated")

                } catch(err) {
                    console.log(err)
                    if(nodeLogsConnection != null) {
                        nodeLogsConnection.end()
                    }
                }
                */
            }
        }

        if (flag) {
            // insert to node 3 if node 1 is successful
            try {
                // throw Error // simulate
                node3Connection = await mysql.createConnection(config.node3conn)
                //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                await node3Connection.query("set autocommit = 0;")
                await node3Connection.query("START TRANSACTION;")
                await node3Connection.query("LOCK TABLES node3 write;")

                // insert in logs
                //await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node3');")
                //console.log("Start log inserted to node3")

                // insert new movie
                //await node3Connection.query("INSERT INTO `node3` (`name`, `year`, `rank`) values ('" + movieName + "'," + movieYear + "," + movieRank + ");")
                await node3Connection.query(`INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                    if (error) throw error;
                    console.log(results);
                    res.render('insert', { records: results });
                });

                // update logs 
                /*
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node3';", [movieName])
                console.log("Log updated to write in node3")
                */
                await node3Connection.query("COMMIT;")
                await node3Connection.query("UNLOCK TABLES;")

                // update logs
                /*
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committing', movieName])
                console.log("Log updated to committing in node3")
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committed', movieName])
                console.log("Log updated to committed in node3")
                console.log("Inserted to node3")
                */

                // end connections
                node3Connection.end()
                //nodeLogsConnection.end()
            } catch (err) {
                if (node3Connection != null) {
                    node3Connection.end()
                }
                /*
                if (nodeLogsConnection != null) {
                    nodeLogsConnection.end()
                }
                */

                // log to node 1 na di gumana ung node 3, may unCOMMITted sa node 3, node 1 = on, tas i query sa node 3 ung logged sa node 1
                // create log in node1 na di pumasok sa node 3 ung insert, pero successful in node 1
                // log na nag fail sa node 3
                /*
                try {
                    nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                    await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node3');")
                    console.log("Successful insert in node1 but unsuccessful in node3")
                } catch(err) {
                    if(nodeLogsConnection != null) {
                        nodeLogsConnection.end()
                    }
                }
                */
            }
        }
    }   
    // false pag di na add sa node 1/node2 or 3
    //flag 2 means that insert was failed on all nodes

		if(flag2) {
            console.log('flag2 = true')
			res.send(false)
		} else {
            console.log('insert was completed')
			res.send(true)
		}
}
}
module.exports = inController;