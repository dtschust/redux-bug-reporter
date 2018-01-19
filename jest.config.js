module.exports = {
	testMatch: [
		'<rootDir>/test/**/*.js'
	],
	setupFiles: [
		'raf/polyfill'
	],
	coverageDirectory: './coverage/',
	snapshotSerializers: ['enzyme-to-json/serializer'],
}
