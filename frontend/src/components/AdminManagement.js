import React, {useState,useEffect } from "react";
import API from "../services/api";

function AdminManagement() {
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(false);
  const [rollNoToDelete,setRollNoToDelete]=useState("");
  
  // Late record removal state (global list)
  const [lateRecords, setLateRecords] = useState([]); // flattened { key, rollNo, name, date, year, branch, fineAmount }
  const [lateRecordsLoading, setLateRecordsLoading] = useState(false);
  const [selectedLateRecords, setSelectedLateRecords] = useState([]); // array of keys
  const [lateRecordsError, setLateRecordsError] = useState("");
  const [lateRemovalForm, setLateRemovalForm] = useState({ reason: "", authorizedBy: "" });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("semester"); // today, week, month, semester
  const [yearFilter, setYearFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [groupByStudent, setGroupByStudent] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;
  
  // Progress tracking
  const [removalProgress, setRemovalProgress] = useState({ current: 0, total: 0, status: "" });

  // State for fine payment
  const [studentsWithFines, setStudentsWithFines] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showFinesList, setShowFinesList] = useState(false);

  useEffect(()=>{
    fetchSystemStats();
  },[]);

  const fetchSystemStats=async()=>{
    try{
      const res=await API.get("/students/system-stats");
      setStats(res.data);
    } catch(err){
      console.error(err);
    }
  };

  const handleSemesterPromotion=async(specificYear = null, specificBranch = null)=>{
    const filterText = specificYear 
      ? `Year ${specificYear}${specificBranch ? ` ${specificBranch}` : ''}`
      : specificBranch 
      ? specificBranch
      : 'ALL';
    
    if (!window.confirm(`🎓 SEMESTER PROMOTION\n\nTarget: ${filterText} students\n\nThis will:\n✅ Move students to next semester\n✅ Update year (if crossing year boundary)\n✅ Mark Y4S8 students as graduated\n✅ Reset all late records and fines\n✅ Keep student information intact\n\nProceed with promotion?`)){
      return;
    }

    setLoading(true);
    try{
      const res=await API.post("/students/promote-semester", {
        specificYear,
        specificBranch,
        graduateYear4Sem8: true
      }, {
        timeout:45000 //45 second timeout
      });
      
      const { 
        message, 
        studentsPromoted = 0, 
        studentsGraduated = 0,
        yearTransitions = 0,
        totalStudents = 0,
        details 
      } = res.data;
      
      let resultMsg = `✅ ${message}\n\n📊 Summary:\n`;
      resultMsg += `• Promoted: ${studentsPromoted} students\n`;
      if (studentsGraduated > 0) {
        resultMsg += `• Graduated: ${studentsGraduated} students 🎉\n`;
      }
      if (yearTransitions > 0) {
        resultMsg += `• Year transitions: ${yearTransitions} students\n`;
      }
      resultMsg += `• Total processed: ${totalStudents}`;
      
      // Show sample details if available
      if (details && details.sample && details.sample.length > 0) {
        resultMsg += `\n\n📋 Sample (first 10):\n`;
        details.sample.slice(0, 5).forEach(d => {
          resultMsg += `• ${d.rollNo}: ${d.from} → ${d.to}${d.yearChanged ? ' 🎓' : ''}\n`;
        });
      }
      
      alert(resultMsg);
      fetchSystemStats();
    }catch (err){
      console.error('Semester promotion error:',err);
      
      let errorMessage="Failed to promote students";
      
      if (err.code==='ECONNABORTED') {
        errorMessage="⏱️ Operation timed out. Please check your connection and try again.";
      }else if (err.response?.status===503){
        errorMessage=`🔌 ${err.response.data.error}\n💡 ${err.response.data.details}`;
      }else if (err.response?.status===404){
        errorMessage="📚 No students found to promote. Add students first.";
      }else if (err.response?.data?.error){
        errorMessage=`❌ ${err.response.data.error}`;
        if (err.response.data.details) {
          errorMessage+=`\n💡 ${err.response.data.details}`;
        }
      }else if (err.message){
        errorMessage=`❌ Network Error: ${err.message}`;
      }
      
      alert(errorMessage);
    }finally{
      setLoading(false);
    }
  };

  const handleResetAllData=async()=>{
    if (!window.confirm("⚠️ DANGER: This will reset ALL late data for ALL students but keep student records. Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      const res=await API.post("/students/reset-all-data", {}, {
        timeout:45000 //45 second timeout
      });
      
      const message=res.data.message;
      const reset=res.data.studentsReset;
      const total=res.data.totalStudents;

      alert(`✅ ${message}\n📊 Reset: ${reset}/${total} students`);
      fetchSystemStats();
    } catch (err){
      console.error('Data reset error:', err);
      
      let errorMessage = "Failed to reset data";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "⏱️ Operation timed out. Please check your connection and try again.";
      } else if (err.response?.status === 503) {
        errorMessage = `🔌 ${err.response.data.error}\n💡 ${err.response.data.details}`;
      } else if (err.response?.status === 404) {
        errorMessage = "📚 No students found to reset. Add students first.";
      } else if (err.response?.data?.error) {
        errorMessage = `❌ ${err.response.data.error}`;
        if (err.response.data.details) {
          errorMessage+=`\n💡 ${err.response.data.details}`;
        }
      } else if (err.message) {
        errorMessage=`❌ Network Error: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllStudents = async () => {
    const confirmText = "DELETE ALL STUDENTS";
    const userInput = window.prompt(`🚨 CRITICAL WARNING: This will permanently delete ALL students from the database!\n\nThis action CANNOT be undone!\n\nType "${confirmText}" to confirm:`);
    
    if (userInput !== confirmText) {
      alert("Deletion cancelled.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.delete("/students/delete-all-students");
      alert(`✅ ${res.data.message}`);
      fetchSystemStats();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || "Failed to delete all students"}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch late records based on selected period
  const fetchLateRecords = async () => {
    setLateRecordsLoading(true);
    setLateRecordsError("");
    setCurrentPage(1);
    try {
      const endpoint = periodFilter === 'today' ? '/students/late-today' : `/students/records/${periodFilter}`;
      const res = await API.get(endpoint);
      const students = res.data.students || [];
      
      // Flatten each late log into record objects with fine calculation
      const flattened = [];
      students.forEach(stu => {
        const sortedLogs = (stu.lateLogs || []).sort((a,b) => new Date(a.date) - new Date(b.date));
        sortedLogs.forEach((log, index) => {
          // Calculate fine for this specific late day
          const lateDayNumber = index + 1;
          let fineAmount = 0;
          if (lateDayNumber > 2) {
            const dayAfterExcuse = lateDayNumber - 2;
            const cycleNumber = Math.floor((dayAfterExcuse - 1) / 3);
            if (cycleNumber === 0) fineAmount = 3;
            else if (cycleNumber === 1) fineAmount = 5;
            else if (cycleNumber === 2) fineAmount = 8;
            else if (cycleNumber === 3) fineAmount = 13;
            else {
              const increments = [5,8,5,13,8,5,18,13];
              let baseFine = 13;
              for (let i = 4; i <= cycleNumber; i++) {
                baseFine += increments[(i-4) % increments.length];
              }
              fineAmount = baseFine;
            }
          }
          
          flattened.push({
            key: `${stu.rollNo}|${log.date}`,
            rollNo: stu.rollNo,
            name: stu.name,
            year: stu.year,
            branch: stu.branch,
            date: log.date,
            fineAmount,
            lateDayNumber
          });
        });
      });
      
      // Sort descending by date
      flattened.sort((a,b)=> new Date(b.date)-new Date(a.date));
      setLateRecords(flattened);
      setSelectedLateRecords([]);
    } catch (err) {
      setLateRecords([]);
      setLateRecordsError(err.response?.data?.error || "Failed to load late records");
    } finally {
      setLateRecordsLoading(false);
    }
  };

  const toggleLateRecord = (key) => {
    setSelectedLateRecords(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Filter and search records
  const getFilteredRecords = () => {
    let filtered = [...lateRecords];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.rollNo.toLowerCase().includes(query)
      );
    }
    
    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(r => r.year === parseInt(yearFilter));
    }
    
    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter(r => r.branch === branchFilter);
    }
    
    return filtered;
  };

  // Group records by student
  const getGroupedRecords = () => {
    const filtered = getFilteredRecords();
    const grouped = {};
    
    filtered.forEach(record => {
      if (!grouped[record.rollNo]) {
        grouped[record.rollNo] = {
          rollNo: record.rollNo,
          name: record.name,
          year: record.year,
          branch: record.branch,
          records: []
        };
      }
      grouped[record.rollNo].records.push(record);
    });
    
    return Object.values(grouped).sort((a,b) => b.records.length - a.records.length);
  };

  // Get paginated records
  const getPaginatedRecords = () => {
    const filtered = getFilteredRecords();
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    return filtered.slice(start, end);
  };

  const toggleStudentExpansion = (rollNo) => {
    setExpandedStudents(prev => 
      prev.includes(rollNo) ? prev.filter(r => r !== rollNo) : [...prev, rollNo]
    );
  };

  const toggleAllRecordsForStudent = (rollNo) => {
    const studentRecords = lateRecords.filter(r => r.rollNo === rollNo).map(r => r.key);
    const allSelected = studentRecords.every(key => selectedLateRecords.includes(key));
    
    if (allSelected) {
      setSelectedLateRecords(prev => prev.filter(key => !studentRecords.includes(key)));
    } else {
      setSelectedLateRecords(prev => [...new Set([...prev, ...studentRecords])]);
    }
  };

  // Export late records to Excel
  const handleExportLateRecords = () => {
    const filtered = getFilteredRecords();
    if (filtered.length === 0) {
      alert("⚠️ No records to export");
      return;
    }
    
    const csvContent = [
      ['Name', 'Roll Number', 'Year', 'Semester', 'Branch', 'Date', 'Late Day #', 'Fine Amount (₹)'],
      ...filtered.map(r => [
        r.name,
        r.rollNo,
        r.year,
        r.semester || 'N/A',
        r.branch,
        new Date(r.date).toLocaleDateString(),
        r.lateDayNumber,
        r.fineAmount
      ])
    ].map(row => row.join(',')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `late_records_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`✅ Exported ${filtered.length} records to CSV`);
  };

  const handleBulkRemoveLateRecords = async () => {
    // Validation
    if (selectedLateRecords.length === 0) {
      alert("❌ Please select at least one record to remove");
      return;
    }
    if (!lateRemovalForm.reason.trim() || lateRemovalForm.reason.trim().length < 10) {
      alert("❌ Please provide a detailed reason (minimum 10 characters)");
      return;
    }
    if (!lateRemovalForm.authorizedBy.trim()) {
      alert("❌ Please specify who authorized this removal");
      return;
    }
    
    // Calculate summary
    const affectedRecords = lateRecords.filter(r => selectedLateRecords.includes(r.key));
    const affectedStudents = new Set(affectedRecords.map(r => r.rollNo)).size;
    const totalFineReduction = affectedRecords.reduce((sum, r) => sum + r.fineAmount, 0);
    
    const confirmMsg = `🗑️ CONFIRM REMOVAL\n\n📊 Summary:\n• Records to remove: ${selectedLateRecords.length}\n• Students affected: ${affectedStudents}\n• Total fine reduction: ₹${totalFineReduction}\n\n📝 Reason: ${lateRemovalForm.reason}\n👤 Authorized by: ${lateRemovalForm.authorizedBy}\n\n⚠️ This action will recalculate fines and status for each student. Continue?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setRemovalProgress({ current: 0, total: selectedLateRecords.length, status: "Processing bulk removal..." });
    
    try {
      // Build bulk removal payload
      const records = selectedLateRecords.map(key => {
        const [rollNo, date] = key.split('|');
        return { rollNo, date };
      });
      
      // Call bulk endpoint
      const res = await API.post('/students/bulk-remove-late-records', { 
        records,
        reason: lateRemovalForm.reason,
        authorizedBy: lateRemovalForm.authorizedBy
      });
      
      const { removedRecords, fineReductionTotal, failures } = res.data;
      
      setRemovalProgress({ current: 0, total: 0, status: "" });
      
      let resultMsg = `✅ Successfully removed: ${removedRecords} record(s)`;
      if (failures && failures.length > 0) {
        resultMsg += `\n❌ Failed: ${failures.length} record(s)`;
        if (failures.length <= 5) {
          resultMsg += '\n\nFailed records:\n' + failures.map(f => `${f.rollNo} (${f.error})`).join('\n');
        }
      }
      resultMsg += `\n\n💰 Total fine reduction: ₹${fineReductionTotal}`;
      alert(resultMsg);
      
      setSelectedLateRecords([]);
      setLateRemovalForm({ reason: "", authorizedBy: "" });
      await fetchLateRecords();
      fetchSystemStats();
    } catch (err) {
      setRemovalProgress({ current: 0, total: 0, status: "" });
      alert(`❌ Bulk removal failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsWithFines = async () => {
    try {
      setLoading(true);
      const res = await API.get("/students/with-fines");
      setStudentsWithFines(res.data.students || []);
      setShowFinesList(true);
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || "Failed to fetch students with fines"}`);
      setStudentsWithFines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (rollNo) => {
    setSelectedStudents(prev => {
      if (prev.includes(rollNo)) {
        return prev.filter(r => r !== rollNo);
      } else {
        return [...prev, rollNo];
      }
    });
  };

  const handleClearFines = async () => {
    if (selectedStudents.length === 0) {
      alert("⚠️ Please select at least one student");
      return;
    }

    if (!window.confirm(`Clear fines for ${selectedStudents.length} student(s)?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const rollNo of selectedStudents) {
      try {
        const student = studentsWithFines.find(s => s.rollNo === rollNo);
        await API.post("/students/pay-fine", {
          rollNo: rollNo,
          amount: student.fines,
          paidBy: "Admin"
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to clear fines for ${rollNo}:`, err);
        failCount++;
      }
    }

    alert(`✅ Fines cleared for ${successCount} student(s)${failCount > 0 ? `\n❌ Failed: ${failCount}` : ''}`);
    
    setSelectedStudents([]);
    setShowFinesList(false);
    fetchSystemStats();
    setLoading(false);
  };
  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(20px)",
      padding: "2.5rem",
      borderRadius: "24px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.5)",
      animation: "scaleIn .5s ease-out"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
        <div style={{
          width: "70px",
          height: "70px",
          background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          boxShadow: "0 10px 30px rgba(102,126,234,0.4)",
          animation: "float 3s ease-in-out infinite"
        }}>⚙️</div>
        <div>
          <h2 style={{
            background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px"
          }}>Admin Management</h2>
          <p style={{ color: "#64748b", fontSize: "1.05rem", fontWeight: 500, margin: 0 }}>System statistics and management operations</p>
        </div>
      </div>

      {/* System Statistics */}
      <div style={{
        background: "linear-gradient(135deg,#dbeafe 0%,#e0e7ff 100%)",
        padding: "2rem",
        borderRadius: "20px",
        marginBottom: "2.5rem",
        border: "2px solid #bfdbfe",
        boxShadow: "0 8px 20px rgba(102,126,234,0.1)"
      }}>
        <h3 style={{ color: "#1e40af", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
          <span style={{ fontSize: "1.75rem" }}>📊</span>System Statistics
        </h3>
        {stats ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(59,130,246,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#3b82f6", fontWeight: 500, marginBottom: ".5rem" }}>Total Students</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e40af" }}>{stats.totalStudents}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(251,191,36,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#f59e0b", fontWeight: 500, marginBottom: ".5rem" }}>With Late Records</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#d97706" }}>{stats.studentsWithLateRecords}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(16,185,129,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#10b981", fontWeight: 500, marginBottom: ".5rem" }}>Using Excuse Days</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#059669" }}>{stats.studentsWithExcuses}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(220,38,38,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#dc2626", fontWeight: 500, marginBottom: ".5rem" }}>Being Fined</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#b91c1c" }}>{stats.studentsBeingFined}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(236,72,153,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#ec4899", fontWeight: 500, marginBottom: ".5rem" }}>Alert Status</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#db2777" }}>{stats.studentsWithAlerts}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(34,197,94,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#22c55e", fontWeight: 500, marginBottom: ".5rem" }}>Total Fines</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#16a34a" }}>₹{stats.totalFinesCollected}</div>
            </div>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(139,92,246,0.15)" }}>
              <div style={{ fontSize: ".85rem", color: "#8b5cf6", fontWeight: 500, marginBottom: ".5rem" }}>Year Distribution</div>
              <div style={{ fontSize: ".9rem", fontWeight: 600, color: "#7c3aed" }}>{stats.yearDistribution.map(y => ` Y${y._id}: ${y.count}`).join(', ')}</div>
            </div>
            {stats.branchDistribution && stats.branchDistribution.length > 0 && (
              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.7)", borderRadius: "16px", boxShadow: "0 4px 12px rgba(251,146,60,0.15)" }}>
                <div style={{ fontSize: ".85rem", color: "#fb923c", fontWeight: 500, marginBottom: ".5rem" }}>Branch Distribution</div>
                <div style={{ fontSize: ".9rem", fontWeight: 600, color: "#ea580c" }}>{stats.branchDistribution.map(b => ` ${b._id}: ${b.count}`).join(', ')}</div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "#3b82f6", fontSize: "1rem", fontWeight: 500 }}>Loading statistics...</p>
        )}
        <button
          onClick={fetchSystemStats}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: ".95rem",
            fontWeight: 600,
            transition: "all .3s",
            boxShadow: "0 4px 15px rgba(102,126,234,0.3)",
            opacity: loading ? .6 : 1
          }}
        >🔄 Refresh Stats</button>
      </div>

      {/* Management Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem" }}>
        
        {/* Semester Promotion */}
        <div style={{
          padding: "1.5rem",
          border: "2px solid #28a745",
          borderRadius: "8px",
          backgroundColor: "#f8fff9"
        }}>
          <h4 style={{ color: "#28a745", marginBottom: "1rem", fontSize: "1.1rem", fontWeight: "700" }}>
            🎓 Semester Promotion
          </h4>
          <p style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "1rem", lineHeight: "1.5" }}>
            Smart promotion system with automatic year transitions:
            <br />• ✅ Increments semester (S1→S2, S2→S3, S6→S7, etc.)
            <br />• ✅ Auto-updates year when crossing boundaries
            <br />• ✅ Y1S2→Y2S3 (1st→2nd year transition)
            <br />• ✅ Y2S4→Y3S5 (2nd→3rd year transition)
            <br />• ✅ Y3S6→Y4S7 (3rd→4th year transition)
            <br />• ✅ Y4S8 students marked as graduated 🎉
            <br />• ✅ Resets all late data & fines
            <br />• ✅ Keeps student records intact
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button
              onClick={() => handleSemesterPromotion()}
              disabled={loading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: "600",
                gridColumn: "1 / -1"
              }}
            >
              🎓 Promote ALL Students
            </button>
            
            <button
              onClick={() => handleSemesterPromotion(1)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#20c997",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: "600"
              }}
            >
              Year 1 Only
            </button>
            <button
              onClick={() => handleSemesterPromotion(2)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#20c997",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: "600"
              }}
            >
              Year 2 Only
            </button>
            <button
              onClick={() => handleSemesterPromotion(3)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#20c997",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: "600"
              }}
            >
              Year 3 Only
            </button>
            <button
              onClick={() => handleSemesterPromotion(4)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#fd7e14",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: "600"
              }}
            >
              Year 4 (Graduate)
            </button>
          </div>
          
          <details style={{ marginTop: "0.75rem" }}>
            <summary style={{ 
              cursor: "pointer", 
              fontSize: "0.8rem", 
              color: "#28a745", 
              fontWeight: "600",
              padding: "0.5rem",
              backgroundColor: "#e8f5e9",
              borderRadius: "4px"
            }}>
              🔧 Advanced: Promote by Branch
            </summary>
            <div style={{ 
              marginTop: "0.5rem", 
              padding: "0.75rem",
              backgroundColor: "#f1f8f4",
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.4rem"
            }}>
              {['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'].map(branch => (
                <button
                  key={branch}
                  onClick={() => handleSemesterPromotion(null, branch)}
                  disabled={loading}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600"
                  }}
                >
                  {branch}
                </button>
              ))}
            </div>
          </details>
        </div>

        {/* Data Reset */}
        <div style={{
          padding: "1.5rem",
          border: "2px solid #ffc107",
          borderRadius: "8px",
          backgroundColor: "#fffbf0"
        }}>
          <h4 style={{ color: "#e58e00", marginBottom: "1rem", fontSize: "1.1rem" }}>
            🔄 Reset Late Data
          </h4>
          <p style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "1rem" }}>
            Reset all late-related data for testing:
            <br />• Clear all late days and fines
            <br />• Reset status to normal
            <br />• Remove all late history
            <br />• Keep student info and semester
          </p>
          <button
            onClick={handleResetAllData}
            disabled={loading}
            style={{
              padding: "12px 20px",
              backgroundColor: "#ffc107",
              color: "#212529",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            🔄 Reset All Data
          </button>
        </div>

        {/* Remove Late Records (Enhanced with filters, search, grouping) */}
        <div style={{
          padding: "1.5rem",
          border: "2px solid #17a2b8",
          borderRadius: "8px",
          backgroundColor: "#e6fffa",
          gridColumn: "1 / -1"
        }}>
          <h4 style={{ color: "#17a2b8", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: "700" }}>🗑️ Remove Late Records</h4>
          <p style={{ fontSize: ".85rem", color: "#555", marginBottom: "1rem" }}>
            Advanced filtering + bulk removal with reason & authorization • Fines recalculated automatically
          </p>
          
          {/* Period and Load button */}
          <div style={{ display: "flex", gap: ".6rem", marginBottom: ".8rem", flexWrap: "wrap" }}>
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              style={{ padding: "10px", border: "2px solid #dee2e6", borderRadius: "6px", fontSize: ".85rem", fontWeight: "500" }}
            >
              <option value="today">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="semester">This Semester</option>
            </select>
            <button
              onClick={fetchLateRecords}
              disabled={lateRecordsLoading}
              style={{ padding: "10px 18px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "6px", cursor: lateRecordsLoading ? "not-allowed" : "pointer", fontSize: ".9rem", fontWeight: 600 }}
            >{lateRecordsLoading ? "Loading..." : "📋 Load Records"}</button>
            {lateRecords.length > 0 && (
              <>
                <button
                  onClick={handleExportLateRecords}
                  style={{ padding: "10px 18px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}
                >📊 Export CSV</button>
                <div style={{ flex: 1, fontSize: ".75rem", color: "#0f766e", display: "flex", alignItems: "center", fontWeight: "600" }}>
                  {getFilteredRecords().length} of {lateRecords.length} records
                  {selectedLateRecords.length > 0 && ` • ${selectedLateRecords.length} selected`}
                </div>
              </>
            )}
          </div>

          {lateRecords.length > 0 && (
            <>
              {/* Search and Filters */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: ".6rem", marginBottom: ".8rem" }}>
                <input
                  type="text"
                  placeholder="🔍 Search by name or roll number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: "8px 12px", border: "2px solid #dee2e6", borderRadius: "6px", fontSize: ".85rem" }}
                />
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  style={{ padding: "8px", border: "2px solid #dee2e6", borderRadius: "6px", fontSize: ".85rem" }}
                >
                  <option value="all">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
                <select
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  style={{ padding: "8px", border: "2px solid #dee2e6", borderRadius: "6px", fontSize: ".85rem" }}
                >
                  <option value="all">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="CSM">CSM</option>
                  <option value="CSD">CSD</option>
                  <option value="CSC">CSC</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="IT">IT</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: "0 .5rem", cursor: "pointer", fontSize: ".85rem", fontWeight: "500", color: "#0f766e" }}>
                  <input type="checkbox" checked={groupByStudent} onChange={e => setGroupByStudent(e.target.checked)} />
                  Group
                </label>
              </div>
            </>
          )}

          {lateRecordsError && <div style={{ color: "#dc2626", fontSize: ".75rem", marginBottom: ".6rem", padding: ".5rem", backgroundColor: "#fee2e2", borderRadius: "6px" }}>❌ {lateRecordsError}</div>}
          
          {/* Records List */}
          <div style={{ maxHeight: "320px", overflowY: "auto", border: "2px solid #b6effb", background: "white", borderRadius: "10px", padding: ".6rem", marginBottom: ".9rem" }}>
            {lateRecordsLoading ? (
              <div style={{ textAlign: "center", fontSize: ".8rem", color: "#6c757d", padding: "2rem" }}>⏳ Loading late records...</div>
            ) : lateRecords.length === 0 ? (
              <div style={{ textAlign: "center", fontSize: ".8rem", color: "#6c757d", padding: "2rem" }}>📭 No late records loaded. Click "Load Records" to fetch.</div>
            ) : getFilteredRecords().length === 0 ? (
              <div style={{ textAlign: "center", fontSize: ".8rem", color: "#6c757d", padding: "2rem" }}>🔍 No records match your filters</div>
            ) : groupByStudent ? (
              // Grouped by student view
              getGroupedRecords().map(student => {
                const isExpanded = expandedStudents.includes(student.rollNo);
                const studentKeys = student.records.map(r => r.key);
                const allSelected = studentKeys.every(k => selectedLateRecords.includes(k));
                const totalFines = student.records.reduce((sum, r) => sum + r.fineAmount, 0);
                
                return (
                  <div key={student.rollNo} style={{ marginBottom: ".5rem", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                    <div 
                      onClick={() => toggleStudentExpansion(student.rollNo)}
                      style={{ 
                        padding: ".7rem", 
                        background: "linear-gradient(90deg, #f0f9ff, #e0f2fe)", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: ".6rem"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => { e.stopPropagation(); toggleAllRecordsForStudent(student.rollNo); }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: ".85rem", fontWeight: "600", color: "#0f172a", flex: 1 }}>
                        {student.name} • {student.rollNo} • Y{student.year}S{student.semester || '?'} {student.branch}
                      </span>
                      <span style={{ fontSize: ".75rem", padding: ".2rem .5rem", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "4px", fontWeight: "600" }}>
                        {student.records.length} late{student.records.length > 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: ".75rem", padding: ".2rem .5rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontWeight: "600" }}>
                        ₹{totalFines}
                      </span>
                      <span style={{ fontSize: "1rem" }}>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: ".5rem" }}>
                        {student.records.map(r => {
                          const selected = selectedLateRecords.includes(r.key);
                          return (
                            <label key={r.key} style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: ".5rem", 
                              padding: ".4rem .5rem", 
                              marginBottom: ".3rem",
                              background: selected ? "linear-gradient(90deg,#06b6d4,#17a2b8)" : "#f9fafb", 
                              color: selected ? "white" : "#0f172a", 
                              borderRadius: "6px", 
                              cursor: "pointer",
                              fontSize: ".75rem"
                            }}>
                              <input type="checkbox" checked={selected} onChange={() => toggleLateRecord(r.key)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                              <span style={{ flex: 1 }}>{new Date(r.date).toDateString()}</span>
                              <span style={{ fontWeight: "600" }}>Day #{r.lateDayNumber}</span>
                              {r.fineAmount > 0 && <span style={{ fontWeight: "600" }}>₹{r.fineAmount}</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Flat list view with pagination
              <>
                {getPaginatedRecords().map(r => {
                  const selected = selectedLateRecords.includes(r.key);
                  return (
                    <label key={r.key} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: ".6rem", 
                      padding: ".5rem .65rem", 
                      marginBottom: ".4rem", 
                      background: selected ? "linear-gradient(90deg,#06b6d4,#17a2b8)" : "#f1f5f9", 
                      color: selected ? "white" : "#0f172a", 
                      borderRadius: "8px", 
                      border: selected ? "2px solid #0e7490" : "1px solid #cbd5e1", 
                      cursor: "pointer", 
                      transition: "all .2s" 
                    }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleLateRecord(r.key)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                      <div style={{ display: "flex", flexDirection: "column", fontSize: ".7rem", flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{r.name} • {r.rollNo} • Y{r.year}S{r.semester || '?'} {r.branch}</span>
                        <span style={{ opacity: selected ? .85 : .65 }}>{new Date(r.date).toDateString()} • Day #{r.lateDayNumber}</span>
                      </div>
                      {r.fineAmount > 0 && (
                        <span style={{ 
                          fontSize: ".75rem", 
                          fontWeight: 700, 
                          padding: ".2rem .5rem", 
                          backgroundColor: selected ? "rgba(255,255,255,0.2)" : "#fee2e2", 
                          color: selected ? "white" : "#991b1b", 
                          borderRadius: "6px" 
                        }}>₹{r.fineAmount}</span>
                      )}
                    </label>
                  );
                })}
                {/* Pagination */}
                {getFilteredRecords().length > recordsPerPage && (
                  <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", marginTop: ".8rem", paddingTop: ".8rem", borderTop: "1px solid #e2e8f0" }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ padding: ".4rem .8rem", fontSize: ".75rem", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: currentPage === 1 ? "not-allowed" : "pointer", backgroundColor: "white" }}
                    >← Prev</button>
                    <span style={{ fontSize: ".75rem", padding: ".4rem .8rem", color: "#64748b" }}>
                      Page {currentPage} of {Math.ceil(getFilteredRecords().length / recordsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(getFilteredRecords().length / recordsPerPage)}
                      style={{ padding: ".4rem .8rem", fontSize: ".75rem", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: currentPage >= Math.ceil(getFilteredRecords().length / recordsPerPage) ? "not-allowed" : "pointer", backgroundColor: "white" }}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reason dropdown + textarea */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: ".6rem", marginBottom: ".6rem", alignItems: "start" }}>
            <select
              value={lateRemovalForm.reason.startsWith("Faculty error") ? "faculty_error" : 
                     lateRemovalForm.reason.startsWith("Medical") ? "medical" :
                     lateRemovalForm.reason.startsWith("Technical") ? "technical" :
                     lateRemovalForm.reason.startsWith("Administrative") ? "administrative" : "other"}
              onChange={e => {
                const reasons = {
                  faculty_error: "Faculty error - Incorrectly marked late",
                  medical: "Medical emergency exemption",
                  technical: "Technical issue with late marking system",
                  administrative: "Administrative correction",
                  other: ""
                };
                setLateRemovalForm(p => ({ ...p, reason: reasons[e.target.value] }));
              }}
              style={{ padding: "10px", border: "2px solid #dee2e6", borderRadius: "8px", fontSize: ".85rem", fontWeight: "500" }}
            >
              <option value="faculty_error">Faculty Error</option>
              <option value="medical">Medical</option>
              <option value="technical">Technical Issue</option>
              <option value="administrative">Administrative</option>
              <option value="other">Other (specify)</option>
            </select>
            <textarea
              placeholder="Detailed reason (minimum 10 characters)..."
              value={lateRemovalForm.reason}
              onChange={e => setLateRemovalForm(p => ({ ...p, reason: e.target.value }))}
              rows={3}
              style={{ width: "100%", padding: "10px", border: lateRemovalForm.reason.trim().length > 0 && lateRemovalForm.reason.trim().length < 10 ? "2px solid #dc2626" : "2px solid #dee2e6", borderRadius: "8px", fontSize: ".85rem", resize: "vertical" }}
            />
          </div>
          {lateRemovalForm.reason.trim().length > 0 && lateRemovalForm.reason.trim().length < 10 && (
            <div style={{ fontSize: ".7rem", color: "#dc2626", marginBottom: ".5rem" }}>⚠️ Reason must be at least 10 characters ({lateRemovalForm.reason.trim().length}/10)</div>
          )}
          
          <input
            type="text"
            placeholder="Authorized by (Faculty/Admin name)"
            value={lateRemovalForm.authorizedBy}
            onChange={e => setLateRemovalForm(p => ({ ...p, authorizedBy: e.target.value }))}
            style={{ width: "100%", padding: "10px", border: "2px solid #dee2e6", borderRadius: "8px", fontSize: ".85rem", marginBottom: ".9rem" }}
          />
          
          <button
            onClick={handleBulkRemoveLateRecords}
            disabled={loading || selectedLateRecords.length === 0 || lateRemovalForm.reason.trim().length < 10 || !lateRemovalForm.authorizedBy.trim()}
            style={{ 
              padding: "14px 20px", 
              backgroundColor: (selectedLateRecords.length === 0 || lateRemovalForm.reason.trim().length < 10 || !lateRemovalForm.authorizedBy.trim()) ? "#94a3b8" : "#dc2626", 
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              cursor: (loading || selectedLateRecords.length === 0) ? "not-allowed" : "pointer", 
              fontSize: "1.05rem", 
              fontWeight: 700, 
              width: "100%",
              boxShadow: "0 4px 12px rgba(220,38,38,0.3)"
            }}
          >
            🗑️ Remove {selectedLateRecords.length > 0 ? `${selectedLateRecords.length} Selected Record${selectedLateRecords.length > 1 ? 's' : ''}` : 'Records'}
          </button>

          {/* Progress Overlay */}
          {removalProgress.total > 0 && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              backdropFilter: "blur(8px)"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "2.5rem 3rem",
                borderRadius: "20px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                color: "white",
                textAlign: "center",
                maxWidth: "500px",
                width: "90%",
                animation: "scaleIn 0.3s ease-out"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 2s infinite" }}>🗑️</div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", fontWeight: "700" }}>Removing Records</h3>
                <div style={{ 
                  fontSize: "1.1rem", 
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  fontWeight: "600"
                }}>
                  {removalProgress.current} of {removalProgress.total}
                </div>
                <div style={{ fontSize: ".9rem", opacity: 0.9, marginBottom: "1.5rem", minHeight: "40px" }}>
                  {removalProgress.status}
                </div>
                {/* Progress bar */}
                <div style={{ 
                  width: "100%", 
                  height: "12px", 
                  backgroundColor: "rgba(255,255,255,0.2)", 
                  borderRadius: "10px",
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    width: `${(removalProgress.current / removalProgress.total) * 100}%`, 
                    height: "100%", 
                    backgroundColor: "#10b981",
                    transition: "width 0.3s ease",
                    borderRadius: "10px"
                  }}></div>
                </div>
                <div style={{ fontSize: ".8rem", marginTop: ".8rem", opacity: 0.8 }}>
                  {Math.round((removalProgress.current / removalProgress.total) * 100)}% complete
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Fines */}
        <div style={{
          padding: "1.5rem",
          border: "2px solid #10b981",
          borderRadius: "8px",
          backgroundColor: "#f0fdf4"
        }}>
          <h4 style={{ color: "#10b981", marginBottom: "1rem", fontSize: "1.1rem" }}>
            💰 Clear Student Fines
          </h4>
          <p style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "1rem" }}>
            Mark fines as paid/cleared (cash/UPI):
          </p>
          
          {!showFinesList ? (
            <button
              onClick={fetchStudentsWithFines}
              disabled={loading}
              style={{
                padding: "12px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                width: "100%"
              }}
            >
              📋 Show Students with Fines
            </button>
          ) : (
            <>
              <div style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "2px solid #d1fae5",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "white"
              }}>
                {studentsWithFines.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#6c757d", margin: "1rem 0" }}>
                    🎉 No students have pending fines!
                  </p>
                ) : (
                  studentsWithFines.map(student => (
                    <label key={student.rollNo} style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      backgroundColor: selectedStudents.includes(student.rollNo) ? "#d1fae5" : "#f9fafb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.rollNo)}
                        onChange={() => handleToggleStudent(student.rollNo)}
                        style={{
                          width: "18px",
                          height: "18px",
                          marginRight: "0.75rem",
                          cursor: "pointer"
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {student.rollNo} • Year {student.year} • {student.branch}
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 12px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "0.9rem"
                      }}>
                        ₹{student.fines}
                      </div>
                    </label>
                  ))
                )}
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleClearFines}
                  disabled={loading || selectedStudents.length === 0}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: selectedStudents.length === 0 ? "#94a3b8" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (loading || selectedStudents.length === 0) ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  ✅ Clear Fines ({selectedStudents.length})
                </button>
                <button
                  onClick={() => {
                    setShowFinesList(false);
                    setSelectedStudents([]);
                  }}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  ✕
                </button>
              </div>
            </>
          )}
        </div>

        {/* Complete Reset */}
        <div style={{
          padding: "1.5rem",
          border: "2px solid #dc3545",
          borderRadius: "8px",
          backgroundColor: "#fff5f5"
        }}>
          <h4 style={{ color: "#dc3545", marginBottom: "1rem", fontSize: "1.1rem" }}>
            🚨 Complete Database Reset
          </h4>
          <p style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "1rem" }}>
            <strong>⚠️ DANGER ZONE:</strong>
            <br />Permanently delete ALL students from database.
            <br />This action cannot be undone!
            <br />Use only for prototype testing.
          </p>
          <button
            onClick={handleDeleteAllStudents}
            disabled={loading}
            style={{
              padding: "12px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            💥 DELETE ALL STUDENTS
          </button>
        </div>
      </div>

      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
            <p>Processing operation...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagement;