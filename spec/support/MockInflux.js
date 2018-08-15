class MockInflux {
	constructor() {
		this.writtenPoints = [];
	}

	async writePoints(points) {
		if (this.onWritePoints) {
			this.onWritePoints(points);
		} else {
			this.writtenPoints = this.writtenPoints.concat(points);
		}
	}

	addOnWritePointsCallback(cb) {
		this.onWritePoints = cb;
	}

	async getDatabaseNames() {
		return [];
	}

	async createDatabase(name) {
		return;
	}
}

module.exports = MockInflux;
