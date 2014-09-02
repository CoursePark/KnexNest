KnexNest
========

Takes a Knex.js select query object and hydarates a list of nested objects.

```javascript
knex
	.select(
		'c.id    AS _id',
		'c.title AS _title',
		't.id    AS _teacher_id',
		't.name  AS _teacher_name',
		'l.id    AS _lesson__id',
		'l.title AS _lesson__title'
	)
	.from('course AS c')
	.innerJoin('teacher AS t', 't.id', 'c.teacher_id')
	.innerJoin('course_lesson AS cl', 'cl.course_id', 'c.id')
	.innerJoin('lesson AS l', 'l.id', 'cl.lesson_id')
;
KnexNest(knex).then(function (data) {
	result = data;
});
/* result should be like:
[
	{id: '1', title: 'Tabular to Objects', teacher: {id: '1', name: 'David'}, lesson: [
		{id: '1', title: 'Defintions'},
		{id: '2', title: 'Table Data'},
		{id: '3', title: 'Objects'}
	]},
	{id: '2', title: 'Column Names Define Structure', teacher: {id: '2', name: 'Chris'}, lesson: [
		{id: '4', title: 'Column Names'},
		{id: '2', title: 'Table Data'},
		{id: '3', title: 'Objects'}
	]},
	{id: '3', title: 'Object On Bottom', teacher: {id: '1', name: 'David'}, lesson: [
		{id: '5', title: 'Non Array Input'},
	]}
]
*/
```

Related Projects
----------------

- [NestHydrationJS](https://github.com/CoursePark/NestHydrationJS) : The base project
