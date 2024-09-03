import React, { useState } from 'react';

const Timetable = ({ timetableData }) => {
  const [selectedClasses, setSelectedClasses] = useState([]);

  const handleCheckboxChange = (event) => {
    const { checked, dataset } = event.target;
    const { subject, teacher, class: className, day, time } = dataset;

    if (checked) {
      setSelectedClasses(prevState => [...prevState, { subject, teacher, className, day, time }]);
    } else {
      setSelectedClasses(prevState =>
        prevState.filter(
          item => item.subject !== subject || item.teacher !== teacher || item.className !== className || item.day !== day || item.time !== time
        )
      );
    }
  };

  const countClasses = () => {
    const classCount = {};

    timetableData.forEach(({ subject, teacher, className }) => {
      const key = `${subject}-${teacher}-${className}`;
      if (!classCount[key]) {
        classCount[key] = { subject, teacher, className, count: 1 };
      } else {
        classCount[key].count += 1;
      }
    });

    return Object.values(classCount);
  };

  const uniqueClasses = countClasses();

  return (
    <div>
      <h3 className="text-center my-4">Timetable</h3>
      <table className="table timetable-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Class</th>
            <th>No. of Classes</th>
          </tr>
        </thead>
        <tbody>
          {uniqueClasses.map(({ subject, teacher, className, count }, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  data-subject={subject}
                  data-teacher={teacher}
                  data-class={className}
                  onChange={handleCheckboxChange}
                />
              </td>
              <td>{subject}</td>
              <td>{teacher}</td>
              <td>{className}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Timetable;
