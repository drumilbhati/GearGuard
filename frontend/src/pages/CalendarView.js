import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import api from '../services/api';

const CalendarView = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchPreventive = async () => {
            const res = await api.get('/requests?type=Preventive');
            setRequests(res.data);
        };
        fetchPreventive();
    }, []);

    // Simple grouping by date for the prototype
    const grouped = requests.reduce((acc, req) => {
        if (!req.scheduled_date) return acc;
        const date = new Date(req.scheduled_date).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(req);
        return acc;
    }, {});

    return (
        <Container className="mt-4">
            <h2>Preventive Maintenance Calendar</h2>
            <Row className="mt-3">
                {Object.keys(grouped).map(date => (
                    <Col md={4} key={date} className="mb-3">
                        <Card>
                            <Card.Header>{date}</Card.Header>
                            <Card.Body>
                                {grouped[date].map(r => (
                                    <div key={r.id} className="mb-2 pb-2 border-bottom">
                                        <strong>{r.subject}</strong><br/>
                                        <small>{r.equipment?.name}</small>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default CalendarView;
