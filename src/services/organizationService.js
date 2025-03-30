const Organization = require("../models/organizationModel"); // Import the model
const chatService = require("./chatService");
require("dotenv").config();

class OrganizationService {
  // Create a new organization
  async createOrganization({ name, address, phone, domain, active = true }) {
    try {
      const organization = new Organization({
        name,
        address,
        phone,
        active,
        domain,
      });
      const org = await organization.save(); // Save the organization to the DB
      let user;
      if (org.name !== "Root Organization") {
        const userService = require("./userService");

        user = await userService.createUser(
          "rootUser",
          "admin@Password",
          "admin",
          "admin",
          org.id
        );
      }
      return { org, user };
    } catch (error) {
      throw new Error(`Error creating organization: ${error.message}`);
    }
  }

  // Get all organizations
  async getAllOrganizations() {
    try {
      const organizations = await Organization.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "organizationId",
            as: "users",
          },
        },
        {
          $project: {
            _id: 0, // Remove `_id` explicitly
            id: "$_id", // Convert `_id` to `id`
            name: 1,
            address: 1,
            phone: 1,
            domain: 1,
            active: 1,
            createdAt: 1,
            updatedAt: 1,
            userCount: { $size: "$users" },
            users: {
              $cond: {
                if: { $lte: [{ $size: "$users" }, 10] },
                then: "$users",
                else: {
                  $concatArrays: [
                    { $slice: ["$users", 6] },
                    { $slice: ["$users", -4] },
                  ],
                },
              },
            },
          },
        },
      ]);

      return organizations.map((org) => ({
        ...org,
        users: org.users.map((user) => ({
          id: user._id, // Convert `_id` to `id`
          name: user.name,
        })),
      }));

      //return await Organization.find(); // Query all organizations from DB
    } catch (error) {
      throw new Error(`Error fetching organizations: ${error.message}`);
    }
  }

  // Get an organization by its ID
  async getOrganizationById(id) {
    try {
      return await Organization.findById(id); // Find an organization by ID
    } catch (error) {
      throw new Error(`Error fetching organization: ${error.message}`);
    }
  }

  async getOrganization(criteria) {
    try {
      // Check if criteria is not empty
      if (Object.keys(criteria).length === 0) {
        throw new Error("No criteria provided");
      }

      // Use find method with the dynamic criteria
      const result = await Organization.findOne(criteria); // Find all organizations matching the criteria

      // Return results
      return result;
    } catch (error) {
      throw new Error(`Error fetching organization: ${error.message}`);
    }
  }

  // Get an organization by its name
  async getOrganizationByName(name) {
    try {
      return await Organization.findOne({ name }); // Find an organization by name
    } catch (error) {
      throw new Error(`Error fetching organization by name: ${error.message}`);
    }
  }

  // Update an organization by ID
  async updateOrganizationById(id, { name, address, phone, domain, active }) {
    try {
      return await Organization.findByIdAndUpdate(
        id,
        { name, address, phone, domain, active },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating organization: ${error.message}`);
    }
  }

  // Delete an organization by ID
  async deleteOrganizationById(id, deleteAll) {
    try {
      if (deleteAll) {
        // Delete users associated with the organization
        await this.deleteAllDataByOrgId(id);
      }
      return await Organization.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error deleting organization: ${error.message}`);
    }
  }

  async deleteAllDataByOrgId(id) {
    const userService = require("./userService");

    await userService.deleteUsersDetailsByOrgId(id);
    await userService.deleteUsersByOrgId(id);
    await chatService.deleteGroupsByOrgId(id);
    await chatService.deleteMessagesByOrgId(id);
  }
  // Method to disable the organization and its users
  async disableOrganization(orgId) {
    try {
      // Disable the organization by setting 'active' to false
      const organization = await Organization.findByIdAndUpdate(
        orgId,
        { active: false },
        { new: true }
      );

      if (!organization) {
        throw new Error("Organization not found");
      }
      // Lazy load userService inside the function to avoid circular import
      const userService = require("./userService");
      // Disable all users in this organization (set status to 'inactive')
      await userService.updateStatus("inactive", orgId);
      console.log("Organization and users disabled");
      return organization;
    } catch (error) {
      console.error("Error disabling organization and users:", error);
      throw new Error(
        `Error disabling organization and users:: ${error.message}`
      );
    }
  }

  // Method to enable the organization and its users
  async enableOrganization(orgId) {
    try {
      // Disable the organization by setting 'active' to false
      const organization = await Organization.findByIdAndUpdate(
        orgId,
        { active: true },
        { new: true }
      );

      if (!organization) {
        throw new Error("Organization not found");
      }

      const userService = require("./userService");
      // Disable all users in this organization (set status to 'active')
      await userService.updateStatus("active", orgId);
      console.log("Organization and users enable");
      return organization;
    } catch (error) {
      console.error("Error enable organization and users:", error);
      throw new Error(`Error enable organization and users:${error.message}`);
    }
  }

  async reassignData(orgId, newOrgId) {
    try {
      // Reassign all users in this organization to a new organization
      await userService.reassignOrgUsersDetails(orgId, newOrgId);
      await userService.reassignOrgUsers(orgId, newOrgId);
      await chatService.reassignOrgGroups(orgId, newOrgId);
      await chatService.reassignOrgMessages(orgId, newOrgId);
      console.log("Users reassigned");
    } catch (error) {
      console.error("Error reassigning users:", error);
    }
  }

  async ensureRootOrganization() {
    try {
      const rootOrg = await this.getOrganizationByName("Root Organization");

      if (!rootOrg) {
        const port = process.env.PORT || 3000;
        // If the Root Organization does not exist, create it
        const rootOrganizationData = {
          name: "Root Organization", // Static name for root org
          address: "123 Main St, Root City", // Example address
          phone: "123-456-7890", // Example phone number
          domain: `http://${this.getIPAddress()}:${port}`,
          active: true,
        };

        console.log("Root Organization created");
        const org = await this.createOrganization(rootOrganizationData);
        return org.org;
      } else {
        console.log("Root Organization already exists");
        return rootOrg;
      }
    } catch (error) {
      console.error("Error checking or creating Root Organization:", error);
      throw new Error("Error checking or creating Root Organization:", error);
    }
  }

  getIPAddress() {
    const os = require("os");
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = "localhost"; // Default to localhost

    // Iterate through the network interfaces to find the first non-internal IP
    for (let interfaceName in networkInterfaces) {
      for (let interfaceDetails of networkInterfaces[interfaceName]) {
        if (interfaceDetails.family === "IPv4" && !interfaceDetails.internal) {
          ipAddress = interfaceDetails.address;
          break;
        }
      }
    }

    return ipAddress;
  }
}

module.exports = new OrganizationService(); // Export the service instance
