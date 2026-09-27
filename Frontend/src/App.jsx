
import axios from "axios";
import { useState } from "react";
import * as XLSX from "xlsx"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

function App() {

  const [msg,setmsg] = useState("")
  const [status,setstatus] = useState(false)
  const [emailList,setEmailList] = useState([])

  function handlemsg(evt)
  {
    setmsg(evt.target.value)
  }

  function handlefile(event)
  {
    const file = event.target.files[0]
    if (!file) {
      setEmailList([])
      return
    }

    const reader = new FileReader()
    reader.onload = function (loadEvent) {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: "A", raw: false })
        const emails = [...new Set(rows
          .map((row) => String(row.A || "").trim())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))]
        setEmailList(emails)
      } catch {
        setEmailList([])
        alert("Unable to read that spreadsheet")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function send()
  {
    if (!msg.trim()) {
      alert("Please enter your email message")
      return
    }

    if (emailList.length === 0) {
      alert("Please upload a spreadsheet with email addresses in column A")
      return
    }

    setstatus(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/sendemail`, { msg, emailList })
      alert(response.data.message || "Emails sent successfully")
    } catch (error) {
      alert(error.response?.data?.message || "Unable to connect to the backend")
    } finally {
      setstatus(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-cyan-500">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold tracking-wide text-white">BULK-MAIL</h1>
      </div>

      <div className="text-white text-center">
        <h1 className="font-medium px-5 py-3 text-xl">We can help you with sending multiple emails at once</h1>
      </div>

      <div className="text-white text-center">
        <h1 className="font-medium px-5 py-3">DRAG AND DROP</h1>
      </div>

      <div className="flex flex-col items-center text-white px-5 py-8">
        <textarea onChange={handlemsg} value={msg} className="w-[80%] h-60 py-2 outline-none px-3 border border-white/30 bg-white/10 backdrop-blur-sm rounded-md placeholder-white/70 text-white" placeholder="Enter the email text ...."></textarea>

        <div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handlefile} className="border-2 border-dashed border-white/40 bg-white/10 rounded-md py-4 px-4 mt-5 mb-5 text-white" />
        </div>

        <p>Total Emails in the file: {emailList.length}</p>

        <button onClick={send} disabled={status} className="mt-2 bg-white text-indigo-900 py-2 px-4 font-semibold rounded-md w-fit disabled:opacity-60 hover:bg-white/90 transition">{status?"Sending...":"Send"}</button>
      </div>

      <div className="p-8"></div>
    </div>
  );
}

export default App;