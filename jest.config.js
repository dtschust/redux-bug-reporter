module.exports = {
	testMatch: [
		'<rootDir>/test/**/*.js'
	],
	"transform": {
		"^.+\\.js$": "babel-jest",
		"^.+\\.jsx$": "babel-jest"
	},
	"setupFiles": [
		"raf/polyfill"
	],
	"coverageDirectory": "./coverage/"
}
