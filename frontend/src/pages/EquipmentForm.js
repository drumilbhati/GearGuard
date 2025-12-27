import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const EquipmentForm = () => {
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        serial_number: '',
        maintenance_team_id: '',
        location: '',
        purchase_date: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeams = async () => {
            const response = await api.get('/teams');
            setTeams(response.data);
        };
        fetchTeams();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert team ID to int
            const payload = {
                ...formData,
                maintenance_team_id: parseInt(formData.maintenance_team_id),
                purchase_date: new Date(formData.purchase_date).toISOString()
            };
            await api.post('/equipment', payload);
            navigate('/equipment');
        } catch (error) {
            alert('Error creating equipment');
        }
    };

    return (
        <Container className="mt-4">
            <h2>Add Equipment</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </Form.Group>
                
                <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Control type="text" placeholder="e.g. Printer, CNC Machine" onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Serial Number</Form.Label>
                    <Form.Control type="text" required onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Maintenance Team</Form.Label>
                    <Form.Select required onChange={(e) => setFormData({...formData, maintenance_team_id: e.target.value})}>
                        <option value="">Select Team...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Purchase Date</Form.Label>
                    <Form.Control type="date" required onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
                </Form.Group>

                <Button variant="primary" type="submit">Save</Button>
            </Form>
        </Container>
    );
};

export default EquipmentForm;
