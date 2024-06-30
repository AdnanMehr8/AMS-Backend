const express = require('express');
const { PORT } = require('./config/index');
const dbConnect = require('./database/index');
const router = require('./routes/index');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');
const cors = require("cors");

// const corsOptions = {
//   credentials: true,
//   origin: ["http://localhost:3000"],
// };

const app = express();


// app.use(cors(corsOptions));
app.use(
  cors({
    origin: function (origin, callback) {
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(express.json({limit: '50mb'}));
app.use(cookieParser());

dbConnect();

app.use("/storage", express.static("storage"));

app.use(router);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Backend is running on port: ${PORT}`));
