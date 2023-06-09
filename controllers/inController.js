const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const isolationLevelDefault = `READ UNCOMMITTED`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault


const inController = {
    insertPage: function (req, res) {   
        res.render('in');
    },

    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    insertRecord: async function (req, res) { 

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;
        var insertedId;
        var recentId;
        var results;
        var logId;
        var id;

        var flag = false;
        var flag2 = false;
        var flag3 = false;

        if(year < 1980){
            //select from node 1
            try {
                console.log("flag rn: " + flag)
                console.log('central node');
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to central node');

                await node1Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node1Connection.query("set autocommit = 0;")
                await console.log('autocommit = 0')
                await node1Connection.query("START TRANSACTION;")
                await console.log('started transaction')
                await node1Connection.query("LOCK TABLES central write, logs WRITE;")
                await console.log('Locked tables central');

                var sqlEntryFill = 'SELECT id FROM central ORDER BY id DESC LIMIT 1';
                selectlist = node1Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    id = parseInt(result[0][0].id) + 1
                    console.log("id :")
                    console.log(id)
                }) 

                //logs
                console.log("Start log inserted to central logs")
                var sqlEntryLog = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${id}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node1Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 2, 'start'])
                console.log("after start")
                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                console.log("insert movie")
                //insert new movie
                sqlEntryFill = 'INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                datalist = node1Connection.query(sqlEntryFill, [id, title, year, genre, director, actor1,actor2])
                //console.log(datalist)
                console.log("after insert")
                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    insertedId = result[0].insertId
                    results = result[0]
                 })               
                 console.log("going to commit")

                await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node1Connection.query("COMMIT;")
                console.log('committed')
                await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                await node1Connection.query("UNLOCK TABLES;")
                console.log('tables are unlocked')

                //update logs
                results = [insertedId, title, year, genre, director, actor1, actor2];

                //end connection
                node1Connection.end()
                console.log('ended connection')
                flag = true
                console.log(flag)

            } catch (err) {
                if (node1Connection != null) {
                    node1Connection.end()
                }
                //insert in node 2 if node 1 is not successful
                try {
                    console.log('in node2 because node 1 was unsuccessful');
                    node2Connection = await mysql.createConnection(config.node2conn);
                    console.log('created connection to node 2');

                    await node2Connection.query(setIsolationLevel)
                    console.log("Isolation level is set to: " + isolationLevelDefault)

                    await node2Connection.query("set autocommit = 0;");
                    await node2Connection.query("START TRANSACTION;");
                    await node2Connection.query("LOCK TABLES node2 write, logs WRITE;");
                    
                    //logs
                    console.log("Start log inserted to central logs")
                    var sqlEntryLog = `INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                    //update logs
                    var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                    let datalist = node2Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
                
                    datalist.then(function(result) {
                        console.log(result)
                        logId = result[0].insertId
                        console.log("logid:")
                        console.log(logId)
                    }) 

                    sqlEntryFill = 'INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                    datalist = node2Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])
                    //console.log(datalist)

                    datalist.then(function(result) {
                        console.log(result)
                        console.log(result[0].insertId) // "Some User token"
                        insertedId = result[0].insertId
                        results = result[0]
                    }) 
                    await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                    await node2Connection.query("COMMIT;");
                    await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    await node2Connection.query("UNLOCK TABLES;");

                    node2Connection.end()
                    flag3 = true
                    console.log('gonna render results');
                    res.render('in',  { records: results });

                } catch (err) {
                    flag2=true
                    if (node2Connection != null) {
                        node2Connection.end()
                    }
                    console.log('node2 failed')   
                    res.render('in')     
                }
                //if node 2 inserts then we insert to node 1
                if (flag3) {
                    try { 
                        console.log("inserts to node 1 after node 2")
                        node1Connection = await mysql.createConnection(config.node1conn)
                        console.log('connected to central node');

                        await node1Connection.query(setIsolationLevel)
                        console.log("Isolation level is set to: " + isolationLevelDefault)

                        await node1Connection.query("set autocommit = 0;")
                        await console.log('autocommit = 0')
                        await node1Connection.query("START TRANSACTION;")
                        await console.log('started transaction')
                        await node1Connection.query("LOCK TABLES central write, logs WRITE;")
                        await console.log('Locked tables central');

                        //logs
                        console.log("Start log inserted to central logs")
                        var sqlEntryLog = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;
                        
                        //update logs
                        var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                        let datalist = node1Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
                
                        datalist.then(function(result) {
                            console.log(result)
                            logId = result[0].insertId
                            console.log("logid:")
                            console.log(logId)
                        }) 

                        //insert new movie
                        sqlEntryFill = 'INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                        datalist = node1Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])
                    

                        datalist.then(function(result) {
                            console.log(result)
                            console.log(result[0].insertId) // "Some User token"
                            insertedId = result[0].insertId
                            results = result[0]
                        })               
        
                        console.log('performed insert')
                        await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                        await node1Connection.query("COMMIT;")
                        await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                        await node1Connection.query("UNLOCK TABLES;")
                        console.log('tables are unlocked')

                        //end connection
                        node1Connection.end()
                }
                catch (err) {
                    if (node1Connection != null) {
                        node1Connection.end()
                    }
                }
            }
        }
            console.log("Finished inserting in node 1")
            if (flag) { //if insert in node 1 was successful, insert in node 2
                try {
                    console.log("---------------")
                    console.log("enters node 2")
                    node2Connection = await mysql.createConnection(config.node2conn)

                    await node2Connection.query(setIsolationLevel)
                    console.log("Isolation level is set to: " + isolationLevelDefault)

                    await node2Connection.query("set autocommit = 0;")
                    await console.log('node2: autocommit = 0')
                    await node2Connection.query("START TRANSACTION;")
                    await console.log('node2: start transaction')
                    await node2Connection.query("LOCK TABLES node2 write, logs WRITE;")
                    await console.log('node2: lock tables')

                    //logs
                    //await node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;");
                    console.log("Start log inserted to central logs")
                    var sqlEntryLog = `INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES ('${id}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;
                    
                    //update logs
                    var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                    let datalist = node2Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
            
                    datalist.then(function(result) {
                        console.log(result)
                        logId = result[0].insertId
                        console.log("logid:")
                        console.log(logId)
                    }) 

                    // insert new movie
                    sqlEntryFill = 'INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                    datalist = node2Connection.query(sqlEntryFill, [id, title, year, genre, director, actor1,actor2])
                    //console.log(datalist)

                    datalist.then(function(result) {
                        console.log(result)
                        console.log(result[0].insertId) // "Some User token"
                        insertedId = result[0].insertId
                        results = result[0]
                    })               
            
                    console.log('performed insert')

                    await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                    await node2Connection.query("COMMIT;")
                    await console.log('node2: commit')
                    await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    await node2Connection.query("UNLOCK TABLES;")
                    await console.log('node2: unlock tables')

                    node2Connection.end()

                } catch (err) {
                    // log to node 1 na di gumana ung node 2, may unCOMMITted sa node 2, node 1 = on RECOVERY
                    if (node2Connection != null) {
                        node2Connection.end()
                    }
                }
        
        }
    }
    else if (year >= 1980) { 
        try {
            console.log(">=1980")
            console.log('central node');
            node1Connection = await mysql.createConnection(config.node1conn)
            console.log('connected to central node');

            await node1Connection.query(setIsolationLevel)
            console.log("Isolation level is set to: " + isolationLevelDefault)

            await node1Connection.query("set autocommit = 0;")
            await console.log('autocommit = 0')
            await node1Connection.query("START TRANSACTION;")
            await console.log('started transaction')
            await node1Connection.query("LOCK TABLES central write, logs WRITE;")
            await console.log('Locked tables central');

            var sqlEntryFill = 'SELECT id FROM central ORDER BY id DESC LIMIT 1';
                selectlist = node1Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    id = parseInt(result[0][0].id) + 1
                    console.log("id :")
                    console.log(id)
                }) 

            //logs
            console.log("Start log inserted to central logs")
            var sqlEntryLog = `INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES ('${id}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

            //update logs
            var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
            let datalist = node1Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
            console.log("after start")
            datalist.then(function(result) {
                console.log(result)
                logId = result[0].insertId
                console.log("logid:")
                console.log(logId)
            }) 
            console.log("insert movie")
            //insert new movie
            sqlEntryFill = 'INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
            datalist = node1Connection.query(sqlEntryFill, [id, title, year, genre, director, actor1,actor2])
            //console.log(datalist)
            console.log("after insert")
            datalist.then(function(result) {
                console.log(result)
                console.log(result[0].insertId) // "Some User token"
                insertedId = result[0].insertId
                results = result[0]
            })               
            console.log("going to commit")

            await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
            await node1Connection.query("COMMIT;")
            console.log('committed')
            await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
            await node1Connection.query("UNLOCK TABLES;")
            console.log('tables are unlocked')

            //update logs
            results = [id, title, year, genre, director, actor1, actor2];

            //end connection
            node1Connection.end()
            console.log('ended connection')
            flag = true
            console.log(flag)

        } catch (err) {
            if (node1Connection != null) {
                node1Connection.end()
            }
            try { //if connection to node 1 fails, try connecting to node 3
                // throw Error // simulate
                console.log("if connection to node 1 fails, try connecting to node 3")
                node3Connection = await mysql.createConnection(config.node3conn)
                //nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                await node3Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node3Connection.query("set autocommit = 0;")
                await node3Connection.query("START TRANSACTION;")
                await node3Connection.query("LOCK TABLES node3 write, logs WRITE;")

                //logs
                console.log("Start log inserted to central logs")
                var sqlEntryLog = `INSERT INTO node3 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                datalist = node3Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
    
                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                var sqlEntryFill = 'INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                let datalist = node3Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])
                //console.log(datalist)

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    insertedId = result[0].insertId
                    results = result[0]
                })               
        
                console.log('performed insert')
                await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node3Connection.query("COMMIT;")
                await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                await node3Connection.query("UNLOCK TABLES;")

                console.log("Inserted to node3")

                // end connections
                node3Connection.end()
                flag3=true
                //nodeLogsConnection.end()

            } catch (err) {
                console.log("failure to connect node 1 and node 3")
                flag2 = true //if there's a failure to connect to node 1 and node 3
                if (node3Connection != null) {
                    node3Connection.end()
                }
            }
               if (flag3) {
                try{
                    console.log("inserts to node 1 after node 3")
                    node1Connection = await mysql.createConnection(config.node1conn)
                    console.log('connected to central node');

                    await node1Connection.query(setIsolationLevel)
                    console.log("Isolation level is set to: " + isolationLevelDefault)

                    await node1Connection.query("set autocommit = 0;")
                    await console.log('autocommit = 0')
                    await node1Connection.query("START TRANSACTION;")
                    await console.log('started transaction')
                    await node1Connection.query("LOCK TABLES central write, logs WRITE;;")
                    await console.log('Locked tables central');

                    //logs
                    console.log("Start log inserted to central logs")
                    var sqlEntryLog = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                    //update logs
                    var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                    datalist = node1Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
    
                    datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                    }) 
                    
                    //insert new movie
                    var sqlEntryFill = 'INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES (?, ?,?,?,?,?,?)';
                    let datalist = node1Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])
                    

                    datalist.then(function(result) {
                        console.log(result)
                        console.log(result[0].insertId) // "Some User token"
                        insertedId = result[0].insertId
                        results = result[0]
                    })               
        
                    console.log('performed insert')
                    await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                    await node1Connection.query("COMMIT;")
                    console.log('committed')
                    await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    await node1Connection.query("UNLOCK TABLES;")
                    console.log('tables are unlocked')

                    //end connection
                    node1Connection.end()
                }
                catch (err) {
                    if (node1Connection != null) {
                        node1Connection.end()
                    }
                }
            }
        }

        if (flag) {
            // insert to node 3 if node 1 is successful
            try {
                console.log("---------------")
                console.log("enters node 3")
                node3Connection = await mysql.createConnection(config.node3conn)

                await node3Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node3Connection.query("set autocommit = 0;")
                await console.log('node3: autocommit = 0')
                await node3Connection.query("START TRANSACTION;")
                await console.log('node3: start transaction')
                await node3Connection.query("LOCK TABLES node3 WRITE, logs WRITE;")
                await console.log('node3: lock tables')

                //logs
                //await node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;");
                console.log("Start log inserted to central logs")
                var sqlEntryLog = `INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES ('${id}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;
                    
                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node3Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])
            
                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                // insert new movie
                sqlEntryFill = 'INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                datalist = node3Connection.query(sqlEntryFill, [id, title, year, genre, director, actor1,actor2])
                //console.log(datalist)

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    insertedId = result[0].insertId
                    results = result[0]
                })               
            
                console.log('performed insert')

                await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node3Connection.query("COMMIT;")
                await console.log('node3: commit')
                await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                await node3Connection.query("UNLOCK TABLES;")
                await console.log('node3: unlock tables')

                node3Connection.end()

                } catch (err) {
                    flag2=true
                    // log to node 1 na di gumana ung node 2, may unCOMMITted sa node 2, node 1 = on RECOVERY
                    if (node3Connection != null) {
                        node3Connection.end()
                    }
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
			//res.send(true)
            res.render('in', {id: id, title: title, year: year, genre: genre, director: director, 
				actor1: actor1, actor2: actor2 })
		}
    }
}
module.exports = inController;