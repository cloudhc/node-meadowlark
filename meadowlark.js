var express = require('express'),
	app = express(),
	handlebars = require('express-handlebars')
		.create({defaultLayout: 'main'}),
	fortune = require('./lib/fortune.js');

app
	.use(express.static(__dirname + '/public'))
	.set('port', process.env.PORT || 3000)
	.engine('handlebars', handlebars.engine)
	.set('view engine', 'handlebars');

// custom route
app
	.get('/', function(req, res) {
		res.render('home');
	})
	.get('/about', function(req, res) {
		res.render('about', {fortune: fortune.getFortune()});
	});

app
	.use(function(req, res) {
		res.status(404);
		res.render('404');
	})
	.use(function(err, req, res, next) {
		console.error(err.stack);
		res.status(500);
		res.render('500');
	})
	.listen(app.get('port'), function() {
		console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
	});
