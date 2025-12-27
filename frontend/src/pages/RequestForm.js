import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, ListGroup } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const RequestForm = () => {
    const [equipmentList, setEquipmentList] = useState([]);
    const [formData, setFormData] = useState({
        subject: '',
        type: 'Corrective',
        equipment_id: '',
        scheduled_date: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const loadEquipment = async () => {
            const res = await api.get('/equipment');
            setEquipmentList(res.data);
        };
        loadEquipment();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                equipment_id: parseInt(formData.equipment_id),
                scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
            };
            await api.post('/requests', payload);
            navigate('/kanban');
        } catch (error) {
            alert('Error creating request');
        }
    };

    return (
        <Container className="mt-4 col-md-6">
            <h2>Create Request</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control" required onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="Corrective">Corrective (Breakdown)</option>
                        <option value="Preventive">Preventive (Routine)</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Equipment</label>
                    <select className="form-select" required onChange={e => setFormData({...formData, equipment_id: e.target.value})}>
                        <option value="">Select...</option>
                        {equipmentList.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                        ))}
                    </select>
                </div>

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
