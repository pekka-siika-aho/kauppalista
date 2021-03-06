


module.exports = function(io) {

	var express = require('express');
	var router = express.Router();
	var async = require('async');

	var Item = require('../models/item');

	/* GET home page. */
	router.get('/', function(req, res, next) {

		res.render('index');

	});

	io.on('connection', (socket) => {
	  console.log('a user connected');

	  socket.on('disconnect', () => {
	    console.log('user disconnected');
	  });

	  socket.on('item_create', (itemText) => {

	  	var newItem = new Item();
	  	newItem.text = itemText;

	  	newItem.save((err) => {
	  		if (err) io.emit('error', err);
	  		else io.emit('item_create', newItem);
	  	});
	  });

	  socket.on('item_change', (data) => {
	  	Item.findById(data.id, (err, item) => {
			if (err) {
				 io.emit('error', err);
			} else {
	  			item.text = data.text;
	  			item.save((err) => {
	  				if (err) io.emit('error', err);
		  			else socket.broadcast.emit('item_change', data);
	  			});
	  		}
	  	});
	  });

	  socket.on('item_checked', (data) => {
	  	Item.findById(data.id, (err, item) => {
	  		if (err) {
				 io.emit('error', err);
			} else {
				item.checked = data.checked;
				item.save((err) => {
	  				if (err) io.emit('error', err);
					else socket.broadcast.emit('item_checked', data);
				});
			}
	  	});
	  });

	  socket.on('item_delete', (itemId) => {
	  	Item.findById(itemId).remove((err) => {
			if (err) io.emit('error', err);
	  		else io.emit('item_delete', itemId);
	  	});
	  });

	  socket.on('order_changed', (newOrder) => {
	  	var errors = false;

	  	async.eachLimit(newOrder.order, 10, (data, done) => {

	  		Item.update({_id: data.id}, {$set: {index: data.index}}, (err, items, t) => {
	  			console.log(err);
	  			console.log(items);
	  			console.log(t);
	  			done();
	  		});

	  	});
	  	if (!errors) socket.broadcast.emit('order_changed', newOrder);
	  });
	});

	return router;
};
