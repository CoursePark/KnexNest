'use strict';

var q = require('q');
var _ = require('lodash');
var knexnest = require('../knexnest.js');

var createMockKnexQuery = function (client, queryType, data) {
	var expectedClient = client === 'postgres'
		? {config: {client: 'postgres'}}
		: {Raw: {name: client}}
	;
	var arr = queryType === 'array' && '_' || '';
	return {
		client: expectedClient,
		_statements: [
			{grouping: 'columns', value: [
				'something.id AS "' + arr + 'shortName"',
				'something.someproperty AS "' + arr + 'startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName"'
			]},
			{grouping: 'otherstuff', value: ['should not show up in column list']},
			{grouping: 'columns', value: [
				'something.someproperty AS "' + arr + 'someproperty"'
			]},
			{grouping: 'columns', value: [
				'something.id AS ' + arr + 'anotherShortName',
				'something.someproperty AS ' + arr + 'anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName'
			]},
			{grouping: 'columns', value: [
				'"something".otherProperty AS "' + arr + 'quotesEverywhere"',
				'"something".whatProperty AS ' + arr + 'quotesThereButNotHere'
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
	var result, error;
	
	var scenarioList = [
		{
			describe: 'column name compliance for postgres connection and knex < 0.8.0',
			mockKnexQuery: createMockKnexQuery('Raw_PG', 'array', [
				{_shortName: '1A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'}
			]),
			listOnEmpty: undefined,
			it: 'should map the column names',
			expectResult: [
				{shortName: '1A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', someproperty: '1C', anotherShortName: '1D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', quotesEverywhere: '1F', quotesThereButNotHere: '1G'},
			],
			expectError: null
		},
		{
			describe: 'column name compliance for postgres connection and knex >= 0.8.0',
			mockKnexQuery: createMockKnexQuery('postgres', 'array', [
				{_shortName: '1A', col_0_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', col_1_hortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'}
			]),
			listOnEmpty: undefined,
			it: 'should map the column names',
			expectResult: [
				{shortName: '1A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', someproperty: '1C', anotherShortName: '1D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', quotesEverywhere: '1F', quotesThereButNotHere: '1G'}
			],
			expectError: null
		},
		{
			describe: 'column name compliance for non-postgres connection',
			mockKnexQuery: createMockKnexQuery('Raw', 'array', [
				{_shortName: '1A', _startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', _someproperty: '1C', _anotherShortName: '1D', _anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', _quotesEverywhere: '1F', _quotesThereButNotHere: '1G'}
			]),
			listOnEmpty: undefined,
			it: 'should map the column names',
			expectResult: [
				{shortName: '1A', startingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1B', someproperty: '1C', anotherShortName: '1D', anotherStartingShortOkNotSoShortGettingLongOkThisQaulifiesAsALongReallyReallyLongName: '1E', quotesEverywhere: '1F', quotesThereButNotHere: '1G'}
			],
			expectError: null
		},
		{
			describe: 'array query with empty result and no listOnEmpty hint for postgres connection',
			mockKnexQuery: createMockKnexQuery('postgres', 'array', []),
			listOnEmpty: undefined,
			it: 'should return an empty array',
			expectResult: [],
			expectError: null
		},
		{
			describe: 'array query with empty result and listOnEmpty hint for postgres connection',
			mockKnexQuery: createMockKnexQuery('postgres', 'array', []),
			listOnEmpty: true,
			it: 'should return an empty array',
			expectResult: [],
			expectError: null
		},
		{
			describe: 'array query with empty result and no listOnEmpty hint for non-postgres connection',
			mockKnexQuery: createMockKnexQuery('Raw', 'array', []),
			listOnEmpty: undefined,
			it: 'should return null',
			expectResult: null,
			expectError: null
		},
		{
			describe: 'array query with empty result and listOnEmpty hint for non-postgres connection',
			mockKnexQuery: createMockKnexQuery('Raw', 'array', []),
			listOnEmpty: true,
			it: 'should return empty array',
			expectResult: [],
			expectError: null
		},
		{
			describe: 'object query with empty result and no listOnEmpty hint for postgres connection',
			mockKnexQuery: createMockKnexQuery('postgres', 'object', []),
			listOnEmpty: undefined,
			it: 'should return an empty array',
			expectResult: null,
			expectError: null
		},
		{
			describe: 'object query with empty result and listOnEmpty hint for postgres connection',
			mockKnexQuery: createMockKnexQuery('postgres', 'object', []),
			listOnEmpty: true,
			it: 'should throw error',
			expectResult: null,
			expectError: 'listOnEmpty param conflicts with query which specifies a object or null result'
		},
		{
			describe: 'object query with empty result and no listOnEmpty hint for non-postgres connection',
			mockKnexQuery: createMockKnexQuery('Raw', 'object', []),
			listOnEmpty: undefined,
			it: 'should return null',
			expectResult: null,
			expectError: null
		},
		{
			describe: 'object query with empty result and listOnEmpty hint for non-postgres connection',
			mockKnexQuery: createMockKnexQuery('Raw', 'object', []),
			listOnEmpty: true,
			it: 'should return an empty array',
			expectResult: [],
			expectError: null
		}
	];
	
	_.each(scenarioList, function (scenario) {
		describe(scenario.describe, function () {
			beforeEach(function (done) {
				result = error = undefined;
				
				knexnest(scenario.mockKnexQuery, scenario.listOnEmpty)
					.then(function (data) {
						result = data;
						done();
					})
					.catch(function (err) {
						error = err;
						done();
					})
				;
			});
			
			it(scenario.it, function () {
				if (scenario.expectError) {
					expect(error).toEqual(scenario.expectError);
				} else {
					expect(result).toEqual(scenario.expectResult);
				}
			});
		});
	});
});
