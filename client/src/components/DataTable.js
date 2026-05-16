// src/components/DataTable.js

import React from "react";
import DataTable from "react-data-table-component";


function CustomTable({ data }) {
    const [filterText, setFilterText] = React.useState("");
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [selectedText, setSelectedText] = React.useState(null);

  const filteredData = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(filterText.toLowerCase())
  );

  if (!data.length) return <p>Loading data...</p>;

  const columnOrder = [
    "keyword",
    "status",
    "library_id",
    "date",
    "page_name",
    "page_link",
    "sponsored",
    "ad_text",
    "media_url",
  ];
  
  const columns = columnOrder.map((key, index) => ({
    name: key.toUpperCase(),
    selector: (row) => row[key],
    sortable: true,
    wrap: true,
  
    style: {
      minWidth:
        key === "ad_text"
          ? "300px"
          : key === "media_url"
          ? "120px"
          : "140px",
  
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
  
    cell: (row) => {
      const value = row[key];
  
      // ✅ MEDIA URL
      if (key === "media_url" && typeof value === "string") {
  
        let fixedUrl = value.trim();
  
        fixedUrl = fixedUrl.replace(/^https\/\//, "https://");
        fixedUrl = fixedUrl.replace(/^http\/\//, "http://");
  
        if (
          !fixedUrl.startsWith("http://") &&
          !fixedUrl.startsWith("https://")
        ) {
          fixedUrl = "https://" + fixedUrl.replace(/^\/+/, "");
        }
  
        const isVideo =
          fixedUrl.includes(".mp4") ||
          fixedUrl.includes("video.fpnh");
  
        // ✅ VIDEO
        if (isVideo) {
          return (
            <video
              width="80"
              height="80"
              controls
              muted
              playsInline
              style={{
                borderRadius: "8px",
                objectFit: "cover",
              }}
            >
              <source src={fixedUrl} type="video/mp4" />
            </video>
          );
        }
  
        // ✅ IMAGE
        return (
          <img
            src={fixedUrl}
            alt="ad"
            loading="lazy"
            referrerPolicy="no-referrer"
            onClick={() => setSelectedImage(fixedUrl)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://via.placeholder.com/80?text=No+Image";
            }}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
        );
      }
  
      // ✅ AD TEXT
      if (key === "ad_text" && typeof value === "string") {
        const isLong = value.length > 120;
  
        return (
          <div style={{ maxWidth: "300px" }}>
            {isLong ? value.substring(0, 40) + "..." : value}
  
            {isLong && (
              <span
                onClick={() => setSelectedText(value)}
                style={{
                  color: "#2563eb",
                  cursor: "pointer",
                  marginLeft: "5px",
                  fontWeight: "500",
                }}
              >
                Read more
              </span>
            )}
          </div>
        );
      }
  
      // ✅ LINK
      if (
        typeof value === "string" &&
        value.startsWith("http")
      ) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ whiteSpace: "nowrap" }}
          >
            🔗 Visit
          </a>
        );
      }
  
      return value;
    },
  }));

  // 🎨 Custom Styles
  const customStyles = {
    table: {
      style: {
        borderRadius: "12px",
        overflow: "hidden",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#1e293b",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "14px",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f1f5f9",
        cursor: "pointer",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #e2e8f0",
      },
    },
    
  };

  return (
    <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px" }}>
      
      {/* 🔍 Search + Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ margin: 0 }}>📊 Scraper Dashboard</h2>

        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "200px",
          }}
        />
      </div>
      {selectedImage && (
        <div
            onClick={() => setSelectedImage(null)}
            style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            }}
        >
            <img
                src={selectedImage}
                alt="preview"
                onClick={(e) => e.stopPropagation()}  // ✅ important
                style={{
                    maxWidth: "90%",
                    maxHeight: "90%",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
            />
            <div
            style={{
                position: "absolute",
                top: "20px",
                right: "30px",
                color: "white",
                fontSize: "28px",
                cursor: "pointer",
            }}
            >
            ✖
            </div>
        </div>
        )}

        {selectedText && (
        <div
            onClick={() => setSelectedText(null)}
            style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
            }}
        >
            <div
            onClick={(e) => e.stopPropagation()}
            style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                maxWidth: "600px",
                maxHeight: "80%",
                overflowY: "auto",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            >
            <h3>📄 Full Ad Text</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{selectedText}</p>

            <div
                onClick={() => setSelectedText(null)}
                style={{
                marginTop: "10px",
                textAlign: "right",
                cursor: "pointer",
                color: "#2563eb",
                fontWeight: "500",
                }}
            >
                Close ✖
            </div>
            </div>
        </div>
        )}

      {/* 📊 Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        striped
        responsive   // ✅ important
        customStyles={customStyles}
      />
    </div>
  );
}



export default CustomTable;