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
        var insertedId;

        var flag = false;
        var flag2 = false;

        if(year < 1980){
            //select from node 1
            try {
                console.log("flag rn: " + flag)
                console.log('central node');
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to central node');

                await node1Connection.query("set autocommit = 0;")
                await console.log('autocommit = 0')
                await node1Connection.query("START TRANSACTION;")
                await console.log('started transaction')
                await node1Connection.query("LOCK TABLES central write;")
                await console.log('Locked tables central');

                //insert new movie
                //await node1Connection.query(`INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`);
                //console.log("a");
                const sqlEntryFill = 'INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?)';

                //const sqlEntry = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`;
                //console.log("b");
                /*
                node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2], function (err, results) {
                    console.log("present")
                    if (err) {throw err};
                    console.log(results);
                    insertedId = results.id;
                    console.log(insertedId);
                    //res.render('insert', { records: results });
                })*/

                let datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2])
                //console.log(datalist)

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    insertedId = result[0].insertId
                 })               
        
                console.log('performed insert')
                await node1Connection.query("COMMIT;")
                console.log(insertedId)
                console.log('committed')
                await node1Connection.query("UNLOCK TABLES;")
                console.log('tables are unlocked')

                //update logs

                //end connection
                node1Connection.end()
                flag = true
                console.log(flag)

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
            }
            console.log("Finished inserting in node 1")
            if (flag) { //if insert in node 1 was successful, insert in node 2
                try {
                    console.log("---------------")
                    console.log("enters node 2")
                    node2Connection = await mysql.createConnection(config.node2conn)
                    await node2Connection.query("set autocommit = 0;")
                    await console.log('node2: autocommit = 0')
                    await node2Connection.query("START TRANSACTION;")
                    await console.log('node2: start transaction')
                    await node2Connection.query("LOCK TABLES node2 write;")
                    await console.log('node2: lock tables')

                    // insert in logs
                        //await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node2');")
                        //console.log("Start log inserted to node 2")

                    // insert new movie
                    await node2Connection.query(`INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES ('${insertedId}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`);
                    console.log('node2: performed insert')
                    await node2Connection.query("COMMIT;")
                    await console.log('node2: commit')
                    await node2Connection.query("UNLOCK TABLES;")
                    await console.log('node2: unlock tables')

                    // update logs 
                    /*
                    await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node2';", [movieName])
                    console.log("Log updated to write in node 2")
                    */

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
    else if (year >= 1980) { 
        try {
            console.log("Entered >= 1980 condition")
            // throw Error // simulate
            node1Connection = await mysql.createConnection(config.node1conn)
            console.log("Entered >= 1980 condition")

            await node1Connection.query("set autocommit = 0;")
            console.log("autocommit = 0")
            await node1Connection.query("START TRANSACTION;")
            console.log("transaction started")
            await node1Connection.query("LOCK TABLES central write;")
            console.log("tables are locked")

            // insert in logs
            /*
            await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1_2');")
            console.log("Start log inserted to node 1 table 2")
            */

            // insert new movie
            const sqlEntryFill = 'INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?)';
            let datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2])
                //console.log(datalist)

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    insertedId = result[0].insertId
                 })   
            console.log('performed insert')

            // update logs 
            /*
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node1_2';", [movieName])
            console.log("Log updated to write in node 1 table 2")
            */
            await node1Connection.query("COMMIT;")
            console.log("committed")
            await node1Connection.query("UNLOCK TABLES;")
            console.log("tables unlocked")

            // update logs
            /*
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committing', movieName])
            console.log("Log updated to committing in node 1 table 2")
            await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committed', movieName])
            console.log("Log updated to committed in node 1 table 2")
            */
            console.log("Inserted to node 1 central table")

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
                console.log("--------------------")
                console.log("Enter node 3")
                node3Connection = await mysql.createConnection(config.node3conn)
                //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                console.log('node3: established connection')

                await node3Connection.query("set autocommit = 0;")
                console.log('node3: autocommitted')
                await node3Connection.query("START TRANSACTION;")
                console.log('node3: started transaction')
                await node3Connection.query("LOCK TABLES node3 write;")
                console.log('node3: locked tables')

                // insert in logs
                //await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node3');")
                //console.log("Start log inserted to node3")

                // insert new movie
                //await node3Connection.query("INSERT INTO `node3` (`name`, `year`, `rank`) values ('" + movieName + "'," + movieYear + "," + movieRank + ");")
                /*
                await node3Connection.query(`INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES ('${insertedId}','${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                    if (error) throw error;
                    console.log(results);
                    res.render('insert', { records: results });
                });*/

                await node3Connection.query(`INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES ('${insertedId}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`);
                console.log('node3: performed insert')

                // update logs 
                /*
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node3';", [movieName])
                console.log("Log updated to write in node3")
                */
                await node3Connection.query("COMMIT;")
                console.log('node 3: committed')
                await node3Connection.query("UNLOCK TABLES;")
                console.log('node 3: unlocked tables')


                // update logs
                /*
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committing', movieName])
                console.log("Log updated to committing in node3")
                await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committed', movieName])
                console.log("Log updated to committed in node3")
                console.log("Inserted to node3")
                */

                // end connections
                console.log('finished insert in node 3')
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