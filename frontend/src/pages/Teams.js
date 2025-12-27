import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Card, Row, Col } from 'react-bootstrap';
import api from '../services/api';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data);
        } catch (error) {
            console.error("Error fetching teams", error);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teams', { name: newTeamName });
            setShowModal(false);
            setNewTeamName('');
            fetchTeams();
        } catch (error) {
            alert('Failed to create team');
        }
    };

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Maintenance Teams</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>+ New Team</Button>
            </div>

            <Row>
                {teams.map(team => (
                    <Col md={6} key={team.id} className="mb-4">
                        <Card>
                            <Card.Header as="h5">{team.name}</Card.Header>
                            <Card.Body>
                                <Card.Title className="text-muted" style={{fontSize: '1rem'}}>Members</Card.Title>
                                {team.members && team.members.length > 0 ? (
                                    <ul>
                                        {team.members.map(member => (
                                            <li key={member.id}>
                                                {member.name} <span className="text-muted">({member.role})</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted">No technicians assigned yet.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Create Team Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Team</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateTeam}>
                        <Form.Group className="mb-3">
                            <Form.Label>Team Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="e.g. Electricians" 
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                required 
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">Create</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Teams;
