import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("subject");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [additionalEntries, setAdditionalEntries] = useState([]);

  const timetableSlots = [
    "09:00 to 10:30",
    "10:40 to 12:10",
    "12:20 to 14:20",
    "14:30 to 16:00",
    "16:10 to 17:40",
    "17:40 to 19:10",
    "19:10 to 20:40",
    "20:40 to 22:10",
  ];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const fetchTimetableData = () => {
    fetch("timetable.json")
      .then((response) => response.json())
      .then((data) => {
        const results = data.filter((entry) =>
          searchBy === "subject"
            ? entry.subject.toLowerCase().includes(searchTerm.toLowerCase())
            : entry.teacher.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Filter out duplicate entries
        const uniqueResults = results.filter(
          (entry, index, self) =>
            index ===
            self.findIndex(
              (e) =>
                e.subject === entry.subject &&
                e.teacher === entry.teacher &&
                e.class === entry.class &&
                e.day === entry.day &&
                e.time_slot === entry.time_slot
            )
        );

        setSearchResults(uniqueResults);
      });
  };

  const handleCheckboxChange = (entry) => {
    if (pendingCourses.includes(entry)) {
      setPendingCourses(pendingCourses.filter((course) => course !== entry));
    } else {
      setPendingCourses([...pendingCourses, entry]);
    }
  };

  const handleApply = () => {
    let newSelectedCourses = [...selectedCourses];
    let newAdditionalEntries = [];
    let clashes = [];

    // Create a map to track entries per slot
    const slotMap = {};

    pendingCourses.forEach((entry) => {
      // Check if entry has the necessary properties
      if (!entry.day || !entry.time_slot) {
        console.warn("Entry is missing day or time_slot:", entry);
        return;
      }

      const slot = `${entry.day.toLowerCase()}-${entry.time_slot}`;

      // Check if the slot already has an entry
      if (slotMap[slot] || newSelectedCourses.some(course => course.day.toLowerCase() === entry.day.toLowerCase() && course.time === entry.time_slot)) {
        clashes.push(entry);
        return;
      }

      // Add to slot map
      slotMap[slot] = entry;

      const newCourse = {
        subject: entry.subject,
        teacher: entry.teacher,
        class: entry.class,
        day: entry.day,
        time: entry.time_slot,
      };

      // Find additional entries with the same subject, teacher, and class
      const relatedEntries = searchResults.filter(
        (item) =>
          item.subject === entry.subject &&
          item.teacher === entry.teacher &&
          item.class === entry.class &&
          (item.day !== entry.day || item.time_slot !== entry.time_slot)
      );

      newAdditionalEntries = [...newAdditionalEntries, ...relatedEntries];
      newSelectedCourses.push(newCourse);
    });

    if (clashes.length > 0) {
      // Handle clashes
      clashes.forEach((clash) => {
        alert(
          `Clash detected! The selected course "${clash.subject}" for the teacher "${clash.teacher}" and class "${clash.class}" overlaps with another course in the timetable.`
        );
      });

      // Remove the conflicting entries from pendingCourses
      const nonConflictingCourses = pendingCourses.filter(
        (course) => !clashes.includes(course)
      );

      setSelectedCourses(newSelectedCourses);
      setPendingCourses(nonConflictingCourses);
      setAdditionalEntries(newAdditionalEntries);
    } else {
      setSelectedCourses(newSelectedCourses);
      setPendingCourses([]);
      setAdditionalEntries(newAdditionalEntries);
    }
  };

  const renderTimetable = () => {
    const timetable = {};

    daysOfWeek.forEach((day) => {
      timetable[day.toLowerCase()] = {};

      timetableSlots.forEach((slot) => {
        const selectedCourse = selectedCourses.find(
          (course) =>
            course.day.toLowerCase() === day.toLowerCase() &&
            course.time === slot
        );

        // Start with an empty string for the cell
        let timetableEntry = "";

        // Add selected course entry
        if (selectedCourse) {
          timetableEntry += `${selectedCourse.subject} (${selectedCourse.teacher}) - ${selectedCourse.class}`;
        }

        // Add additional entries if they exist
        const additionalCourses = additionalEntries.filter(
          (course) =>
            course.day.toLowerCase() === day.toLowerCase() &&
            course.time_slot === slot
        );

        additionalCourses.forEach((course) => {
          timetableEntry += `; ${course.subject} (${course.teacher}) - ${course.class}`;
        });

        timetable[day.toLowerCase()][slot] = timetableEntry;
      });
    });

    return timetable;
  };

  return (
    <div className="container">
      <header className="text-center mb-4">
        <h1 style={{ color: "blue" }}>CUI ATD TIMETABLE MAKER</h1>
        <p className="lead">
          Effortless Timetables: Automate, Organize, and Optimize Your Class
          Schedule
        </p>
      </header>
      <hr />

      <div className="row">
        <div className="col-md-4">
          <h3>Search</h3>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="searchOption"
              id="searchBySubject"
              value="subject"
              checked={searchBy === "subject"}
              onChange={() => setSearchBy("subject")}
            />
            <label className="form-check-label" htmlFor="searchBySubject">
              Search by Subject
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="searchOption"
              id="searchByTeacher"
              value="teacher"
              checked={searchBy === "teacher"}
              onChange={() => setSearchBy("teacher")}
            />
            <label className="form-check-label" htmlFor="searchByTeacher">
              Search by Teacher
            </label>
          </div>

          <div className="mb-3 mt-3">
            <input
              type="text"
              id="searchInput"
              className="form-control"
              placeholder="Enter search term"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              id="searchButton"
              className="btn btn-primary mt-2"
              onClick={fetchTimetableData}
            >
              Search
            </button>
            <button style={{marginLeft:"3px"}}
              className="btn btn-success mt-2"
              onClick={handleApply}
              disabled={pendingCourses.length === 0}
            >
              Apply
            </button>
          </div>

          <div id="searchResults">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((entry, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        className="subject-checkbox"
                        onChange={() => handleCheckboxChange(entry)}
                        checked={pendingCourses.includes(entry)}
                      />
                    </td>
                    <td>{entry.subject}</td>
                    <td>{entry.teacher}</td>
                    <td>{entry.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>

        <div className="col-md-8">
          <h3>Timetable</h3>
          <table className="table timetable-table" id="timetableTable">
            <thead>
              <tr>
                <th>Day</th>
                {timetableSlots.map((slot) => (
                  <th key={slot}>{slot}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map((day) => (
                <tr key={day}>
                  <td>{day}</td>
                  {timetableSlots.map((slot) => (
                    <td key={slot}>
                      {renderTimetable()[day.toLowerCase()][slot] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
