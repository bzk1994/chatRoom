let http = require('http');
let fs = require('fs');
let path = require('path');
let mime = require('mime');
let cache = {};

//处理404错误
function send404(res){
	res.writeHead(404,{'Content-Type': 'text/plain'});
	res.write('Error 404: resource not found');
	res.end();
}
//处理文件数据
function sendFile(res,filePath,fileContents){
	res.writeHead(200,{'content-type': mime.getType(path.basename(filePath))})
	res.end(fileContents)
}

//静态文件服务
function serverStatic(res,cache,absPath){
	if(cache[absPath]){	 //如果内存中有，直接返回
		sendFile(res, absPath, cache[absPath])
	}else{
		fs.exists(absPath, function(exists){	//没有的话到文件系统读取
			if(exists){
				fs.readFile(absPath, (err, data)=>{
					if(err){
						send404(res)
					}else{
						cache[absPath] = data;
						sendFile(res, absPath, data)
					}
				})
			}else{
				console.log(absPath)
				send404(res)
			}
		})
	}
}

//http服务
let server = http.createServer(function(req,res){
	let filePath = false;
	if(req.url==='/'){
		filePath = 'public/index.html' //返回默认html文件
	}else{
		filePath = 'public' + req.url;	//把URL路径转为文件的相对路径
	}

	let absPath = './' + filePath;
	serverStatic(res, cache, absPath)
})

server.listen(3000, function(){
	console.log('server listening on port 3000')
})

let chatServer = require('./lib/chat_server')
chatServer.listen(server);


































