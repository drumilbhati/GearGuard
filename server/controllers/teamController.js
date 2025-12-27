// Get all teams
exports.getAllTeams = (req, res) => {
  res.status(200).json({ message: 'Get all teams' });
};

// Get single team
exports.getTeamById = (req, res) => {
  res.status(200).json({ message: `Get team with ID ${req.params.id}` });
};

// Create new team
exports.createTeam = (req, res) => {
  res.status(201).json({ message: 'Create new team', data: req.body });
};

// Update team
exports.updateTeam = (req, res) => {
  res.status(200).json({ message: `Update team with ID ${req.params.id}`, data: req.body });
};

// Delete team
exports.deleteTeam = (req, res) => {
  res.status(200).json({ message: `Delete team with ID ${req.params.id}` });
};
