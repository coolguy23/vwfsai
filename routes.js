// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var apiai = require('apiai');
//var apiKey = process.env.SECRET;
var apiKey = '24fcae8c91a64402adb813de4d9aed3f';
var appAi = apiai(apiKey);

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	/*app.get('/', function(req, res){

		// Render views/home.html
		res.redirect('create');
	});*/

	app.get('/', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/'+id);
	});

	app.get('/chat/:id', function(req,res){

		// Render the chat.html view
		res.render('chat');
	});
    
    /********************************** KAKAO START ************************************/
    app.post("/message", function (request, response) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      console.log(request.body);
      var keyUser = request.body.user_key;
        var userMessage = request.body.content;
        return requestApiai (keyUser,userMessage,response);
    });

    app.get("/keyboard", function (request, response) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.status(200).json ({type:'buttons',buttons:['챗봇 시작하기']});
    });

    app.post("/friend", function (request, response) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.status(200).json ({type:'buttons',buttons:['챗봇 시작하기']});
    });

    app.delete("/friend", function (request, response) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.status(200).json ({type:'buttons',buttons:['챗봇 시작하기']});
    });

    app.delete("/chat_room", function (request, response) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.status(200).json ({type:'buttons',buttons:['챗봇 시작하기']});
    });
    /********************************** KAKAO END ************************************/
    
	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {

		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room

		socket.on('load',function(data){

			var room = findClientsSocket(io,data);
			if(room.length === 0 ) {

				socket.emit('peopleinchat', {number: 0});
			}
			else if(room.length === 1) {

				socket.emit('peopleinchat', {
					number: 1,
					user: room[0].username,
					avatar: room[0].avatar,
					id: data
				});
			}
			else if(room.length >= 2) {

				chat.emit('tooMany', {boolean: true});
			}
		});

		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);
			// Only two people per room are allowed
			if (room.length < 2) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object

				socket.username = data.user;
				socket.room = data.id;
				socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

				// Tell the person what he should use for an avatar
				socket.emit('img', socket.avatar);


				// Add the client to the room
				socket.join(data.id);

				if (room.length == 1) {

					var usernames = [],
						avatars = [];

					usernames.push(room[0].username);
					usernames.push(socket.username);

					avatars.push(room[0].avatar);
					avatars.push(socket.avatar);

					// Send the startChat event to all the people in the
					// room, along with a list of people that are in it.

					chat.in(data.id).emit('startChat', {
						boolean: true,
						id: data.id,
						users: usernames,
						avatars: avatars
					});
				}
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			// Notify the other person in the chat room
			// that his partner has left

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username,
				avatar: this.avatar
			});

			// leave the room
			socket.leave(socket.room);
		});


		// Handle the sending of messages
		socket.on('msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
            requestApiai2(data.user, data.msg, socket);
            
		});
	});
};

function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}

function sendtext (res,str) {
	res.status(200).json ( { message: { text:str }, keyboard: { type: "text" } } );
}

function sendJson (res,data) {
	return res.status(200).json ( data );
}

function requestApiai (keyUser,userMessage,res) {
  console.log("requestApiai:"+keyUser+" "+userMessage);
	var request = appAi.textRequest(userMessage, {
		sessionId: keyUser
	});
	request.on('response', function(response) {
    
		var intentName = response.result.metadata.intentName;
		var parameters = response.result.parameters;
    var message = response.result.fulfillment.messages;
    
    if (message.length ==1) {
      // 파라미터 슬롯 메시지인 경우
      return sendtext (res,response.result.fulfillment.speech);
    } else {
      var playloadMessage = message [message.length-1];
      console.log(playloadMessage);
      return sendJson (res,playloadMessage.payload);
    }
	});

	request.on('error', function(error) {
		console.log(error);
		return sendtext (res,"서버 오류입니다.\n잠시 후에 다시 해 보세요.");
	});
	request.end();
}

function requestApiai2 (keyUser,userMessage, socket) {
    
    console.log("requestApiai:"+keyUser+" "+userMessage);
	var request = appAi.textRequest(userMessage, {
		sessionId: keyUser
	});
	request.on('response', function(response) {
    
        var intentName = response.result.metadata.intentName;
		var parameters = response.result.parameters;
        var message = response.result.fulfillment.speech;
        console.log('message======================================>' + message);
        
        socket.broadcast.to(socket.room).emit('receive', {msg: message, user: keyUser, img: ''});    
    
	});

	request.on('error', function(error) {
		console.log(error);
		return "서버 오류입니다.\n잠시 후에 다시 해 보세요.";
	});
	request.end();
    
}
