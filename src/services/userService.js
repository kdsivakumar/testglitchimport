const User = require("../models/userModel");
const UserDetails = require("../models/userDetails");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Group = require("../models/Group");
const organizationService = require("./organizationService");
const RoleEnum = require("../config/roleEnum");
class UserService {
  // Enum definition for status values
  StatusEnum = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
  });

  async createUser(
    username,
    password,
    name,
    role,
    organizationId,
    status = "active"
  ) {
    const user = new User({
      username,
      password,
      name,
      role,
      organizationId,
      status,
    });
    await user.save();
    await this.createUserDetails(
      user.id,
      { name: name, username, role },
      organizationId
    );
    return user;
  }

  async findUserByUsername(username, organizationId) {
    return await User.findOne({ username, organizationId });
  }

  async findUserById(id, orgId) {
    if (orgId) {
      return await User.findOne({ _id: id, organizationId: orgId });
    } else {
      return await User.findById(id);
    }
  }

  async getAllUsers(organizationId) {
    // If organizationId is provided, fetch users for that organization
    if (organizationId) {
      return User.find({ organizationId });
    }
    // If no organizationId is provided, fetch all users
    return User.find();
  }

  async updateUserById(id, name, role, orgId) {
    const user = await this.findUserById(id, orgId);
    if (!user) {
      throw new Error("User not found");
    }
    console.log(user, role, orgId);

    if (name) user.name = name;
    if (role && (RoleEnum.ADMIN === role || RoleEnum.USER === role)) {
      user.role = role;
    } else if (role) {
      throw new Error("Invalid role");
    }
    return await user.save();
    // const pass = await bcrypt.hash(updates.password, 10);
    // console.log(pass);
    // return User.findByIdAndUpdate(id, { password: pass }, { new: true });
  }

  async updateUsers() {
    try {
      const org = await organizationService.getOrganizationByName(
        "Root Organization"
      );
      console.log(org);
      if (org.id) {
        // Update documents with missing fields
        const result = await User.updateMany(
          {
            $or: [
              { organizationId: { $exists: false } },
              { role: { $exists: false } },
              { status: { $exists: false } },
            ],
          }, // Find users missing any of these fields
          {
            $set: {
              organizationId: new mongoose.Types.ObjectId(`${org.id}`), // Default orgId
              role: "admin", // Default role
              status: "active", // Default status
            },
          }
        );

        const userDetailsResult = await UserDetails.updateMany(
          {
            $or: [
              { organizationId: { $exists: false } },
              { status: { $exists: false } },
              { role: { $exists: false } },
            ],
          },
          {
            $set: {
              organizationId: new mongoose.Types.ObjectId(`${org.id}`), // Default organizationId
              status: "active", // Default status
              role: "admin", // Default role
            },
          }
        );
        console.log(
          `${userDetailsResult.nModified} UserDetails documents were updated.`
        );

        // Update Message - Ensure organizationId is present
        const messageResult = await Message.updateMany(
          { organizationId: { $exists: false } },
          {
            $set: {
              organizationId: new mongoose.Types.ObjectId(`${org.id}`), // Default organizationId
            },
          }
        );
        console.log(
          `${messageResult.nModified} Message documents were updated.`
        );

        // Update Group - Ensure organizationId is present
        const groupResult = await Group.updateMany(
          { organizationId: { $exists: false } },
          {
            $set: {
              organizationId: new mongoose.Types.ObjectId(`${org.id}`), // Default organizationId
            },
          }
        );
        console.log(`${groupResult.nModified} Group documents were updated.`);

        console.log(`${result.nModified} users were updated.`);
        return { success: "data updated" };
      }
    } catch (err) {
      console.error("Error updating users:", err);
    }
  }

  async deleteUserById(id, organizationId) {
    return await User.findOneAndDelete({ _id: id, organizationId });
  }

  async deleteUsersByOrgId(orgId) {
    return await User.deleteMany({ organizationId: orgId });
  }

  async reassignOrgUsers(orgId, newOrgId) {
    await UserDetails.updateMany(
      { organizationId: orgId },
      { organizationId: newOrgId }
    );
  }

  async updateStatus(status, orgId) {
    // Ensure the status passed is valid and part of the StatusEnum
    if (!Object.values(this.StatusEnum).includes(status)) {
      throw new Error(
        `Invalid status: ${status}. Valid statuses are: ${Object.values(
          StatusEnum
        ).join(", ")}`
      );
    }
    // Perform the database update using the validated status
    try {
      const result = await User.updateMany(
        { organizationId: orgId },
        { status }
      );
      return result;
    } catch (error) {
      console.error("Error updating status:", error);
      throw new Error("Failed to update status");
    }
  }

  //user details
  async createUserDetails(userId, details, organizationId) {
    const user = await User.findOne({ _id: userId, organizationId });
    if (!user) throw new Error("User Details not found");
    const existingUser = await this.findUserDetailsById(userId, organizationId);
    if (existingUser) throw new Error("User Details already exists");
    const userDetails = new UserDetails({ userId, details, organizationId });
    userDetails.details["name"] = user.name;
    await userDetails.save();
    return userDetails;
  }

  async findUserDetailsById(id, organizationId) {
    if (organizationId) {
      return await UserDetails.findOne({ userId: id, organizationId });
    } else {
      return await UserDetails.findOne({ userId: id });
    }
  }

  async getAllUserDetails(organizationId, skip, limit, name) {
    let totalCount;
    let userDetails;
    let query = {}; // Define the base query

    // Filter by organizationId if provided
    if (organizationId) {
      query.organizationId = organizationId;
    }

    // Filter by name if provided (searching inside details.name)
    if (name) {
      query["details.name"] = { $regex: new RegExp(name, "i") }; // Case-insensitive search
    }

    // Get the total count of matching documents
    totalCount = await UserDetails.countDocuments(query);

    // Fetch the filtered user details with pagination
    userDetails = await UserDetails.find(query).skip(skip).limit(limit).exec();

    return { userDetails, totalCount };
  }

  async deleteUserDetailsById(id, organizationId) {
    return await UserDetails.deleteOne({ userId: id, organizationId });
  }

  async deleteUsersDetailsByOrgId(orgId) {
    return await UserDetails.deleteMany({ organizationId: orgId });
  }

  async reassignOrgUsersDetails(orgId, newOrgId) {
    await UserDetails.updateMany(
      { organizationId: orgId },
      { organizationId: newOrgId }
    );
  }

  async updateUserDetailsById(userId, updates, organizationId) {
    // // Construct the update object dynamically
    // const updateObject = {};
    // // Iterate over the keys in the updates and build the update object
    // for (const key in updates) {
    //   updateObject[`details.${key}`] = updates[key];
    // }

    // return await UserDetails.findOneAndUpdate(
    //   { userId },
    //   { $set: updateObject },
    //   { new: true, runValidators: true }
    // );
    // Step 1: Find the existing user details
    const userDetails = await UserDetails.findOne({ userId, organizationId });

    if (!userDetails) {
      throw new Error("User details not found");
    }

    let user;
    if (updates.name || updates.role || updates.username) {
      user = await this.updateUserById(
        userId,
        updates.name || userDetails.details["name"],
        updates.role || userDetails.details["role"],
        organizationId
      );
    } else {
      user = await this.findUserById(userId, organizationId);
    }

    // Step 2: Update the fields in the existing document
    for (const key in updates) {
      userDetails.details[key] = updates[key]; // Update existing fields or add new ones
    }

    userDetails.details["name"] = user.name;
    userDetails.details["role"] = user.role;
    userDetails.details["username"] = user.username;

    // Manually mark the details field as modified
    userDetails.markModified("details");
    // Save the updated document
    return await userDetails.save();
  }
}

module.exports = new UserService();
