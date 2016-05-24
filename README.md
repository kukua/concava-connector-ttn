# The Things Network Connector

> TTN MQTT connector for forwarding payloads to ConCaVa.

## Installation

The TTN MQTT connector can be run as a NodeJS program or in a Docker container.

Make sure [ConCaVa](https://github.com/kukua/concava) is setup as well.
See [`.env.sample`](https://github.com/kukua/concava-connector-ttn/tree/master/.env.sample) for the default configuration.

### NodeJS

```bash
git clone https://github.com/kukua/concava-connector-ttn.git
cd concava-connector-ttn
cp .env.sample .env
chmod 600 .env
# > Edit .env

npm install
npm run compile
npm start
```

Tested with NodeJS v5.1

### Docker

First, [install Docker](http://docs.docker.com/engine/installation/). Then run:

```bash
curl https://raw.githubusercontent.com/kukua/concava-connector-ttn/master/.env.sample > .env
chmod 600 .env
# > Edit .env

touch $PWD/ttn.log
docker run -d -p 3333:3333 -p 5555:5555 \
	-v $PWD/ttn.log:/tmp/output.log
	--env-file .env --name ttn_connector \
	kukuadev/concava-connector-ttn
```

Tested with Docker v1.9.

## Contribute

Your help and feedback are highly appreciated!

## License

This software is licensed under the [MIT license](https://github.com/kukua/concava-connector-ttn/blob/master/LICENSE).

© 2016 Kukua BV
