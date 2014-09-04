'use strict';

var q = require('q');
var NestHydrationJS = require('nesthydrationjs');

/* expects a knex object and returns a promise */
var knexnest = function (knexQuery, listOnEmpty) {
	var deferred = q.defer();
	
	// structPropToColumnMap will be sorted out properly inside nest of
	// NestHydration this just indicates if empty should be object or array
	var structPropToColumnMap = listOnEmpty == true ? true : null;
	
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
		
		if (knexQuery._statements === undefined) {
			deferred.reject('knex query object not structured as expected for KnexNest: does not have _statements property');
			return deferred.promise;
		}
		
		var aliasList = [];
		var renamedMap = {};
		var uniqueId = 0;
		
		var column, alias, prepend, renamed, renamedColumn;
		
		for (var i = 0; i < knexQuery._statements.length; i++) {
			if (knexQuery._statements[i].grouping === undefined || knexQuery._statements[i].grouping !== 'columns') {
				continue;
			}
			
			if (knexQuery._statements[i].value === undefined) {
				deferred.reject('knex query object not structured as expected for KnexNest: _statements item with column grouping does not have value property');
				return deferred.promise;
			}
			
			// columns statement, use it
			for (var j = 0; j < knexQuery._statements[i].value.length; j++) {
				renamedColumn = null;
				
				// each column in the column statement
				column = knexQuery._statements[i].value[j].sql
					? knexQuery._statements[i].value[j].sql
					: knexQuery._statements[i].value[j]
				;
				
				if (column.substr(-1) === '"') {
					// assume the line has the format
					//   tableNameOrAlias.columnName  "alias"
					// or
					//   tableNameOrAlias.columnName AS "alias"
					alias = column.slice(column.indexOf('"') + 1, -1);
					
					if (alias.length > knexnest.MAX_POSTGRES_COLUMN_NAME_LENGTH) {
						// shorten the alias to allowed size
						prepend = 'col_' + (uniqueId++) + '_';
						renamed = prepend + alias.substr(-1 * knexnest.MAX_POSTGRES_COLUMN_NAME_LENGTH + prepend.length);
						// add to mapping used after db executed to reverse this rename
						renamedMap[alias] = renamed;
						// replace the original alias with the shortened one
						renamedColumn = column.substr(0, column.indexOf('"')) + '"' + renamed + '"';
					}
					aliasList.push(alias);
				} else if (column.indexOf(' AS ') !== -1 || column.indexOf(' as ') !== -1) {
					// assume the line has the format
					//   tableNameOrAlias.columnName AS alias
					alias = column.substr(column.lastIndexOf(' ') + 1);
					
					if (alias.length > knexnest.MAX_POSTGRES_COLUMN_NAME_LENGTH) {
						// shorten the alias to allowed size
						prepend = 'col_' + (uniqueId++) + '_';
						renamed = prepend + alias.substr(-1 * knexnest.MAX_POSTGRES_COLUMN_NAME_LENGTH + prepend.length);
						// add to mapping used after db executed to reverse this rename
						renamedMap[alias] = renamed;
						// replace the original alias with the shortened one
						renamedColumn = column.substr(0, column.lastIndexOf(' ') + 1) + renamed;
					}
					aliasList.push(alias);
				} else if (column.indexOf('.') !== -1) {
					// assume the line has the format
					//   tableNameOrAlias.columnName
					aliasList.push(column.substr(column.indexOf('.') + 1));
				} else {
					// assume the line has the format
					//   columnName
					aliasList.push(column);
				}
				
				if (renamedColumn !== null) {
					if (knexQuery._statements[i].value[j].sql) {
						knexQuery._statements[i].value[j].sql = renamedColumn;
					} else {
						knexQuery._statements[i].value[j] = renamedColumn;
					}
				}
			}
		}
		
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

knexnest.MAX_POSTGRES_COLUMN_NAME_LENGTH = 63;

module.exports = knexnest;
