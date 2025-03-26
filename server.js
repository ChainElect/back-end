const app = require("./app"); // Import the Express app
const http = require("http");
const {
  SUCCESS_MESSAGES,
} = require("./src/utilities/messages/successMessages");

const PORT = process.env.PORT || 5001;

// Create an HTTP server and start listening
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(SUCCESS_MESSAGES.COMMON.SERVER_RUNNING(PORT));
});
