'use strict';

var Q, NestHydrationJS, KnexNest;

Q = require('q');
NestHydrationJS = require('nesthydrationjs');

/* expects a knex object and returns a promise */
KnexNest = function (knexQuery, listOnEmpty) {
	var deferred, structPropToColumnMap, columnList, aliasList, renamedMap, uniqueId, renamedColumnList, i, column, alias, prepend, renamed, data;
	
	deferred = Q.defer();
	
	// structPropToColumnMap will be sorted out properly inside nest of
	// NestHydration this just indicates if empty should be object or array
	structPropToColumnMap = listOnEmpty == true ? true : null;
	
	if (knexQuery.client.Raw.name === 'Raw_PG') {
		// Postgres limit column name lengths to 63 characters, need to work
		// around that.
		// Knex doesn't provide direct useful information about the connection
		// using the above indirect and brittle technique to determine that
		// Postgres is being used
		// Knex also doesn't provide get or set mechanisms for the column
		// information once received by select method. So the following gets
		// dirty by reaching in pull out the _statement property, filtering
		// it for columns, processes those and puts the new values back in,
		// wiping out the old columns
		
		columnList = [];
		if (knexQuery._statements === undefined) {
			deferred.reject('knex query object not structured as expected for KnexNest: does not have _statements property');
			return deferred.promise;
		}
		
		for (i = 0; i < knexQuery._statements.length; i++) {
			if (knexQuery._statements[i].grouping === undefined || knexQuery._statements[i].grouping !== 'columns') {
				continue;
			}
			
			if (knexQuery._statements[i].value === undefined) {
				deferred.reject('knex query object not structured as expected for KnexNest: _statements item with column grouping does not have value property');
				return deferred.promise;
			}
			// columns statement, use it
			columnList = columnList.concat(knexQuery._statements[i].value);
		}
		
		aliasList = [];
		renamedMap = {};
		uniqueId = 0;
		renamedColumnList = [];
		
		for (i = 0; i < columnList.length; i++) {
			column = columnList[i];
			if (column.substr(-1) === '"') {
				// assume the line has the format
				//   tableNameOrAlias.columnName  "alias"
				// or
				//   tableNameOrAlias.columnName AS "alias"
				alias = column.slice(column.indexOf('"') + 1, -1);
				
				if (alias.length > KnexNest.MAX_POSTGRES_COLUMN_NAME_LENGTH) {
					// shorten the alias to allowed size
					prepend = 'col_' + (uniqueId++) + '_';
					renamed = prepend + alias.substr(-1 * KnexNest.MAX_POSTGRES_COLUMN_NAME_LENGTH + prepend.length);
					// add to mapping used after db executed to reverse this rename
					renamedMap[alias] = renamed;
					// replace the original alias with the shortened one
					renamedColumnList.push(column.substr(0, column.indexOf('"')) + '"' + renamed + '"');
				} else {
					renamedColumnList.push(column);
				}
				aliasList.push(alias);
			} else if (column.indexOf(' AS ') !== -1 || column.indexOf(' as ') !== -1) {
				// assume the line has the format
				//   tableNameOrAlias.columnName AS alias
				alias = column.substr(column.lastIndexOf(' ') + 1);
				
				if (alias.length > KnexNest.MAX_POSTGRES_COLUMN_NAME_LENGTH) {
					// shorten the alias to allowed size
					prepend = 'col_' + (uniqueId++) + '_';
					renamed = prepend + alias.substr(-1 * KnexNest.MAX_POSTGRES_COLUMN_NAME_LENGTH + prepend.length);
					// add to mapping used after db executed to reverse this rename
					renamedMap[alias] = renamed;
					// replace the original alias with the shortened one
					renamedColumnList.push(column.substr(0, column.lastIndexOf(' ') + 1) + renamed);
				} else {
					renamedColumnList.push(column);
				}
				aliasList.push(alias);
			} else if (column.indexOf('.') !== -1) {
				// assume the line has the format
				//   tableNameOrAlias.columnName
				aliasList.push(column.substr(column.indexOf('.') + 1));
				renamedColumnList.push(column);
			} else {
				// assume the line has the format
				//   columnName
				aliasList.push(column);
				renamedColumnList.push(column);
			}
		}
		
		// delete the columns statements and replace with one
		for (i = 0; i < knexQuery._statements.length; i++) {
			if (knexQuery._statements[i].grouping !== undefined && knexQuery._statements[i].grouping === 'columns') {
				knexQuery._statements.splice(i, 1);
				i--;
			}
		}
		knexQuery._statements.push({grouping: 'columns', value: renamedColumnList});
		
		// manually specify the propertyMapping based on the aliases determined in rename process
		structPropToColumnMap = NestHydrationJS.structPropToColumnMapFromColumnHints(aliasList, renamedMap);
	}
	
	knexQuery
		.then(function (data) {
			deferred.resolve(NestHydrationJS.nest(data, structPropToColumnMap));
		})
		.catch(function (err) {
			deferred.reject(err);
		})
	;
	
	return deferred.promise;
};

KnexNest.MAX_POSTGRES_COLUMN_NAME_LENGTH = 63;

module.exports = KnexNest;
