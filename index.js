
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")

const app = express()
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173,https://bulkmail-9go9jh0al-sakthivelmurugadass-2135s-projects.vercel.app")
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

const credentialsSchema = new mongoose.Schema(
  {},{ collection: "bulkmail" })

const Credentials = mongoose.model("Credentials", credentialsSchema)
const emailPattern = /^[^\s@]+@gmail\.com$/i
const recipientPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getMailCredentials() {
  const records = await Credentials.find().lean()
  const record = records.find((item) => {
    const email = [item.user, item.name].find((value) =>
      typeof value === "string" && emailPattern.test(value.trim())
    )
    return email && typeof item.pass === "string" && item.pass.trim()
  })

  if (!record) {
    throw new Error("No valid Gmail credentials found in the bulkmail collection")
  }

  const user = [record.user, record.name].find((value) =>
    typeof value === "string" && emailPattern.test(value.trim())
  ).trim()

  return { user, pass: record.pass.replace(/\s+/g, "") }
}

app.post("/sendemail", async (req, res) => {
  const message = req.body?.msg ?? req.body?.message
  const emailList = req.body?.emailList ?? req.body?.mailist ?? req.body?.mailList

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required" })
  }

  if (!Array.isArray(emailList) || emailList.length === 0) {
    return res.status(400).json({ success: false, message: "Email list is required" })
  }

  const recipients = emailList.map((email) => String(email).trim())
  if (recipients.some((email) => !recipientPattern.test(email))) {
    return res.status(400).json({ success: false, message: "The email list contains an invalid address" })
  }

  try {
    const { user, pass } = await getMailCredentials()
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    })

    for (const recipient of recipients) {
      await transporter.sendMail({
        from: user,
        to: recipient,
        subject: "Message from BulkMail",
        text: message
      })
    }

    return res.json({ success: true, message: "Emails sent successfully" })
  } catch (error) {
    console.error("Email error:", error.message)
    return res.status(500).json({ success: false, message: error.message || "Failed to send emails" })
  }
})

app.get("/", (req, res) => {
  res.json({ success: true, message: "BulkMail backend is running" })
})

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/passkey"
const port = process.env.PORT || 5000

mongoose.connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(port, () => console.log(`Server running on port ${port}`))
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message)
    process.exit(1)
  })
