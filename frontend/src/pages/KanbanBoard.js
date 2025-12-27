import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaPlus, FaClock } from 'react-icons/fa';

const KanbanBoard = () => {
    const [columns, setColumns] = useState({
        'New': [],
        'In Progress': [],
        'Repaired': [],
        'Scrap': []
    });

    // Completion Modal State
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completingReq, setCompletingReq] = useState(null);
    const [duration, setDuration] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            console.log("Kanban - Fetched Requests:", res.data);
            
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
                    grouped['New'].push(req);
                }
            });
            setColumns(grouped);
        } catch (error) {
            console.error("Kanban - Error fetching requests:", error);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceCol = [...columns[source.droppableId]];
        const destCol = [...columns[destination.droppableId]];
        const [movedReq] = sourceCol.splice(source.index, 1);
        
        // If moving to Repaired, open modal instead of immediate update
        if (destination.droppableId === 'Repaired') {
            setCompletingReq({ ...movedReq, sourceColId: source.droppableId, sourceIndex: source.index, destIndex: destination.index });
            setShowCompleteModal(true);
            return;
        }

        movedReq.status = destination.droppableId;
        destCol.splice(destination.index, 0, movedReq);

        setColumns({
            ...columns,
            [source.droppableId]: sourceCol,
            [destination.droppableId]: destCol
        });

        try {
            await api.put(`/requests/${movedReq.id}`, { status: destination.droppableId });
            // Re-fetch to get updated technician assignment (self-assignment logic on backend)
            fetchRequests();
        } catch (error) {
            console.error("Failed to move card", error);
            fetchRequests();
        }
    };

    const handleCompleteSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/requests/${completingReq.id}`, { 
                status: 'Repaired', 
                duration_hours: parseFloat(duration) 
            });
            setShowCompleteModal(false);
            setDuration('');
            setCompletingReq(null);
            fetchRequests();
        } catch (error) {
            alert("Error completing request: " + (error.response?.data?.error || error.message));
        }
    };

    const getColumnColor = (status) => {
        switch(status) {
            case 'New': return '#ebf8ff'; // Blue-50
            case 'In Progress': return '#fffaf0'; // Orange-50
            case 'Repaired': return '#f0fff4'; // Green-50
            case 'Scrap': return '#fff5f5'; // Red-50
            default: return '#f7fafc';
        }
    };

    const getStatusBorder = (status) => {
        switch(status) {
            case 'New': return 'border-primary';
            case 'In Progress': return 'border-warning';
            case 'Repaired': return 'border-success';
            case 'Scrap': return 'border-danger';
            default: return '';
        }
    };

    const isOverdue = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date < new Date();
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Kanban Board</h2>
                    <p className="text-muted mb-0">Manage maintenance workflows</p>
                </div>
               
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Row className="flex-nowrap overflow-auto pb-4 gap-3">
                    {Object.entries(columns).map(([columnId, requests]) => (
                        <Col key={columnId} style={{minWidth: '320px', maxWidth: '350px'}} className="p-0">
                            <div className="rounded-3 h-100 d-flex flex-column" style={{ backgroundColor: getColumnColor(columnId), border: '1px solid rgba(0,0,0,0.03)' }}>
                                <div className="p-3 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold text-uppercase text-muted mb-0" style={{fontSize: '0.8rem', letterSpacing: '0.5px'}}>
                                        {columnId}
                                    </h6>
                                    <Badge bg="white" text="dark" className="shadow-sm border">{requests.length}</Badge>
                                </div>
                                
                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="px-2 pb-3 flex-grow-1"
                                            style={{ minHeight: '150px' }}
                                        >
                                            {requests.map((req, index) => (
                                                <Draggable key={req.id.toString()} draggableId={req.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Card 
                                                            className={`mb-2 border-0 shadow-sm ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                borderRadius: '8px',
                                                                cursor: 'grab'
                                                            }}
                                                        >
                                                            {isOverdue(req.scheduled_date) && req.status !== 'Repaired' && req.status !== 'Scrap' && (
                                                                <div className="bg-danger" style={{height: '4px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}></div>
                                                            )}
                                                            
                                                            <Card.Body className="p-3">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <Badge bg="light" text="secondary" className="border fw-normal">{req.type}</Badge>
                                                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>#{req.id}</small>
                                                                </div>
                                                                
                                                                <Card.Title className="h6 fw-bold mb-1 text-dark">{req.subject}</Card.Title>
                                                                <Card.Text className="text-secondary small mb-3">
                                                                    {req.equipment?.name}
                                                                </Card.Text>
                                                                
                                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                                    <div className="d-flex align-items-center text-muted">
                                                                        <FaClock size={12} className="me-1" />
                                                                        <small style={{fontSize: '0.75rem'}}>
                                                                            {req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString() : 'No Date'}
                                                                        </small>
                                                                    </div>
                                                                    
                                                                    <div className="d-flex align-items-center" title={req.technician?.name || "Unassigned"}>
                                                                        <small className="me-2 text-muted" style={{fontSize: '0.75rem'}}>
                                                                            {req.technician?.name ? req.technician.name.split(' ')[0] : 'Unassigned'}
                                                                        </small>
                                                                        {req.technician ? (
                                                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', fontSize: '10px'}}>
                                                                                {req.technician.name.charAt(0)}
                                                                            </div>
                                                                        ) : (
                                                                            <FaUserCircle size={20} className="text-muted opacity-50" />
                                                                        )}
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

            {/* Completion Modal */}
            <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Complete Maintenance</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCompleteSubmit}>
                    <Modal.Body>
                        <p className="text-muted small mb-4">
                            You are marking <strong>{completingReq?.subject}</strong> as repaired. 
                            Please record the duration spent on this task.
                        </p>
                        <Form.Group>
                            <Form.Label>Duration (Hours Spent)</Form.Label>
                            <Form.Control 
                                type="number" 
                                step="0.5" 
                                required 
                                autoFocus
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 1.5"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
                        <Button variant="success" type="submit">Confirm & Repair</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default KanbanBoard;
