import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Button, Badge, Row, Col, ListGroup } from 'react-bootstrap';
import api from '../services/api';

const EquipmentDetail = () => {
    const { id } = useParams();
    const [equipment, setEquipment] = useState(null);
    const [requests, setRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eqRes = await api.get(`/equipment?id=${id}`); 
                // Note: The generic get returns list, we filter manually for prototype or assume ID match if API supports /equipment/{id}
                // To be safe with current API:
                const allEq = await api.get('/equipment');
                const match = allEq.data.find(e => e.id === parseInt(id));
                setEquipment(match);

                const reqRes = await api.get(`/equipment/${id}/requests`);
                setRequests(reqRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    if (!equipment) return <Container className="mt-4">Loading...</Container>;

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">
                    {equipment.name} 
                    <Badge bg={equipment.is_usable ? "success" : "danger"} className="ms-2">
                        {equipment.is_usable ? "Usable" : "Scrapped"}
                    </Badge>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Card.Text><strong>Category:</strong> {equipment.category}</Card.Text>
                            <Card.Text><strong>Serial:</strong> {equipment.serial_number}</Card.Text>
                            <Card.Text><strong>Team:</strong> {equipment.maintenance_team?.name}</Card.Text>
                            <Card.Text><strong>Location:</strong> {equipment.location}</Card.Text>
                        </Col>
                        <Col md={4} className="text-end">
                            {/* SMART BUTTON */}
                            <Button variant="outline-primary" className="d-flex flex-column align-items-center" onClick={() => setShowRequests(!showRequests)}>
                                <span className="h4 mb-0">{requests.length}</span>
                                <small>Maintenance</small>
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {showRequests && (
                <div className="mt-4">
                    <h4>Maintenance History</h4>
                    <ListGroup>
                        {requests.map(r => (
                            <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{r.subject}</strong> <br/>
                                    <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                                </div>
                                <Badge bg={r.status === 'Repaired' ? 'success' : 'warning'}>{r.status}</Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            )}
        </Container>
    );
};

export default EquipmentDetail;
