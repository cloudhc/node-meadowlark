var express = require('express'),
	fortune = require('./lib/fortune.js'),
	app = express(),
	credentials = require('./credentials.js'),
	handlebars = require('express-handlebars').create({
		defaultLayout: 'main',
		helpers: {
			section: function(name, options) {
				if(!this._sections) this._sections = {};
				this._sections[name] = options.fn(this);
				return null;
			}
		}
	});

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

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app
	.use(require('cookie-parser')(credentials.cookieSecret))
	.use(require('express-session')({
		resave: false,
		saveUninitialized: false,
		secret: credentials.cookieSecret,
	}))
	.use(express.static(__dirname + '/public'))
	.use(require('body-parser').urlencoded({extended: true}))
	.use(function(req, res, next){
		res.locals.flash = req.session.flash;
		delete req.session.flash;
		next();
	})
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
	.get('/tours/request-group-rate', function(req, res) {
		res.render('tours/request-group-rate');
	})
	.get('/jquery-test', function(req, res) {
		res.render('jquery-test');
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
	.get('/nursery-rhyme', function(req, res){
		res.render('nursery-rhyme');
	})
	.get('/data/nursery-rhyme', function(req, res){
		res.json({
			animal: 'squirrel',
			bodyPart: 'tail',
			adjective: 'bushy',
			noun: 'heck',
		});
	})
	.get('/thank-you', function(req, res){
		res.render('thank-you');
	})
	.get('/newsletter', function(req, res) {
    		// we will learn about CSRF later...for now, we just
    		// provide a dummy value
    		res.render('newsletter', { csrf: 'CSRF token goes here' });
	})
	.get('/newsletter/archive', function(req, res){
		res.render('newsletter/archive');
	})
	.post('/newsletter', function(req, res){
		var name = req.body.name || '', email = req.body.email || '';
		// input validation
		if(!email.match(VALID_EMAIL_REGEX)) {
			if(req.xhr) return res.json({ error: 'Invalid name email address.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Validation error!',
				message: 'The email address you entered was  not valid.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		new NewsletterSignup({ name: name, email: email }).save(function(err){
			if(err) {
				if(req.xhr) return res.json({ error: 'Database error.' });
				req.session.flash = {
					type: 'danger',
					intro: 'Database error!',
					message: 'There was a database error; please try again later.',
				};
				return res.redirect(303, '/newsletter/archive');
			}
			if(req.xhr) return res.json({ success: true });
			req.session.flash = {
				type: 'success',
				intro: 'Thank you!',
				message: 'You have now been signed up for the newsletter.',
			};
			return res.redirect(303, '/newsletter/archive');
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
	.use(function(req, res, next) {
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
