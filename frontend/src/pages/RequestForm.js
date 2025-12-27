import React, { useState, useEffect } from 'react';
import { Container, Button, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const RequestForm = () => {
    const [equipmentList, setEquipmentList] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [error, setError] = useState('');
    
    // Check if equipmentId was passed in state (from Dashboard "Report Breakdown" button)
    const preSelectedEquipmentId = location.state?.equipmentId || '';

    // Determine default type based on Role
    // Employee -> Corrective ONLY
    // Manager/Tech -> Preventive ONLY
    const defaultType = user?.role === 'Employee' ? 'Corrective' : 'Preventive';

    const [formData, setFormData] = useState({
        subject: '',
        type: defaultType,
        equipment_id: preSelectedEquipmentId, // Set initial value
        scheduled_date: ''
    });

    const selectedEquipment = equipmentList.find(e => String(e.id) === String(formData.equipment_id));

    useEffect(() => {
        // Reset type if user loads (though usually user is loaded before render due to ProtectedRoute)
        if (user) {
            setFormData(prev => ({ ...prev, type: user.role === 'Employee' ? 'Corrective' : 'Preventive' }));
        }
        
        const loadEquipment = async () => {
            const res = await api.get('/equipment');
            setEquipmentList(res.data);
        };
        loadEquipment();
    }, [user]); // Re-run if user changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Frontend Validation: Ownership Check (Only for Breakdown)
        if (formData.type === 'Corrective') {
            const selectedEq = equipmentList.find(e => e.id === parseInt(formData.equipment_id));
            if (selectedEq) {
                if (selectedEq.employee_id) {
                    if (user.id && selectedEq.employee_id !== user.id) {
                        setError("You are not the assigned owner of this equipment. You cannot report breakdowns.");
                        return;
                    }
                }
            }
        }

        try {
            const payload = {
                ...formData,
                equipment_id: parseInt(formData.equipment_id),
                scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
            };
            await api.post('/requests', payload);
            navigate(user.role === 'Employee' ? '/' : '/kanban'); // Redirect based on role
        } catch (err) {
            setError(err.response?.data?.error || 'Error creating request');
        }
    };

    return (
        <Container className="mt-4 col-md-6">
            <h2>Create Request</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control" required onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Type</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={formData.type === 'Corrective' ? 'Corrective (Breakdown)' : 'Preventive (Routine)'} 
                        readOnly 
                        disabled
                        style={{ backgroundColor: '#e9ecef' }}
                    />
                    <div className="form-text">
                        {user?.role === 'Employee' 
                            ? "You can only report breakdowns." 
                            : "Managers schedule preventive maintenance."}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Equipment</label>
                    <select 
                        className="form-select" 
                        required 
                        value={formData.equipment_id} // Bind to state
                        onChange={e => setFormData({...formData, equipment_id: e.target.value})}
                    >
                        <option value="">Select...</option>
                        {equipmentList.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                        ))}
                    </select>
                </div>

                {selectedEquipment && (
                    <div className="p-3 mb-3 bg-light rounded shadow-sm border-start border-primary border-4 animate-in">
                        <div className="row">
                            <div className="col-6">
                                <label className="text-muted small text-uppercase fw-bold mb-1">Equipment Category</label>
                                <div className="fw-medium text-dark">{selectedEquipment.category || 'Not specified'}</div>
                            </div>
                            <div className="col-6">
                                <label className="text-muted small text-uppercase fw-bold mb-1">Responsible Team</label>
                                <div className="fw-medium text-primary">
                                    {selectedEquipment.maintenance_team?.name || 'No team assigned'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {formData.type === 'Preventive' && (
                    <div className="mb-3">
                        <label className="form-label">Scheduled Date</label>
                        <input type="date" className="form-control" onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
                    </div>
                )}

                <Button type="submit">Create Request</Button>
            </form>
        </Container>
    );
};

export default RequestForm;
