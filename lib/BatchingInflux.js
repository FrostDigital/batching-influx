const Influx = require("influx");
const ms = require("ms");
const influxDbUrlParser = require("./influx-db-url-parser");

const DEFAULT_WRITE_INTERVAL = ms("30s");
const DEFAULT_MAX_CACHED_POINTS = 4000;
const MAX_FAILED_WRITES_UNTIL_ABORT = 4;

/**
 * Influx client used to write points to InfluxDB.
 *
 * The client will cache points and send to influx in batches according to
 * best Influx best practises.
 *
 * The batch is either sent ever X ms as configured by `writeInterval` or when
 * maximum number of cached points has been reached set by `maxCachedPoints`.
 */
class BatchingInflux extends Influx.InfluxDB {
	/**
	 *
	 * @param {Object} influxConfig influx client config passed to influx client
	 * @param {Object} cacheConfig influx client config passed to influx client
	 * @param {Number=} cacheConfig.maxBatchSize max cached points until a write to influx happens
	 * @param {Number=} cacheConfig.writeInterval how often points are written to influx
	 * @param {Number=} cacheConfig.maxFailedAttempts how many consequtive times write can fail until all write stops
	 * @param {Function=} cacheConfig.onWriteBatch callback invoked before batch is written
	 */
	constructor(
		influxConfig,
		{
			writeInterval = DEFAULT_WRITE_INTERVAL,
			maxBatchSize = DEFAULT_MAX_CACHED_POINTS,
			maxFailedAttempts = MAX_FAILED_WRITES_UNTIL_ABORT,
			onWriteBatch
		}
	) {
		if (influxConfig.url) {
			const parsedUrl = influxDbUrlParser(influxConfig.url);
			influxConfig = Object.assign(influxConfig, parsedUrl);
		}

		super(influxConfig);

		this.writeInterval = writeInterval;
		this.failedWriteAttempts = 0;
		this.maxFailedAttempts = maxFailedAttempts;
		this.maxBatchSize = maxBatchSize;
		this.onWriteBatch = onWriteBatch;
		this.database = influxConfig.database;
		this.currentBatch = [];
	}

	/**
	 * Start periodical writes to Influx.
	 */
	startPeriodicalWrites() {
		this.interval = setInterval(
			() => this._writeCachedPoints(),
			this.writeInterval
		);
		return this;
	}

	/**
	 * Add HTTP metric.
	 *
	 * Will add to cache and later written to influx in a batch.
	 *
	 * @param {Object|Array} point point or points
	 */
	addPoint(point) {
		this.currentBatch = this.currentBatch.concat(point);

		if (this.currentBatch.length >= this.maxBatchSize) {
			// Force write to Influx if we have that many cached points
			this._writeCachedPoints();
		}
	}

	/**
	 * Write cached points to influx db.
	 */
	async _writeCachedPoints() {
		const pointsToSend = this.currentBatch;

		this.currentBatch = [];

		if (pointsToSend.length) {
			if (this.onWriteBatch) {
				this.onWriteBatch(pointsToSend);
			}

			try {
				await this.writePoints(pointsToSend);
				this.failedWriteAttempts = 0;
			} catch (err) {
				console.log("Failed to write points to influx:", err);
				this.failedWriteAttempts++;

				if (this.failedWriteAttempts >= this.maxFailedAttempts) {
					console.log(
						`Aborting writes to influx, has failed to write ${
							this.failedWriteAttempts
						} times`
					);
					this._stopWrites();
				}
			}
		}
	}

	/**
	 * Stop periodical writes to influx.
	 */
	_stopWrites() {
		clearInterval(this.interval);
		this.interval = null;
	}
}

module.exports = BatchingInflux;
