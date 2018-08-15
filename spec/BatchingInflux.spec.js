const BatchingInflux = require("../lib/BatchingInflux");
const MockInflux = require("./support/MockInflux");

describe("BatchingInflux", () => {
	describe("with mocked influx", () => {
		/** @type {BatchingInflux} */
		let batchingInflux;

		const writeInterval = 100;

		beforeEach(() => {
			batchingInflux = new BatchingInflux(
				{},
				{
					writeInterval,
					maxFailedAttempts: 2
				}
			).startPeriodicalWrites();

			// @ts-ignore
			batchingInflux.influx = new MockInflux();
		});

		it("should write points on a given interval", async done => {
			batchingInflux.addPoint(fakePoint);

			expect(batchingInflux.influx.writtenPoints.length).toBe(0, "points should not have been written yet");

			// Wait until interval kicks in
			await wait(writeInterval + 1);

			expect(batchingInflux.influx.writtenPoints.length).toBe(1, "should have been written in batch every X ms");
			expect(batchingInflux.currentBatch.length).toBe(0, "should empty cached points after write");

			done();
		});

		it("should abort writes if failed more than maxFailedAttempts", async done => {
			// Mock failed write
			batchingInflux.influx.addOnWritePointsCallback(() => {
				throw "A mock failure";
			});

			// Add first metric
			batchingInflux.addPoint(fakePoint);

			// ...and wait until interval kicks in
			await wait(writeInterval);

			// Add second metric
			batchingInflux.addPoint(fakePoint);

			// ...and wait until interval kicks in
			await wait(writeInterval);

			// After 2 consequtive failures, the interval should be stopped
			expect(batchingInflux.interval).toBeNull();

			done();
		});

		it("should write points if maxCachedPoints was reached", async done => {
			batchingInflux.maxBatchSize = 2;

			// Add metrics to force write
			batchingInflux.addPoint(fakePoint);
			batchingInflux.addPoint(fakePoint);

			// Wait a bit for write to happen
			await wait(10);

			expect(batchingInflux.currentBatch.length).toBe(0, "should have written cached points");

			done();
		});
	});

	// xdescribe("integration test using *real* influx", () => {
	// 	// Note: This test suite requries that influx db runs locally
	// 	// Start locally i.e. by running docker run -d --name influxdb -p 8086:8086 influxdb

	// 	/** @type {BatchingInflux} */
	// 	let batchingInflux;

	// 	const writeInterval = 100;

	// 	beforeEach(async done => {
	// 		batchingInflux = new BatchingInflux({ database: "batching-influx-test" }, { writeInterval }).startPeriodicalWrites();

	// 		await batchingInflux.influx.dropDatabase(batchingInflux.database);

	// 		done();
	// 	});

	// 	it("should write points to influxdb", async done => {
	// 		batchingInflux.addPoint(fakePoint);
	// 		batchingInflux.addPoint(fakePoint);

	// 		expect(batchingInflux.currentBatch.length).toBe(2);

	// 		await wait(writeInterval);

	// 		expect(batchingInflux.currentBatch.length).toBe(0);

	// 		done();
	// 	});
	// });
});

function wait(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

const fakePoint = {
	measurement: "foo",
	fields: {
		aField: "aField"
	}
};
