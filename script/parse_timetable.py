import requests
from bs4 import BeautifulSoup
import json

def fetch_timetable(url):
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return None
    return response.text

def fetch_all_classes(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    dropdown = soup.find('select', {'id': 'ddlClasses'})
    if not dropdown:
        print("Class dropdown not found.")
        return []
    classes = [option['value'] for option in dropdown.find_all('option')]
    return classes

def parse_timetable(html_content, class_name):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Post back to select the class
    data = {
        '__EVENTTARGET': 'ddlClasses',
        '__EVENTARGUMENT': '',
        'ddlClasses': class_name,
        '__VIEWSTATE': soup.find('input', {'id': '__VIEWSTATE'})['value'],
        '__EVENTVALIDATION': soup.find('input', {'id': '__EVENTVALIDATION'})['value']
    }
    response = requests.post('https://cuonline.cuiatd.edu.pk/Timetable/Timetable.aspx', data=data)
    if response.status_code != 200:
        print(f"Failed to retrieve the timetable for class {class_name}. Status code: {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', {'id': 'gvTimeTable1'})  
    if not table:
        print(f"Timetable table not found for class {class_name}.")
        return []

    timetable_data = []
    headers = [th.get_text(strip=True) for th in table.find('tr').find_all('th')]

    for row in table.find_all('tr')[1:]:  # Skip header row
        cells = row.find_all('td')
        day = cells[0].get_text(strip=True)
        time_slot_idx = 0  # Index to track the current time slot

        # Track shifts
        shifts = {}

        while time_slot_idx < len(cells) - 1:
            cell = cells[time_slot_idx + 1]
            content = cell.get_text(separator="|", strip=True)
            if content:
                parts = content.split('|')
                if len(parts) >= 3:
                    subject = parts[0]
                    room = parts[1]
                    teacher = parts[2]
                elif len(parts) == 2:
                    subject = parts[0]
                    room = parts[1]
                    teacher = ""
                else:
                    subject = parts[0]
                    room = ""
                    teacher = ""

                # Check for specific time slots and extract teacher name from <font> tags if available
                if teacher.lower() in ["2 hr class", "1.5 hr class", "1 hr class"]:
                    duration = teacher
                    # Handle special cases where teacher's name is inside <font> tags
                    teacher_tag = cell.find('font', color='blue')
                    if teacher_tag:
                        teacher = teacher_tag.get_text(strip=True).replace("Dr. ", "").replace("Prof. ", "").strip()

                    # Handle cases where teacher's name might be under <b> or additional <font> tags
                    if not teacher:
                        teacher_tag = cell.find('b')
                        if teacher_tag:
                            teacher = teacher_tag.get_text(strip=True).replace("Dr. ", "").replace("Prof. ", "").strip()
                else:
                    duration = "1.5 Hr Class"

                # Remove HTML tags from teacher's name if needed
                teacher = BeautifulSoup(teacher, 'html.parser').get_text(strip=True)

                # Determine the time slot based on the column index
                time_slot = headers[time_slot_idx + 1]  # +1 because headers include DayTitle

                # Create the entry
                entry = {
                    "class": class_name,
                    "day": day,
                    "time_slot": time_slot,
                    "subject": subject,
                    "room": room,
                    "teacher": teacher,
                    "duration": duration  # Add the duration to the output
                }

                if "lab" in room.lower():
                    # Allocate the next 2 time slots to the lab (lab takes 2 slots)
                    for i in range(2):
                        if time_slot_idx + i < len(headers) - 1:
                            lab_entry = entry.copy()
                            lab_entry["time_slot"] = headers[time_slot_idx + i + 1]
                            timetable_data.append(lab_entry)
                        
                    # Shift subsequent entries
                    shift_start_idx = time_slot_idx + 2  # Start shifting after the lab's slots
                    while shift_start_idx < len(cells) - 1:
                        next_cell_content = cells[shift_start_idx + 1].get_text(separator="|", strip=True)
                        if next_cell_content:
                            # Shift class or lab found in the next slot
                            shift_slot_idx = shift_start_idx
                            while shift_slot_idx < len(cells) - 1 and cells[shift_slot_idx + 1].get_text(strip=True):
                                shift_slot_idx += 1
                            if shift_slot_idx < len(headers) - 1:
                                shifted_time_slot = headers[shift_slot_idx + 1]
                                shifted_entry = {
                                    "class": class_name,
                                    "day": day,
                                    "time_slot": shifted_time_slot,
                                    "subject": parts[0],
                                    "room": parts[1] if len(parts) > 1 else "",
                                    "teacher": parts[2] if len(parts) > 2 else "",
                                    "duration": duration
                                }
                                timetable_data.append(shifted_entry)
                        shift_start_idx += 1
                else:
                    timetable_data.append(entry)

            time_slot_idx += 1  # Move to the next time slot

    return timetable_data

def save_to_json(data, filename='timetable.json'):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Timetable data saved to {filename}")

def main():
    url = "https://cuonline.cuiatd.edu.pk/Timetable/Timetable.aspx"
    html_content = fetch_timetable(url)
    if not html_content:
        return

    all_classes = fetch_all_classes(html_content)
    all_timetable_data = []

    for class_name in all_classes:
        print(f"Fetching timetable for class: {class_name}")
        timetable_data = parse_timetable(html_content, class_name)
        if timetable_data:
            all_timetable_data.extend(timetable_data)

    if all_timetable_data:
        save_to_json(all_timetable_data)

if __name__ == "__main__":
    main()
