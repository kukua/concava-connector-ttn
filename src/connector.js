import bunyan from 'bunyan'
import mqtt from 'mqtt'
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
const ttnHost = process.env['TTN_HOST']
const ttnUser = process.env['TTN_USER']
const ttnPassword = process.env['TTN_PASSWORD']
const deviceIds = process.env['DEVICE_IDS'].split(',')
const deviceIdPrefix = process.env['DEVICE_ID_PREFIX']

// Method for sending data to ConCaVa
function send (deviceId, payload, cb) {
	// global: url, token
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
var client = mqtt.connect(ttnHost, {
	username: ttnUser,
	password: ttnPassword
})

client.on('connect', () => {
	log.info(`Connected to ${ttnHost}.`)

	deviceIds.forEach((id) => {
		client.subscribe(`nodes/${id}/packets`)
		log.info(`Subscribed to ${id}.`)
	})
})

function getDeviceId (topic) {
	let parts = topic.split('/')
	let id = ('' + parts[1]).toLowerCase()
	if (id.length !== 8) return
	return deviceIdPrefix.toLowerCase() + id
}

client.on('message', (topic, message) => {
	if ( ! topic.startsWith('nodes/')) return

	let deviceId = getDeviceId(topic)
	let payload = message.toString()

	log.info({
		type: 'publish', deviceId,
		topic, payload
	})

	if ( ! deviceId) return

	send(deviceId, payload, (err) => {
		log.debug({ type: 'result', deviceId, err })
	})
})
