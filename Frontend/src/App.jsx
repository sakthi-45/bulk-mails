import axios from "axios";
import { useState } from "react";
import * as XLSX from "xlsx";

// Base URL configured to use your deployed Vercel backend
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://bulkmail-be-gamma.vercel.app"
).replace(/\/$/, "");

// Standard Email Regex Pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function App() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function handleMsg(evt) {
    setMsg(evt.target.value);
  }

  // Parse Excel/CSV file content safely
  function processFile(file) {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const isExtensionValid = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isExtensionValid) {
      alert("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
      try {
        const data = new Uint8Array(loadEvent.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Empty spreadsheet");
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        // Extract valid email addresses across columns or from Column A
        const extractedEmails = new Set();

        rawRows.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              const str = String(cell || "").trim();
              if (EMAIL_REGEX.test(str)) {
                extractedEmails.add(str.toLowerCase());
              }
            });
          }
        });

        const finalEmailList = Array.from(extractedEmails);

        if (finalEmailList.length === 0) {
          alert("No valid email addresses were found in the uploaded file.");
          setEmailList([]);
          setFileName("");
          return;
        }

        setEmailList(finalEmailList);
      } catch (err) {
        console.error("Spreadsheet Parsing Error:", err);
        setEmailList([]);
        setFileName("");
        alert("Unable to read that spreadsheet. Please check the file format.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    processFile(file);
  }

  // Drag & Drop Handlers
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }

  async function send() {
    if (!msg.trim()) {
      alert("Please enter your email message.");
      return;
    }

    if (emailList.length === 0) {
      alert("Please upload a spreadsheet with valid email addresses.");
      return;
    }

    setStatus(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/sendemail`, {
        msg: msg.trim(),
        emailList: emailList,
      });

      alert(response.data?.message || "Emails sent successfully!");
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Unable to connect to the backend server. Please check your network or server setup.";
      alert(errorMessage);
    } finally {
      setStatus(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-cyan-500 text-white">
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold tracking-wide">BULK-MAIL</h1>
      </div>

      <div className="text-center">
        <h2 className="font-medium px-5 py-2 text-xl">
          We can help you send multiple emails at once
        </h2>
      </div>

      <div className="flex flex-col items-center px-5 py-6 max-w-4xl mx-auto">
        {/* Email Message Input */}
        <textarea
          onChange={handleMsg}
          value={msg}
          disabled={status}
          className="w-full max-w-2xl h-52 py-3 px-4 outline-none border border-white/30 bg-white/10 backdrop-blur-sm rounded-md placeholder-white/70 text-white focus:ring-2 focus:ring-white/50 transition resize-y"
          placeholder="Enter the email text here..."
        />

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-2xl mt-6 p-6 border-2 border-dashed rounded-md text-center transition cursor-pointer bg-white/10 backdrop-blur-sm ${
            isDragging ? "border-cyan-300 bg-white/20" : "border-white/40 hover:border-white/70"
          }`}
        >
          <input
            type="file"
            id="fileInput"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={status}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer block">
            <p className="font-semibold text-lg">
              {isDragging ? "Drop your file here" : "Drag and drop your spreadsheet here"}
            </p>
            <p className="text-sm opacity-80 mt-1">or click to browse (.xlsx, .xls, .csv)</p>
            {fileName && (
              <p className="mt-3 text-cyan-200 font-medium">Selected file: {fileName}</p>
            )}
          </label>
        </div>

        {/* Status Info */}
        <p className="mt-4 text-lg">
          Total Valid Emails: <span className="font-bold">{emailList.length}</span>
        </p>

        {/* Submit Button */}
        <button
          onClick={send}
          disabled={status || emailList.length === 0 || !msg.trim()}
          className="mt-6 bg-white text-indigo-900 py-2.5 px-8 font-semibold rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 transition"
        >
          {status ? "Sending..." : "Send Emails"}
        </button>
      </div>
    </div>
  );
}

export default App;