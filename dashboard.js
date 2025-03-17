document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('cookieTableBody');
    const searchInput = document.getElementById('searchInput');
    let lastFetchedData = []; // Store the last fetched data

    // Fetch data from the backend
    async function fetchData(searchTerm = '') {
        try {
            tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
            let url = 'https://backendcookie-zi2t.onrender.com/api/gdpr-data';
            if (searchTerm) {
                url = `https://backendcookie-zi2t.onrender.com/api/gdpr-data/${searchTerm}`;
            }
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            lastFetchedData = Array.isArray(data) ? data : [data]; // Store raw data
            renderTable(lastFetchedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
        }
    }

    // Render table rows
    function renderTable(data) {
        tableBody.innerHTML = '';
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            const timestampsHtml = formatTimestamps(item.timestamps);
            const preferencesHtml = formatPreferences(item.preferences);
            row.innerHTML = `
                <td>${item.consentId || 'N/A'}</td>
                <td>${item.ipAddress || 'N/A'}</td>
                <td>${timestampsHtml}</td>
                <td>${preferencesHtml}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-btn" data-id="${item.consentId}">View</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.consentId}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewDetails(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
        });

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Format preferences with badges
    function formatPreferences(preferences) {
        if (!preferences) return 'N/A';
        const prefList = Object.entries(preferences)
            .map(([key, value]) => {
                const badgeClass = value ? 'badge bg-success' : 'badge bg-danger';
                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<span class="${badgeClass} me-1">${displayKey}: ${value ? 'Yes' : 'No'}</span>`;
            })
            .join('');
        return `<div>${prefList}</div>`;
    }

    // Format timestamps with a compact display and tooltip
    function formatTimestamps(timestamps) {
        if (!timestamps) return 'N/A';
        const cp = timestamps.cookiePreferences || {};
        const loc = timestamps.location || {};
        const summary = `Cookie Created: ${cp.createdAt ? new Date(cp.createdAt).toLocaleDateString() : 'N/A'}`;
        const fullDetails = `
            Cookie: Created: ${cp.createdAt ? new Date(cp.createdAt).toLocaleString() : 'N/A'}, Updated: ${cp.updatedAt ? new Date(cp.updatedAt).toLocaleString() : 'N/A'}
            Location: Created: ${loc.createdAt ? new Date(loc.createdAt).toLocaleString() : 'N/A'}, Updated: ${loc.updatedAt ? new Date(loc.updatedAt).toLocaleString() : 'N/A'}
        `.replace(/\n\s*/g, '<br>');
        return `<span data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title="${fullDetails}">${summary}</span>`;
    }

    // Full timestamp format for modal
    function formatTimestampsFull(timestamps) {
        if (!timestamps) return 'N/A';
        const cp = timestamps.cookiePreferences || {};
        const loc = timestamps.location || {};
        return `
            <div>
                <strong>Cookie:</strong> 
                Created: ${cp.createdAt ? new Date(cp.createdAt).toLocaleString() : 'N/A'}, 
                Updated: ${cp.updatedAt ? new Date(cp.updatedAt).toLocaleString() : 'N/A'}
            </div>
            <div>
                <strong>Location:</strong> 
                Created: ${loc.createdAt ? new Date(loc.createdAt).toLocaleString() : 'N/A'}, 
                Updated: ${loc.updatedAt ? new Date(loc.updatedAt).toLocaleString() : 'N/A'}
            </div>
        `;
    }

    // Initial data load
    fetchData();

    // Search with debounce
    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            fetchData(searchTerm);
        }, 300);
    });

    // View details in a modal
    function viewDetails(consentId) {
        const item = lastFetchedData.find(d => d.consentId === consentId); // Use raw data
        if (!item) {
            fetchData(consentId).then(() => {
                const fetchedItem = lastFetchedData[0]; // Single item from search
                if (fetchedItem) {
                    const data = {
                        consentId: fetchedItem.consentId || 'N/A',
                        ipAddress: fetchedItem.ipAddress || 'N/A',
                        timestamps: formatTimestampsFull(fetchedItem.timestamps),
                        preferences: formatPreferences(fetchedItem.preferences)
                    };
                    showModal(data);
                }
            });
        } else {
            const data = {
                consentId: item.consentId || 'N/A',
                ipAddress: item.ipAddress || 'N/A',
                timestamps: formatTimestampsFull(item.timestamps),
                preferences: formatPreferences(item.preferences)
            };
            showModal(data);
        }
    }

    // Show modal with details
    function showModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Details for ${data.consentId}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Consent ID:</strong> ${data.consentId}</p>
                        <p><strong>IP Address:</strong> ${data.ipAddress}</p>
                        <p><strong>Timestamps:</strong> ${data.timestamps}</p>
                        <p><strong>Preferences:</strong> ${data.preferences}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    }

    // Delete entry
    async function deleteEntry(consentId) {
        if (confirm(`Are you sure you want to delete ${consentId}?`)) {
            try {
                const response = await fetch(`https://backendcookie-8qc1.onrender.com/api/gdpr-data/${consentId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete: ${response.status}`);
                }
                alert(`Successfully deleted ${consentId}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert('Delete functionality not fully implemented in backend yet.');
            }
        }
    }
});
