const node1conn = {
    host: '172.16.3.142',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies'
}

/*
const node1conn = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'net11142',
    database: 'movies'
}
*/

/*
const node2conn = {
    host: '172.16.3.143',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies'
}
*/

const node2conn = {
    host: '172.16.3.143',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies'
}

const node3conn = {
    host: '172.16.3.144',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies'
}
/*
const node2conn = {
    host: "mco2-node2.mysql.database.azure.com",
    port: "3306",
    user: "root",
    password: "Password!",
    database: "node2_db",
    connectionLimit: 10
}

const node3conn = {
    host: "mc02-node3.mysql.database.azure.com",
    port: "3306",
    user: "root",
    password: "Password!",
    database: "node3_db",
    connectionLimit: 10
}

const nodeLogsConn = {
    host: "mco2-logs.mysql.database.azure.com",
    port: "3306",
    user: "MC02GRP21",
    password: "Password!",
    database: "node_logs_db",
    connectionLimit: 10
}
*/

module.exports = { node1conn, node2conn, node3conn }
