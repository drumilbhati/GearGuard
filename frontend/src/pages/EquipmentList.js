import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const EquipmentList = () => {
    const [equipment, setEquipment] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment');
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Equipment</h2>
                <Button variant="primary" onClick={() => navigate('/equipment/new')}>+ New Equipment</Button>
            </div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Serial #</th>
                        <th>Team</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {equipment.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.serial_number}</td>
                            <td>{item.maintenance_team?.name || 'N/A'}</td>
                            <td>
                                {item.is_usable ? (
                                    <Badge bg="success">Active</Badge>
                                ) : (
                                    <Badge bg="danger">Scrapped</Badge>
                                )}
                            </td>
                            <td>
                                <Button size="sm" variant="info" onClick={() => navigate(`/equipment/${item.id}`)}>
                                    View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default EquipmentList;
