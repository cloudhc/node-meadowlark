var express = require('express'),
	app = express(),
	handlebars = require('express-handlebars')
		.create({defaultLayout: 'main'}),
	fortune = require('./lib/fortune.js');

var tours = [
	{id: 0, name: 'Hood River', price: 99.99},
	{id: 1, name: 'Oregon Coast', price: 149.95},
];

// mocked weather data
function getWeatherData(){
    return {
        locations: [
	    	{
				name: 'Portland',
				forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
				iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
				weather: 'Overcast',
				temp: '54.1 F (12.3 C)',
		    },
		    {
		        name: 'Bend',
		        forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
		        iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
		        weather: 'Partly Cloudy',
		        temp: '55.0 F (12.8 C)',
		    },
		    {
		        name: 'Manzanita',
		        forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
		        iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
		        weather: 'Light Rain',
		        temp: '55.0 F (12.8 C)',
		    },
        ],
    };
}

app
	.use(express.static(__dirname + '/public'))
	.set('port', process.env.PORT || 3000)
	.engine('handlebars', handlebars.engine)
	.set('view engine', 'handlebars');

// custom test route
app
	.use(function(req, res, next) {
		res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
		next();
	})
	.use(function(req, res, next) {
		if(!res.locals.partials) res.locals.partials = {};
		res.locals.partials.weatherContext = getWeatherData();
		next();
	});

// custom route
app
	.get('/', function(req, res) {
		res.render('home');
	})
	.get('/about', function(req, res) {
		res.render('about', {
			fortune: fortune.getFortune(),
			pageTestScript: '/qa/tests-about.js'
		});
	})
	.get('/tours/hood-river', function(req, res) {
		res.render('tours/hood-river');
	})
	.get('/tours/oregon-coast', function(req, res){
		res.render('tours/oregon-coast');
	})
	.get('/tours/request-group-size', function(req, res) {
		res.render('tours/request-group-size');
	})
	.get('/api/tours', function(req, res) {
		var toursXml = '' + 
			products.map(function(p) {
				return ' id="' + p.id + '">' + p.name + '';
			}).join('') + '';
		var toursText = tours.map(function(p) {
			return p.id + ': ' + p.name + ' (' + p.price + ')';
		}).join('\n');
		res.format({
			'application/json': function() {
				res.json(tours);
			},
			'applciation/xml': function() {
				res.type('application/xml');
				res.send(toursXml);
			},
			'text/xml': function() {
				res.type('text/xml');
				res.send(toursXml);
			},
			'text/plain': function() {
				res.type('text/plain');
				res.send(toursXml);
			}
		});
	})
	.put('/api/tours/:id', function(req, res) {
		var p = tours.filter(function(p) { return p.id == req.param.id })[0];
		if (p) {
			if (req.query.name) p.name = req.query.name;
			if (req.query.price) p.price = req.query.price;
			res.json({success: true});
		} else {
			res.json({error: 'No such tour exists.'});
		}
	})
	.delete('/api/tours/:id', function(req, res) {
		var i;
		for( var i = tours.length-1; i >= 0 ; i--)
			if (tours[i].id == req.params.id) break;
		if (i >= 0) {
			tours.splice(i, 1);
			res.json({success: true});
		} else {
			res.json({error: 'No such tour exists.'});
		}
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
