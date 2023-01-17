const express = require('express')
const axios = require('axios')
const rl = require('express-rate-limit')
const mysql = require('mysql')
const { Webhook } = require('dis-logs')
const schedule = require('node-schedule')
const config = require('./config')
const v1 = require('./routes/v1')

const app = express()
const log = new Webhook(config.log_webhook);

const public_limiter = rl({
	windowMs: 60 * 1000, // 1 minutes
	max: 100,
    handler: function (req, res) {
        return res.status(429).json({
          error: 'You sent too many requests. Please wait a while and then try again.'
        })
    }
})

const db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	database : config.db.database
});

app.use('api/v1', public_limiter)
app.use(express.json())

app.set('db', db);
app.set('log', log);
app.set('mysql', mysql);
app.set('axios', axios);
app.set('config', config);
app.set('schedule', schedule);
// app.set('trust proxy', 2); // https://github.com/express-rate-limit/express-rate-limit/issues/165
const utils = require('./utils')(app)
const scraper = require('./scraper')(app)
app.set('utils', utils);
app.set('scraper', scraper);

app.get('/', (req, res) => {
    res.send({
		endpoints: {
			proxies: "/api/v1/proxies/<type>",
        },
		message: 'The description of the endpoints is listed in the endpoints object.',
		success: true
    })
})

if (config.debug)
	app.use(function(req, res, next) {
		console.log(`${req.ip} | ${req.originalUrl}`)
		next()
	});


// app.get('/ip', (request, response) => response.send(request.ip))

app.get('/api/v1/proxies/:type', v1.handle)

app.use(function(req, res, next) {
    res.status(404).send({
		success: false,
        message: `Invalid endpoint.`
    });
});

app.listen(config.api.port, () => {
	console.log(`API serving at http://127.0.0.1:${config.api.port}`)
})