const express = require("express")
const cors = require("cors")
const sendEmail = require("./sendemail")

const app = express()

// Configurable origins via environment variables
const defaultOrigins = "http://localhost:5173,https://depfront.vercel.app"
const allowedOrigins = (process.env.FRONTEND_ORIGINS || defaultOrigins)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)

      const normalizedOrigin = origin.replace(/\/$/, "")
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true)
      }

      return callback(new Error(`CORS Error: Origin ${origin} is not allowed`))
    },
    credentials: true
  })
)

app.use(express.json({ limit: "5mb" }))

// Routes
app.post("/sendemail", sendEmail)
app.post("/api/sendemail", sendEmail)

app.get("/", (req, res) => {
  res.json({ success: true, message: "BulkMail backend is running" })
})

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err.message)
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" })
})

// Run locally if called directly; export app for Vercel serverless
const port = process.env.PORT || 5000

if (require.main === module) {
  app.listen(port, () => console.log(`Server running on port ${port}`))
}

module.exports = app