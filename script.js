// Attendance Manager Class
class AttendanceManager {
    constructor() {
        this.attendanceList = this.loadFromLocalStorage() || [];
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.renderAttendance();
        this.updateStatistics();
    }

    setupEventListeners() {
        document.getElementById('checkInBtn').addEventListener('click', () => this.checkIn());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetDay());
        document.getElementById('searchEmployee').addEventListener('input', () => this.filterAttendance());
        document.getElementById('roleFilter').addEventListener('change', () => this.filterAttendance());
        
        // Set current time as default
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('checkInTime').value = `${hours}:${minutes}`;
    }

    checkIn() {
        const name = document.getElementById('employeeName').value.trim();
        const role = document.getElementById('employeeRole').value;
        const checkInTime = document.getElementById('checkInTime').value;

        if (!name || !role || !checkInTime) {
            alert('Please fill in all fields');
            return;
        }

        // Check if employee already checked in today
        const existingEmployee = this.attendanceList.find(e => e.name.toLowerCase() === name.toLowerCase());
        
        if (existingEmployee && !existingEmployee.checkOutTime) {
            alert('Employee already checked in. Please check them out first.');
            return;
        }

        const attendance = {
            id: Date.now(),
            name: name,
            role: role,
            checkInTime: checkInTime,
            checkOutTime: null,
            date: new Date().toLocaleDateString()
        };

        this.attendanceList.push(attendance);
        this.saveToLocalStorage();
        this.renderAttendance();
        this.updateStatistics();
        this.clearForm();
    }

    checkOut(id) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const checkOutTime = `${hours}:${minutes}`;

        const attendance = this.attendanceList.find(a => a.id === id);
        if (attendance) {
            attendance.checkOutTime = checkOutTime;
            this.saveToLocalStorage();
            this.renderAttendance();
            this.updateStatistics();
        }
    }

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.attendanceList = this.attendanceList.filter(a => a.id !== id);
            this.saveToLocalStorage();
            this.renderAttendance();
            this.updateStatistics();
        }
    }

    renderAttendance() {
        const tbody = document.getElementById('attendanceBody');
        tbody.innerHTML = '';

        const filtered = this.getFilteredAttendance();

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No attendance records yet</td></tr>';
            return;
        }

        filtered.forEach(attendance => {
            const row = document.createElement('tr');
            const status = attendance.checkOutTime ? 'Checked Out' : 'Present';
            const statusClass = attendance.checkOutTime ? 'status-checked-out' : 'status-present';
            
            row.innerHTML = `
                <td><strong>${attendance.name}</strong></td>
                <td>${attendance.role}</td>
                <td>${attendance.checkInTime}</td>
                <td>${attendance.checkOutTime || '-'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    ${!attendance.checkOutTime ? `<button class="action-btn" onclick="attendanceManager.checkOut(${attendance.id})">Check Out</button>` : ''}
                    <button class="action-btn delete" onclick="attendanceManager.deleteRecord(${attendance.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getFilteredAttendance() {
        const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();
        const roleFilter = document.getElementById('roleFilter').value;

        return this.attendanceList.filter(attendance => {
            const matchesSearch = attendance.name.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || attendance.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }

    filterAttendance() {
        this.renderAttendance();
    }

    updateStatistics() {
        const today = new Date().toLocaleDateString();
        const todayRecords = this.attendanceList.filter(a => a.date === today);

        const totalPresent = todayRecords.filter(a => !a.checkOutTime).length;
        const totalCheckedOut = todayRecords.filter(a => a.checkOutTime).length;
        const totalAbsent = 0; // Can be updated based on total employees

        document.getElementById('totalPresent').textContent = totalPresent;
        document.getElementById('totalCheckedOut').textContent = totalCheckedOut;
        document.getElementById('totalAbsent').textContent = totalAbsent;

        // Calculate average hours
        let totalHours = 0;
        let count = 0;

        todayRecords.forEach(record => {
            if (record.checkOutTime) {
                const hours = this.calculateHours(record.checkInTime, record.checkOutTime);
                totalHours += hours;
                count++;
            }
        });

        const avgHours = count > 0 ? (totalHours / count).toFixed(1) : 0;
        document.getElementById('avgHours').textContent = avgHours + 'h';
    }

    calculateHours(checkIn, checkOut) {
        const [inHour, inMin] = checkIn.split(':').map(Number);
        const [outHour, outMin] = checkOut.split(':').map(Number);

        const inTime = inHour * 60 + inMin;
        const outTime = outHour * 60 + outMin;

        return Math.max(0, (outTime - inTime) / 60);
    }

    clearForm() {
        document.getElementById('employeeName').value = '';
        document.getElementById('employeeRole').value = '';
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('checkInTime').value = `${hours}:${minutes}`;
        document.getElementById('employeeName').focus();
    }

    exportToCSV() {
        if (this.attendanceList.length === 0) {
            alert('No data to export');
            return;
        }

        let csv = 'Name,Role,Date,Check-In,Check-Out,Hours Worked\n';

        this.attendanceList.forEach(record => {
            const hours = record.checkOutTime ? this.calculateHours(record.checkInTime, record.checkOutTime) : '-';
            csv += `${record.name},${record.role},${record.date},${record.checkInTime},${record.checkOutTime || '-'},${hours}\n`;
        });

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    resetDay() {
        if (confirm('Are you sure you want to reset all attendance records? This cannot be undone.')) {
            const today = new Date().toLocaleDateString();
            this.attendanceList = this.attendanceList.filter(a => a.date !== today);
            this.saveToLocalStorage();
            this.renderAttendance();
            this.updateStatistics();
            alert('Today\'s records have been reset');
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('attendanceData', JSON.stringify(this.attendanceList));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('attendanceData');
        return data ? JSON.parse(data) : null;
    }
}

// Initialize the app
let attendanceManager;
document.addEventListener('DOMContentLoaded', () => {
    attendanceManager = new AttendanceManager();
};