'use strict';

var q = require('q');
var _ = require('lodash');
var knexnest = require('../knexnest.js');

var createMockKnexQuery = function (client, data) {
	var expectedClient = client === 'postgres'
		? {config: {client: 'postgres'}}
		: {Raw: {name: client}}
	;
	return {
		client: expectedClient,
		_statements: [
			{grouping: 'columns', value: [
				'something.id AS "_shortName"',
				'something.someproperty AS "_startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName"'
			]},
			{grouping: 'otherstuff', value: ['should not show up in column list']},
			{grouping: 'columns', value: [
				'something.someproperty AS "_someproperty"'
			]},
			{grouping: 'columns', value: [
				'something.id AS _anotherShortName',
				'something.someproperty AS _anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName'
			]},
			{grouping: 'columns', value: [
				'"something".otherProperty AS "_quotesEverywhere"',
				'"something".whatProperty AS _quotesThereButNotHere'
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
				{shortName: '1A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', someproperty: '1C', anotherShortName: '1D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', quotesEverywhere: '1F', quotesThereButNotHere: '1G'},
				{shortName: '2A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', someproperty: '2C', anotherShortName: '2D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2E', quotesEverywhere: '2F', quotesThereButNotHere: '2G'},
				{shortName: '3A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', someproperty: '3C', anotherShortName: '3D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3E', quotesEverywhere: '3F', quotesThereButNotHere: '3G'}
			];
		});
		
		describe('Postgres, knex < 0.8.0', function () {
			beforeEach(function (done) {
				mockKnexQuery = createMockKnexQuery('Raw_PG', [
					{_shortName: '1A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'},
					{_shortName: '2A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', _someproperty: '2C', _anotherShortName: '2D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2E', _quotesEverywhere: '2F', _quotesThereButNotHere: '2G'},
					{_shortName: '3A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', _someproperty: '3C', _anotherShortName: '3D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3E', _quotesEverywhere: '3F', _quotesThereButNotHere: '3G'}
				]);
				
				knexnest(mockKnexQuery).then(function (data) {
					result = data;
					done();
				});
			});
			
			it('should change the column names', function () {
				expect(result).toEqual(expected);
			});
		});
		
		describe('Postgres, knex >= 0.8.0', function () {
			beforeEach(function (done) {
				mockKnexQuery = createMockKnexQuery('postgres', [
					{_shortName: '1A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'},
					{_shortName: '2A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', _someproperty: '2C', _anotherShortName: '2D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2E', _quotesEverywhere: '2F', _quotesThereButNotHere: '2G'},
					{_shortName: '3A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', _someproperty: '3C', _anotherShortName: '3D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3E', _quotesEverywhere: '3F', _quotesThereButNotHere: '3G'}
				]);
				
				knexnest(mockKnexQuery).then(function (data) {
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
					{_shortName: '1A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', _anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'},
					{_shortName: '2A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2B', _someproperty: '2C', _anotherShortName: '2D', _anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '2E', _quotesEverywhere: '2F', _quotesThereButNotHere: '2G'},
					{_shortName: '3A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3B', _someproperty: '3C', _anotherShortName: '3D', _anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '3E', _quotesEverywhere: '3F', _quotesThereButNotHere: '3G'}
				]);
				
				knexnest(mockKnexQuery).then(function (data) {
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
