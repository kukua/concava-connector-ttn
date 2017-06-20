import bunyan from 'bunyan'
import ttn from 'ttn'
import request from 'request'

// Try loading dotfile (for local development)
try { require('dotenv').config() } catch (e) { /* noop */ }

// Logger
const debug = (process.env['DEBUG'] === 'true' || process.env['DEBUG'] === '1')
const logFile = (process.env['LOG_FILE'] || '/tmp/output.log')
const log = bunyan.createLogger({
	name: (process.env['LOG_NAME'] || 'concava-connector-ttn'),
	streams: [
		{ level: 'warn', stream: process.stdout },
		{ level: (debug ? 'debug' : 'info'), path: logFile }
	]
})

// Exception handling
process.on('uncaughtException', (err) => {
	log.error({ type: 'uncaught-exception', stack: err.stack }, '' + err)
})

// Configuration
const url = process.env['CONCAVA_URL']
const token = process.env['CONCAVA_AUTH_TOKEN']
const region = process.env['TTN_REGION']
const appId = process.env['TTN_APP_ID']
const accessKey = process.env['TTN_ACCESS_KEY']
const options = {
	protocol: 'mqtt',
}

// Method for sending data to ConCaVa
function send (deviceId, payload, cb) {
	// Global: request, url, token
	request.post({
		url,
		body: Buffer.concat([new Buffer(deviceId, 'hex'), payload]),
		headers: {
			'Content-Type': 'application/octet-stream',
			'Authorization': 'Token ' + token,
		},
	}, function (err, httpResponse, body) {
		if (err) return cb(err)

		if (httpResponse.statusCode !== 200) {
			return cb('Error in ConCaVa (' + httpResponse.statusMessage + '): ' + body)
		}

		cb()
	})
}

// Connect to TTN MQTT broker
const client = new ttn.data.MQTT(region, appId, accessKey, options)

client.on('connect', () => {
	log.info(`Connected to application ${appId} in ${region.toUpperCase()}.`)
})

client.on('error', (err) => {
	log.error(err)
})

client.on('message', (deviceId, data) => {
	log.info({ type: 'payload', deviceId, data })

	send(data.hardware_serial, data.payload_raw, (err) => {
		log.debug({ type: 'result', deviceId, err })
	})
})
