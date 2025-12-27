import React, { useState, useEffect } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const EquipmentForm = () => {
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [allTechnicians, setAllTechnicians] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        department: '',
        serial_number: '',
        maintenance_team_id: '',
        default_technician_id: '',
        employee_id: '',
        location: '',
        purchase_date: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamRes = await api.get('/teams');
                setTeams(teamRes.data);
                
                const empRes = await api.get('/users/employees');
                setEmployees(empRes.data);

                const techRes = await api.get('/users/technicians');
                console.log("Fetched Technicians:", techRes.data);
                setAllTechnicians(techRes.data);
            } catch (error) {
                console.error("Error fetching form data", error);
            }
        };
        fetchData();
    }, []);

    // Filter technicians based on selected team
    // We use String conversion to ensure "1" matches 1
    const technicians = allTechnicians.filter(tech => {
        if (!formData.maintenance_team_id || !tech.team_id) return false;
        return String(tech.team_id) === String(formData.maintenance_team_id);
    });

    // For debugging: count how many techs total vs filtered
    console.log(`Total Techs: ${allTechnicians.length}, Filtered for Team ${formData.maintenance_team_id}: ${technicians.length}`);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert IDs to int
            const payload = {
                ...formData,
                maintenance_team_id: parseInt(formData.maintenance_team_id),
                default_technician_id: formData.default_technician_id ? parseInt(formData.default_technician_id) : null,
                employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
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
                    <Form.Label>Department</Form.Label>
                    <Form.Control type="text" placeholder="e.g. Production, HR, IT" onChange={(e) => setFormData({...formData, department: e.target.value})} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Serial Number</Form.Label>
                    <Form.Control type="text" required onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                </Form.Group>
                
                <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control type="text" placeholder="e.g. Floor 2, Bay A" onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Maintenance Team (Responsible)</Form.Label>
                    <Form.Select required value={formData.maintenance_team_id} onChange={(e) => setFormData({...formData, maintenance_team_id: e.target.value, default_technician_id: ''})}>
                        <option value="">Select Team...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Form.Select>
                </Form.Group>

                {formData.maintenance_team_id && (
                    <Form.Group className="mb-3">
                        <Form.Label>Default Technician (for Preventive Requests)</Form.Label>
                        <Form.Select value={formData.default_technician_id} onChange={(e) => setFormData({...formData, default_technician_id: e.target.value})}>
                            <option value="">No Default</option>
                            {technicians && technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            This technician will be auto-assigned to all preventive maintenance for this equipment.
                        </Form.Text>
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Assigned Employee (Owner)</Form.Label>
                    <Form.Select onChange={(e) => setFormData({...formData, employee_id: e.target.value})}>
                        <option value="">Unassigned</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
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
