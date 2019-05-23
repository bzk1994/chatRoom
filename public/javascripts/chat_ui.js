function divEsc(message){
	return $('<div></div>').text(message);
}

function divSys(message){
	return $('<div class="attention"></div>').html('<i>' + message + '</i>')
}

function processUserInput(chatApp, socket){
	let message = $('#send-message').val();
	let systemMessage;
	if(message.charAt(0)==='/'){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$('#messages').append(divSys(systemMessage))
		}
	}else{
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEsc(userName+'：'+message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	$("#send-message").val('')
}

let socket = io.connect();
let userName = '';
$(document).ready(function(){
	let chatApp = new Chat(socket)
	socket.on('nameResult', result=>{
		let message;
		if(result.success){
			message = '昵称成功更改为：' + result.name
			userName = result.name
		}else{
			message = result.message
		}
		$("#messages").append(divSys(message))
	})

	socket.on('joinResult', result=>{
		$("#room").text(result.room)
		$("#messages").append(divSys('Room changed!'))
	})
	socket.on('message', message=>{
		let newElement = $('<div></div>').text(message.text);
		$("#messages").append(newElement)
	})

	socket.on('rooms', rooms=>{
		$("#room-list").empty();
		for (let room in rooms) {
			room = room.substring(1, room.length);
			if(room != ''){
				$('#room-list').append(divEsc(room))
			}
		}
		$("#room-list div").click(function(){
			chatApp.processCommand('/join'+ $(this).text())
			$('#send-message').focus()
		})
	})

	setInterval(_=>{
		socket.emit('rooms');	//定期刷新房间列表
	},1000)

	$('#send-message').focus()

	$('#send-form').submit(function(){
		processUserInput(chatApp, socket);
		return false;
	})

})