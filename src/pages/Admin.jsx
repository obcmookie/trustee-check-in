// src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';
import { fetchScanLogs } from '../utils/api';
import { CSVLink } from 'react-csv';

const Admin = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'scan_time', direction: 'descending' });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        const scanLogs = await fetchScanLogs();
        setLogs(scanLogs);
        setFilteredLogs(scanLogs);
        setLoading(false);
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        filterLogs(term, filterDate);
    };

    const handleDateFilter = (e) => {
        const date = e.target.value;
        setFilterDate(date);
        filterLogs(searchTerm, date);
    };

    const filterLogs = (term, date) => {
        const filtered = logs.filter(log => {
            const name = `${log.trustee?.first_name} ${log.trustee?.last_name}`.toLowerCase();
            const gaam = log.trustee?.gaam.toLowerCase();
            const matchesName = name.includes(term);
            const matchesGaam = gaam.includes(term);

            const logDate = log.scan_time.split('T')[0];
            const matchesDate = !date || logDate === date;

            return (matchesName || matchesGaam) && matchesDate;
        });

        setFilteredLogs(filtered);
        setCurrentPage(1);
    };

    const csvHeaders = [
        { label: 'Trustee', key: 'trustee_name' },
        { label: 'Gaam', key: 'gaam' },
        { label: 'Scan Time', key: 'scan_time' },
        { label: 'Scanned By', key: 'scanned_by' }
    ];

    const csvData = filteredLogs.map(log => ({
        trustee_name: `${log.trustee?.first_name} ${log.trustee?.last_name}`,
        gaam: log.trustee?.gaam,
        scan_time: new Date(log.scan_time).toLocaleString(),
        scanned_by: log.scanned_by || 'Unknown'
    }));

    const sortedLogs = [...filteredLogs].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="admin-page">
            <h1>Scan Logs</h1>

            {loading && <p>Loading logs...</p>}

            {!loading && (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Search by name or gaam"
                            value={searchTerm}
                            onChange={handleSearch}
                            style={{ padding: '5px', marginRight: '10px' }}
                        />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={handleDateFilter}
                            style={{ padding: '5px', marginRight: '10px' }}
                        />
                        <CSVLink
                            data={csvData}
                            headers={csvHeaders}
                            filename={'scan_logs.csv'}
                            style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
                        >
                            Export CSV
                        </CSVLink>
                    </div>

                    {currentLogs.length === 0 && <p>No logs found.</p>}

                    {currentLogs.length > 0 && (
                        <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid black', padding: '5px', cursor: 'pointer' }} onClick={() => requestSort('trustee_name')}>Trustee</th>
                                    <th style={{ border: '1px solid black', padding: '5px', cursor: 'pointer' }} onClick={() => requestSort('gaam')}>Gaam</th>
                                    <th style={{ border: '1px solid black', padding: '5px', cursor: 'pointer' }} onClick={() => requestSort('scan_time')}>Scan Time</th>
                                    <th style={{ border: '1px solid black', padding: '5px' }}>Scanned By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ border: '1px solid black', padding: '5px' }}>
                                            {log.trustee?.first_name} {log.trustee?.last_name}
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '5px' }}>
                                            {log.trustee?.gaam}
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '5px' }}>
                                            {new Date(log.scan_time).toLocaleString()}
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '5px' }}>
                                            {log.scanned_by || 'Unknown'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        {Array.from({ length: Math.ceil(filteredLogs.length / logsPerPage) }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => paginate(i + 1)}
                                style={{ margin: '0 5px', padding: '5px 10px', backgroundColor: currentPage === i + 1 ? '#4CAF50' : '#f0f0f0' }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Admin;
