// Get all equipment
exports.getAllEquipment = (req, res) => {
  res.status(200).json({ message: 'Get all equipment' });
};

// Get single equipment
exports.getEquipmentById = (req, res) => {
  res.status(200).json({ message: `Get equipment with ID ${req.params.id}` });
};

// Create new equipment
exports.createEquipment = (req, res) => {
  res.status(201).json({ message: 'Create new equipment', data: req.body });
};

// Update equipment
exports.updateEquipment = (req, res) => {
  res.status(200).json({ message: `Update equipment with ID ${req.params.id}`, data: req.body });
};

// Delete equipment
exports.deleteEquipment = (req, res) => {
  res.status(200).json({ message: `Delete equipment with ID ${req.params.id}` });
};
