import { createServer } from "http";

function requestListener(req, res)
{
	res.writeHead(200);
	res.end('Hello, World!');
}

const server = createServer(requestListener);
server.listen(3000);
