let socketio = require('socket.io')
let io;
let guestNumber = 1;
let nickNames = {}
let nameUsed = []
let currentRoom = {}


exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level', 1)
	io.sockets.on('connection', socket=>{ 		//定义每个用户连接的处理逻辑
		guestNumber = assignGuestName(socket,guestNumber, nickNames, nameUsed);	//分配用户名
		joinRoom(socket, 'Lobby');	//把用户加入聊天室 lobby

		handleMessageBroadcasting(socket, nickNames); //处理用户消息
		handleNameChangeAttempts(socket, nickNames, nameUsed);	//处理用户名变更
		handleRoomJoining(socket);	//处理聊天室创建和变更

		socket.on('rooms', _=>{
			socket.emit('rooms', io.sockets.manager.rooms);
		})

		handleClientDisconnection(socket, nickNames, nameUsed)	//用户断开连接的清除逻辑
	})
}

function assignGuestName(socket, guestNumber, nickNames, nameUsed){
	let name = '游客' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name
	})
	nameUsed.push(name);
	return guestNumber+1
}
function joinRoom(socket, room){
	socket.join(room)
	currentRoom[socket.id] = room;		//用户进入房间，并记录

	socket.emit('joinResult', {room}) 	//通知用户加入房间了
	//通知其他用户
	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + '加入了房间' + room
	})
	let usersInRoom = io.sockets.clients(room);
	if(usersInRoom.length>1){
		let usersInRoomSummary = 'Users currently in ' + room + ':';
		for(let i in usersInRoom){
			let userSocketId = usersInRoom[i].id;
			if(userSocketId != socket.id){
				if(i>0){
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary +='.';
		socket.emit('message', {text: usersInRoomSummary})
	}
}

function handleNameChangeAttempts(socket, nickNames, nameUsed){
	socket.on('nameAttempt', function(name){
		if(name.indexOf('游客')===0){
			socket.emit('nameResult', {
				success: false,
				message: '命名不能以"游客"开头'
			})
		}else{
			if(nameUsed.indexOf(name)===-1){
				//名称可用
				let previousName = nickNames[socket.id];
				let previousNameIndex = nameUsed.indexOf(previousName);
				nameUsed.push(name);
				nickNames[socket.id] = name;
				delete nameUsed[previousNameIndex];	//	删除之前的名称

				socket.emit('nameResult',{
					success: true,
					name
				})
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text: previousName + '已更名为：' + name
				})
			}else{
				//名称被占用
				socket.emit('nameResult',{
					success: false,
					message: '该名称已被占用'
				})
			}
		}
	})
}

//发送消息
function handleMessageBroadcasting(socket){
	socket.on('message', message=>{
		socket.broadcast.to(message.room).emit('message',{
			text: nickNames[socket.id] + ': ' + message.text
		})
	})
}
//创建房间
function handleRoomJoining(socket){
	socket.on('join', room=>{
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom)
	})
}

//用户断开
function handleClientDisconnection(socket){
	socket.on('disconnect',_=>{
		let nameIndex = nameUsed.indexOf(nickNames[socket.id]);	//删除用户信息
		delete nameUsed[nameIndex];
		delete nickNames[socket.id]
	})
}

































