# Batching Influx Client

Uses Influx client under the hood but adds batching of writes by writing on a set interval and by specifying max batch size.

Effectively this will make the client write to Influx either when batch size is reached or on given interval and hence will lead to better performance (batching writes is the recommended way to go according to Influx docs).

## Usage

Include in project:

    npm install batching-influx --save

Create client:

```javascript
const BatchingInflux = require("batching-influx");

const influx = new BatchingInflux(
	{
		host: "localhost",
		database: "a_database",
		schema: [
			// ...
		]
	},
	{
		maxBatchSize: 5000,
		writeInterval: 5 * 1000
	}
).startPeriodicalWrites();

influx.add;
```

## License

MIT

## Author(s)

People at Frost Experience AB.
