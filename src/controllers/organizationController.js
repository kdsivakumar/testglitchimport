const OrganizationService = require("../services/organizationService");

class OrganizationController {
  // Create a new organization
  async createOrganizationController(req, res) {
    try {
      const { name, address, phone, domain } = req.body;
      const organization = await OrganizationService.createOrganization({
        name,
        address,
        phone,
        domain,
      });
      res.status(201).json({ message: "Organization created", organization });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all organizations
  async getAllOrganizationsController(req, res) {
    try {
      const organizations = await OrganizationService.getAllOrganizations();
      res.status(200).json(organizations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get a single organization by ID
  async getOrganizationByIdController(req, res) {
    try {
      const { id } = req.params;
      const organization = await OrganizationService.getOrganizationById(id);
      res.status(200).json(organization);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Update an organization by ID
  async updateOrganizationController(req, res) {
    try {
      const { id } = req.params;
      const { name, address, phone, domain } = req.body;
      const updatedOrganization =
        await OrganizationService.updateOrganizationById(id, {
          name,
          address,
          phone,
          domain,
        });
      res.status(200).json(updatedOrganization);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Delete an organization by ID
  async deleteOrganizationController(req, res) {
    try {
      const { id } = req.params;
      const { deleteAll } = req.query;
      const org = await OrganizationService.deleteOrganizationById(
        id,
        deleteAll
      );
      if (!org)
        return res.status(404).json({ message: "Organization not found" });
      res.status(200).json({ message: "Organization deleted", org });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async disableOrganization(req, res) {
    try {
      const { orgId } = req.params;
      await OrganizationService.disableOrganization(orgId);
      res
        .status(200)
        .json({ message: "Organization and users have been disabled." });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async enableOrganization(req, res) {
    try {
      const { orgId } = req.params;
      await OrganizationService.enableOrganization(orgId);
      res
        .status(200)
        .json({ message: "Organization and users have been enable." });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new OrganizationController(); // Export the controller instance
