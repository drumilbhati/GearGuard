import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'Technician', team_id: ''
    });
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/teams').then(res => setTeams(res.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.role === 'Technician' && payload.team_id) {
                payload.team_id = parseInt(payload.team_id);
            } else {
                payload.team_id = null;
            }
            await api.post('/register', payload);
            navigate('/login');
        } catch (err) {
            // Display server error if available
            const msg = err.response?.data?.error || 'Registration failed. Email might be taken.';
            setError(msg);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card style={{ width: '400px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Sign Up</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control type="text" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                <option value="Technician">Technician</option>
                                <option value="Manager">Manager</option>
                            </Form.Select>
                        </Form.Group>
                        {formData.role === 'Technician' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Team</Form.Label>
                                <Form.Select required onChange={(e) => setFormData({...formData, team_id: e.target.value})}>
                                    <option value="">Select Team...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        )}
                        <Button className="w-100" type="submit">Sign Up</Button>
                    </Form>
                    <div className="text-center mt-3">
                        <a href="/login">Already have an account? Login</a>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Signup;
