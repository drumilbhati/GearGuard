// Get all requests
exports.getAllRequests = (req, res) => {
  res.status(200).json({ message: 'Get all requests' });
};

// Get single request
exports.getRequestById = (req, res) => {
  res.status(200).json({ message: `Get request with ID ${req.params.id}` });
};

// Create new request
exports.createRequest = (req, res) => {
  res.status(201).json({ message: 'Create new request', data: req.body });
};

// Update request
exports.updateRequest = (req, res) => {
  res.status(200).json({ message: `Update request with ID ${req.params.id}`, data: req.body });
};

// Delete request
exports.deleteRequest = (req, res) => {
  res.status(200).json({ message: `Delete request with ID ${req.params.id}` });
};
