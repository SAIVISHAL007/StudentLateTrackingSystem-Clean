import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../services/api";
import { enqueueLateMark, flushQueue, getQueue } from "../utils/offlineQueue";
import { toast } from "./Toast";
import { FiClock, FiCamera, FiX, FiAlertTriangle, FiPackage, FiRefreshCw } from "react-icons/fi";

function StudentForm() {
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState(""); // default to empty for placeholder
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  
  // Update queue count
  useEffect(() => {
    const updateCount = () => setQueueCount(getQueue().length);
    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner cleanup error:", err));
      }
    };
  }, [scanner]);

  const startScanner = () => {
    setScannerActive(true);
    
    // Initialize scanner after a small delay to ensure div is rendered
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [0, 8] // QR_CODE and CODE_128 for barcodes
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Successfully scanned
          setRollNo(decodedText.trim());
          stopScanner(html5QrcodeScanner);
          toast.success(`Scanned: ${decodedText}`);
        },
        (error) => {
          // Scanning error (continuous, can be ignored)
        }
      );

      setScanner(html5QrcodeScanner);
    }, 100);
  };

  const stopScanner = (scannerInstance) => {
    const scannerToStop = scannerInstance || scanner;
    if (scannerToStop) {
      scannerToStop.clear().then(() => {
        setScannerActive(false);
        setScanner(null);
      }).catch(err => {
        console.error("Error stopping scanner:", err);
        setScannerActive(false);
        setScanner(null);
      });
    } else {
      setScannerActive(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!rollNo.trim()) {
      toast.error("Roll number is required");
      return;
    }
    
    // Build payload
    const payload = { rollNo: rollNo.trim() };
    if (name.trim()) payload.name = name.trim();
    if (year) payload.year = parseInt(year);
    if (branch) payload.branch = branch;
    if (section.trim()) payload.section = section.trim().toUpperCase();

    // Offline handling
    if (!navigator.onLine) {
      enqueueLateMark(payload);
      setQueueCount(getQueue().length);
      toast.warning('Offline mode: Entry queued for sync');
      setRollNo(''); setName(''); setYear(''); setBranch(''); setSection('');
      return;
    }

    try {
      // Prepare payload dynamically
      const res = await API.post("/students/mark-late", payload, {
        timeout: 15000 // 15 second timeout
      });
      
      // Create dynamic alert based on response
      const { message, alertType, daysRemaining, graceDaysRemaining } = res.data;
      
      // Show detailed feedback using toast
      let displayMessage = message;
      if (daysRemaining !== undefined && graceDaysRemaining !== undefined) {
        displayMessage += ` - Days remaining: ${daysRemaining}/10 | Grace days: ${graceDaysRemaining}/4`;
      }
      
      // Show toast based on alert type
      if (alertType === "error") {
        toast.error(displayMessage);
      } else if (alertType === "warning") {
        toast.warning(displayMessage);
      } else {
        toast.success(displayMessage);
      }

      // Attempt to flush any queued items if just came back online
      if (navigator.onLine) {
        flushQueue(API).then(result => {
          if (result.flushed > 0) {
            setQueueCount(getQueue().length);
          }
        });
      }

      // Reset inputs
      setRollNo(""); setName(""); setYear(""); setBranch(""); setSection("");
      setQueueCount(getQueue().length);

    } catch (err) {
      console.error('Mark late error:', err);
      
      let errorMessage = "Error marking student late";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        // Special handling for new student registration
        if (errorData.required && errorData.required.includes('name')) {
          errorMessage = `New Student Detected! Roll Number: ${errorData.rollNo || rollNo} - Please fill in all fields (Name, Year, Branch, Section) to register this student.`;
          toast.warning(errorMessage);
          
          // Don't clear the roll number so user can just add other fields
          setName(""); 
          setYear("");
          setBranch("");
          setSection("");
          return; // Early return after showing warning
        } else {
          errorMessage = errorData.error;
          if (errorData.required) {
            errorMessage += ` - Required fields: ${errorData.required.join(', ')}`;
          }
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        }
      } else if (err.response?.status === 503) {
        errorMessage = `${err.response.data.error} - ${err.response.data.details}`;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        if (err.response.data.details) {
          errorMessage += ` - ${err.response.data.details}`;
        }
      } else if (err.message) {
        errorMessage = `Network Error: ${err.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div style={{
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(20px)",
      padding: "2.5rem",
      borderRadius: "24px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      maxWidth: "600px",
      margin: "0 auto",
      animation: "scaleIn 0.5s ease-out"
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative" }}>
        <div style={{
          width: "70px",
          height: "70px",
          margin: "0 auto 1rem",
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(220, 38, 38, 0.4)",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          <FiClock size={40} color="white" />
        </div>
        <h2 style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "2rem",
          fontWeight: "800",
          marginBottom: "0.5rem",
          letterSpacing: "-0.5px"
        }}>
          Mark Student Late
        </h2>
        {queueCount > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ background: "#fef3c7", border: "2px solid #fbbf24", padding: "8px 16px", borderRadius: "10px", fontSize: "0.8rem", color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiPackage size={16} /> {queueCount} queued item{queueCount > 1 ? 's' : ''} pending sync
            </div>
            <button onClick={async () => {
              setSyncing(true);
              toast.loading('Syncing queued items...');
              const result = await flushQueue(API);
              setSyncing(false);
              setQueueCount(getQueue().length);
              if (result.flushed > 0) toast.success(`Synced ${result.flushed} item(s)`);
              if (result.failures.length > 0) toast.warning(`${result.failures.length} item(s) failed to sync`);
            }} disabled={syncing} className="pro-btn pro-btn-success" style={{ padding: "8px 14px", fontSize: "0.75rem", opacity: syncing ? 0.6 : 1 }}>
              <FiRefreshCw size={14} style={{ marginRight: "6px" }} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}
      </div>
      
      <div style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
        padding: "1.25rem",
        borderRadius: "16px",
        border: "2px solid #bfdbfe",
        marginBottom: "2rem",
        fontSize: "0.9rem",
        color: "#1e3a8a",
        lineHeight: "1.8",
        animation: "fadeIn 0.6s ease-out 0.2s both"
      }}>
        <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="icon-wrapper" style={{ width: "24px", height: "24px" }}>
            <FiAlertTriangle size={16} color="#1e40af" />
          </div>
          <strong style={{ fontSize: "1rem", color: "#1e40af" }}>How it works:</strong>
        </div>
        <div style={{ paddingLeft: "0.5rem" }}>
          <div style={{ marginBottom: "0.4rem" }}>• <strong>Existing students:</strong> Just enter roll number</div>
          <div style={{ marginBottom: "0.4rem" }}>• <strong>New students:</strong> Fill all fields (Roll No, Name, Year, Branch, Section)</div>
          <div>• <strong>Fine structure:</strong> 2 excuse days → Days 3-5: ₹3 each → Day 6+: increases by ₹5 every 3 days</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#334155",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            Roll Number <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            placeholder="Enter roll number"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            required
            style={{
              padding: "14px 18px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "1rem",
              transition: "all 0.3s ease",
              outline: "none",
              background: "white",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          />
          
            {/* QR/Barcode Scanner */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={scannerActive ? () => stopScanner() : startScanner}
                className={scannerActive ? "pro-btn pro-btn-danger" : "pro-btn pro-btn-success"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {scannerActive ? (
                  <><FiX size={16} /> Stop Scanner</>
                ) : (
                  <><FiCamera size={16} /> Scan QR/Barcode</>
                )}
              </button>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {scannerActive ? "Position barcode in frame" : "Quick roll number entry"}
              </span>
            </div>
          
            {/* Scanner Container */}
            {scannerActive && (
              <div style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                borderRadius: "12px",
                border: "2px solid #0ea5e9",
                animation: "fadeIn 0.3s ease-out"
              }}>
                <div id="qr-reader" style={{ width: "100%" }}></div>
                <div style={{ 
                  marginTop: "0.75rem", 
                  fontSize: "0.8rem", 
                  color: "#0c4a6e", 
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem"
                }}>
                  <div>Point camera at QR code or barcode</div>
                  <div>Supports both QR codes and 1D barcodes</div>
                </div>
              </div>
            )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#334155",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            Student Name <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>(for new students)</span>
          </label>
          <input
            placeholder="Enter student name (required for new students only)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "14px 18px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "1rem",
              transition: "all 0.3s ease",
              outline: "none",
              background: "white",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#334155",
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              Year <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>(new only)</span>
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
              }}
              style={{
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Select Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#334155",
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              Section <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>(new only)</span>
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="E">Section E</option>
              <option value="F">Section F</option>
            </select>
          </div>
        </div>

        <div style={{
          padding: "0.75rem 1rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "10px",
          border: "2px solid #fbbf24",
          fontSize: "0.8rem",
          color: "#78350f",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "-1rem"
        }}>
          <FiAlertTriangle size={16} />
          <div>
            <strong>Section Info:</strong> Select the section for the student (A, B, C, D, E, or F).
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#334155",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            Branch <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>(for new students)</span>
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{
              padding: "14px 18px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "1rem",
              backgroundColor: "white",
              cursor: "pointer",
              transition: "all 0.3s ease",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">Select Branch (for new students only)</option>
            <option value="CSE">CSE - Computer Science and Engineering</option>
            <option value="CSM">CSM - Computer Science and Engineering (AI & ML)</option>
            <option value="CSD">CSD - Computer Science and Engineering (Data Science)</option>
            <option value="CSC">CSC - Computer Science and Engineering (Cyber Security)</option>
            <option value="ECE">ECE - Electronics and Communication Engineering</option>
            <option value="EEE">EEE - Electrical and Electronics Engineering</option>
            <option value="MECH">MECH - Mechanical Engineering</option>
            <option value="CIVIL">CIVIL - Civil Engineering</option>
            <option value="IT">IT - Information Technology</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#334155",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            Section <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>(for new students)</span>
          </label>
          <input
            placeholder="Enter section (e.g., A, B, C)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            maxLength="2"
            style={{
              padding: "14px 18px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "1rem",
              transition: "all 0.3s ease",
              outline: "none",
              textTransform: "uppercase",
              background: "white",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "1.05rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s ease",
            marginTop: "0.5rem",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 15px rgba(220, 38, 38, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 25px rgba(220, 38, 38, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(220, 38, 38, 0.4)";
          }}
        >
          <FiAlertTriangle size={20} />
          Mark as Late
        </button>
      </form>
    </div>
  );
}

export default StudentForm;
