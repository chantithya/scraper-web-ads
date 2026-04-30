// src/App.js
import React, { useEffect, useState } from "react";
import CustomTable from "./components/DataTable";
import { FaFileExcel } from 'react-icons/fa';


function App() {
  const [data, setData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [country, setCountry] = useState("Vietnam");
  const [adType, setAdType] = useState("All ads");

  const [keywords, setKeywords] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/keywords")
      .then(res => res.json())
      .then(setKeywords)
      .catch(console.error);
  }, []);

  const loadData = (keyword) => {
    fetch(`http://localhost:5000/data/${keyword}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setSelectedKeyword(keyword);
        setShowTable(true);
      })
      .catch(console.error);
  };

  return (
    <div className="container-fluid" style={{ background: "#f1f5f9", minHeight: "100vh" }}>
  
    {/* Header */}
    <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white shadow-sm">
      <h3 className="fw-bold m-0">📊 Meta Ads Dashboard</h3>
      <div className="text-muted">Welcome 👋</div>
    </div>
  
    <div className="row m-0">
  
      {/* LEFT SIDEBAR */}
      <div className="col-12 col-lg-2 p-2 border-end bg-white" style={{ minHeight: "100vh" }}>
        
        <h6 className="text-muted mb-3">⚙️ Controls</h6>
  
        {/* Country */}
        <select
          className="form-select mb-2"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option>Vietnam</option>
          <option>Cambodia</option>
          <option>Thailand</option>
        </select>
  
        {/* Ad Type */}
        <select
          className="form-select mb-2"
          value={adType}
          onChange={(e) => setAdType(e.target.value)}
        >
          <option>All ads</option>
        </select>
  
        {/* Search */}
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Enter keyword..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
  
        {/* Scrap Button */}
        <button
          className="btn btn-primary w-100"
          onClick={() => {
            setIsLoading(true);
            setPopupMessage("🔍 Scraping in progress... Please wait");
          
            fetch(`http://localhost:5000/scrap?country=${country}&type=${adType}&keyword=${searchText}`)
              .then(res => res.json())
              .then(() => {
                setPopupMessage("✅ Scraping completed!");
                setIsLoading(false);
          
                // refresh keywords
                fetch("http://localhost:5000/keywords")
                  .then(res => res.json())
                  .then(setKeywords);
              })
              .catch(() => {
                setPopupMessage("❌ Error during scraping");
                setIsLoading(false);
              });
          }}
        >
          🚀 Start Scraping
        </button>
  
        {/* Keyword List */}
        <div className="mt-4">
          <h6 className="text-muted">📂 Keywords</h6>
  
          {keywords.map((kw, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center mb-2">
  
              <button
                className={`btn btn-sm ${
                  selectedKeyword === kw ? "btn-link" : "btn-light"
                }`}
                onClick={() => loadData(kw)}
                style={{ flex: 1, textAlign: "left" }}
              >
                {kw.replaceAll("_", " ")}
              </button>
  
              <button
                className="btn btn-sm btn-outline-success ms-2"
                onClick={() => window.open(`http://localhost:5000/download/${kw}`)}
              >
                <FaFileExcel />
              </button>
              <button
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={() =>
                  window.open(`http://localhost:5000/download-images/${kw}`)
                }
              >
                🖼️
              </button>
            </div>
          ))}
        </div>
  
      </div>
  
      {/* MAIN CONTENT */}
      <div className="col-12 col-lg-10 p-5">
  
        {showTable ? (
          <div className="card shadow-sm border-0">
  
            {/* Card Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h5 className="m-0">
                📊 {selectedKeyword.replaceAll("_", " ")}
              </h5>
  
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowTable(false)}
              >
                ✖ Close
              </button>
            </div>
  
            {/* Table */}
            <div className="p-3">
              <CustomTable data={data} />
            </div>
  
          </div>
        ) : (
          <div className="text-center text-muted mt-5">
            <h5>No data selected</h5>
            <p>Select a keyword from the left panel</p>
          </div>
        )}

        {isLoading && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}>
            <div style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "300px"
            }}>
              
              <div className="spinner-border text-primary mb-3" role="status"></div>

              <h5>{popupMessage}</h5>

            </div>
          </div>
        )}
  
      </div>
      
  
    </div>
    <footer
    className="text-center py-3"
    style={{
      background: "#ffffff",
      borderTop: "1px solid #e5e7eb",
    }}
  >
    <div className="container-fluid">

      <div className="small text-muted">
        © {new Date().getFullYear()} Built by{" "}
        <strong>Som Chantithya</strong>
      </div>

      <a
        href="https://your-nexus-link.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: "#2563eb",
          fontSize: "14px",
        }}
      >
        🔗 NEXUS-Link DA Team
      </a>

    </div>
  </footer>
    
  </div>
  
  );
 
}

export default App;