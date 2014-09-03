'use strict';

var q = require('q');
var _ = require('lodash');
var knexnest = require('../knexnest.js');

var createMockKnexQuery = function (client, data) {
	return {
		client: {Raw: {name: client}},
		_statements: [
			{grouping: 'columns', value: [
				'something.id AS "_shortName"',
				'something.someproperty AS "_startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName"'
			]},
			{grouping: 'otherstuff', value: ['should not show up in column list']},
			{grouping: 'columns', value: [
				'something.someproperty AS "_someproperty"'
			]}
		],
		then: function (callback) {
			var deferred = q.defer();
			
			process.nextTick(function () {
				callback(data);
			});
			
			return deferred.promise;
		},
		catch: function (callback) {
		}
	};
};

describe('KnexNest', function () {
	var mockKnexQuery, sampleTabluarData, result, expected;
	
	describe('columnNameComplianceMapping', function () {
		beforeEach(function () {
			expected = [
				{shortName: '1A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', someproperty: '1B'},
				{shortName: '2A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', someproperty: '2B'},
				{shortName: '3A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', someproperty: '3B'}
			];
		});
		
		describe('Postgres', function () {
			beforeEach(function (done) {
				mockKnexQuery = createMockKnexQuery('Raw_PG', [
					{_shortName: '1A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1B'},
					{_shortName: '2A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', _someproperty: '2B'},
					{_shortName: '3A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', _someproperty: '3B'}
				]);
				
				KnexNest(mockKnexQuery).then(function (data) {
					result = data;
					done();
				});
			});
			
			it('should change the column names', function () {
				expect(result).toEqual(expected);
			});
		});
		
		describe('Non Postgres', function () {
			beforeEach(function (done) {
				mockKnexQuery = createMockKnexQuery('Raw', [
					{_shortName: '1A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1B'},
					{_shortName: '2A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', _someproperty: '2B'},
					{_shortName: '3A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', _someproperty: '3B'}
				]);
				
				KnexNest(mockKnexQuery).then(function (data) {
					result = data;
					done();
				});
			});
			
			it('should change the column names', function () {
				expect(result).toEqual(expected);
			});
		});
	});
});
