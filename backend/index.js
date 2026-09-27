
const express = require("express")
const cors = require("cors")
const sendEmail = require("./sendemail")

const app = express()
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173,https://depfront.vercel.app")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true)
    }
    return callback(new Error("Origin is not allowed by CORS"))
  }
}))
app.use(express.json({ limit: "1mb" }))

app.post("/sendemail", sendEmail)

app.get("/", (req, res) => {
  res.json({ success: true, message: "BulkMail backend is running" })
})

const port = process.env.PORT || 5000

if (require.main === module) {
  app.listen(port, () => console.log(`Server running on port ${port}`))
}

module.exports = app
