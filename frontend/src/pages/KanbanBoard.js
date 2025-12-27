import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

const KanbanBoard = () => {
    const [columns, setColumns] = useState({
        'New': [],
        'In Progress': [],
        'Repaired': [],
        'Scrap': []
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const res = await api.get('/requests');
        const grouped = {
            'New': [],
            'In Progress': [],
            'Repaired': [],
            'Scrap': []
        };
        res.data.forEach(req => {
            if (grouped[req.status]) {
                grouped[req.status].push(req);
            } else {
                // Fallback for unknown status
                grouped['New'].push(req);
            }
        });
        setColumns(grouped);
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistic UI Update
        const sourceCol = [...columns[source.droppableId]];
        const destCol = [...columns[destination.droppableId]];
        const [movedReq] = sourceCol.splice(source.index, 1);
        
        // Update status locally
        movedReq.status = destination.droppableId;
        destCol.splice(destination.index, 0, movedReq);

        setColumns({
            ...columns,
            [source.droppableId]: sourceCol,
            [destination.droppableId]: destCol
        });

        // API Call
        try {
            await api.put(`/requests/${movedReq.id}`, { status: destination.droppableId });
        } catch (error) {
            console.error("Failed to move card", error);
            fetchRequests(); // Revert on error
        }
    };

    const isOverdue = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    return (
        <Container fluid className="mt-4">
            <div className="d-flex justify-content-between mb-3">
                <h2>Maintenance Board</h2>
                <Button as={Link} to="/requests/new" variant="primary">+ New Request</Button>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Row className="flex-nowrap overflow-auto pb-4">
                    {Object.entries(columns).map(([columnId, requests]) => (
                        <Col md={3} key={columnId} style={{minWidth: '300px'}}>
                            <div className="bg-light p-3 rounded h-100">
                                <h5 className="text-center mb-3 text-uppercase fw-bold text-muted" style={{fontSize: '0.9rem'}}>
                                    {columnId} <Badge bg="secondary" pill>{requests.length}</Badge>
                                </h5>
                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{ minHeight: '500px' }}
                                        >
                                            {requests.map((req, index) => (
                                                <Draggable key={req.id.toString()} draggableId={req.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <Card 
                                                            className="mb-2 shadow-sm border-0"
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            {/* Overdue Indicator Strip */}
                                                            {isOverdue(req.scheduled_date) && req.status !== 'Repaired' && req.status !== 'Scrap' && (
                                                                <div className="bg-danger" style={{height: '4px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px'}}></div>
                                                            )}
                                                            
                                                            <Card.Body className="p-3">
                                                                <Card.Title className="h6 mb-1">{req.subject}</Card.Title>
                                                                <Card.Text className="text-muted small mb-2">
                                                                    {req.equipment?.name} 
                                                                    {req.equipment?.serial_number && ` (${req.equipment.serial_number})`}
                                                                </Card.Text>
                                                                
                                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                                    <Badge bg={req.type === 'Corrective' ? 'warning' : 'info'} text="dark">
                                                                        {req.type}
                                                                    </Badge>
                                                                    
                                                                    {/* Technician Avatar */}
                                                                    <div className="d-flex align-items-center text-muted" title={req.technician?.name || "Unassigned"}>
                                                                        <FaUserCircle size={18} className="me-1" />
                                                                        <small style={{fontSize: '0.8rem'}}>
                                                                            {req.technician?.name ? req.technician.name.split(' ')[0] : '-'}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </Col>
                    ))}
                </Row>
            </DragDropContext>
        </Container>
    );
};

export default KanbanBoard;