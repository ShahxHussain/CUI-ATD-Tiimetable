import React, { useState } from 'react';
import '../App.css'

const Timetable = ({ timetableData }) => {
  const [selectedClasses, setSelectedClasses] = useState([]);

  const handleCheckboxChange = (event) => {
    const { checked, dataset } = event.target;
    const { subject, teacher, class: className, day, time } = dataset;

    if (checked) {
      setSelectedClasses([...selectedClasses, { subject, teacher, className, day, time }]);
    } else {
      setSelectedClasses(selectedClasses.filter(item => item.subject !== subject || item.teacher !== teacher || item.className !== className || item.day !== day || item.time !== time));
    }
  };

  const updateTimetable = () => {
    const newTimetable = {};
    selectedClasses.forEach(({ subject, teacher, day, time }) => {
      const formattedDay = day.toLowerCase();
      const formattedTime = time.replace(/:/g, '-');

      if (!newTimetable[formattedDay]) newTimetable[formattedDay] = {};
      if (!newTimetable[formattedDay][formattedTime]) newTimetable[formattedDay][formattedTime] = [];

      newTimetable[formattedDay][formattedTime].push(`${subject} (${teacher})`);
    });

    return newTimetable;
  };

  const newTimetableData = updateTimetable();

  return (
    <div>
      <h3 className="text-center my-4">Timetable</h3>
      <table className="table timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>09:00 to 10:30</th>
            <th>10:40 to 12:10</th>
            <th>12:20 to 14:20</th>
            <th>14:30 to 16:00</th>
            <th>16:10 to 17:40</th>
            <th>17:40 to 19:10</th>
            <th>19:10 to 20:40</th>
            <th>20:40 to 22:10</th>
          </tr>
        </thead>
        <tbody>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
            <tr key={day}>
              <td>{day.charAt(0).toUpperCase() + day.slice(1)}</td>
              {['09:00-10:30', '10:40-12:10', '12:20-14:20', '14:30-16:00', '16:10-17:40', '17:40-19:10', '19:10-20:40', '20:40-22:10'].map(time => (
                <td key={time} id={`${day}-${time}`}>
                  {newTimetableData[day] && newTimetableData[day][time] && newTimetableData[day][time].join(', ')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Timetable;
