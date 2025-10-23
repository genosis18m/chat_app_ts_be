import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("message", (message) => {
    const parsedMessage = JSON.parse(message.toString());

    if (parsedMessage.type === "join") {
      const roomId = parsedMessage.payload.roomId;
      console.log("User joined room:", roomId);

      allSockets.push({ socket, room: roomId });

      // Notify everyone in the room about new user count
      sendUserCount(roomId);
    }

    if (parsedMessage.type === "chat") {
      const currentUser = allSockets.find((x) => x.socket === socket);
      if (!currentUser) return;

      for (let user of allSockets) {
        if (user.room === currentUser.room) {
          user.socket.send(
            JSON.stringify({
              type: "chat",
              payload: { message: parsedMessage.payload.message },
            })
          );
        }
      }
    }
  });

  socket.on("close", () => {
    const user = allSockets.find((u) => u.socket === socket);
    if (!user) return;

    allSockets = allSockets.filter((u) => u.socket !== socket);
    console.log("Client disconnected");

    // Notify the remaining users in that room
    sendUserCount(user.room);
  });
});

function sendUserCount(roomId: string) {
  const roomUsers = allSockets.filter((u) => u.room === roomId);
  const userCount = roomUsers.length;

  for (let user of roomUsers) {
    user.socket.send(
      JSON.stringify({
        type: "userCount",
        payload: { count: userCount },
      })
    );
  }
}
