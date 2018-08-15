const INFLUX_URL_REGEXP = /influxdb\:\/\/(.*?):(.*?)\/(.*)/;
const INFLUX_URL_WITH_CREDENTIALS_REGEXP = /influxdb\:\/\/(.*?):(.*?)@(.*?):(.*?)\/(.*)/;

/**
 * Parses string on format (both are valid):
 *
 * influxdb://{username}:{password}@{host}:{port}/{database}
 * influxdb://{host}:{port}/{database}
 */
function parseInfluxDbUrl(url) {
	const hasCredentials = url.includes("@");
	const regExp = hasCredentials
		? INFLUX_URL_WITH_CREDENTIALS_REGEXP
		: INFLUX_URL_REGEXP;
	const match = regExp.exec(url);

	const parsedConnectionObj = {};

	try {
		if (hasCredentials) {
			parsedConnectionObj["username"] = match[1];
			parsedConnectionObj["password"] = match[2];
			parsedConnectionObj["host"] = match[3];
			parsedConnectionObj["port"] = parseInt(match[4], 10);
			parsedConnectionObj["database"] = match[5];
		} else {
			parsedConnectionObj["host"] = match[1];
			parsedConnectionObj["port"] = parseInt(match[2], 10);
			parsedConnectionObj["database"] = match[3];
		}
	} catch (err) {
		throw "Invalid InfluxDB url " + url;
	}

	return parsedConnectionObj;
}

module.exports = parseInfluxDbUrl;
