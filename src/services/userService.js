const User = require("../models/userModel");
const UserDetails = require("../models/userDetails");

class UserService {
  async createUser(username, password) {
    const user = new User({ username, password });
    await user.save();
    return user;
  }

  async findUserByUsername(username) {
    return await User.findOne({ username });
  }

  async findUserById(id) {
    return User.findById(id);
  }

  async getAllUsers() {
    return User.find();
  }

  async updateUserById(id, updates) {
    // const pass = await bcrypt.hash(updates.password, 10);
    // console.log(pass);
    // return User.findByIdAndUpdate(id, { password: pass }, { new: true });
  }

  async deleteUserById(id) {
    return User.findByIdAndDelete(id);
  }

  //user details
  async createUserDetails(userId, details) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User Details not found");
    const existingUser = await this.findUserDetailsById(userId);
    if (existingUser) throw new Error("User Details already exists");
    const userDetails = new UserDetails({ userId, details });
    await userDetails.save();
    return userDetails;
  }

  async findUserDetailsById(id) {
    return await UserDetails.findOne({ userId: id });
  }

  async getAllUserDetails() {
    return await UserDetails.find();
  }

  async deleteUserDetailsById(id) {
    return UserDetails.findByIdAndDelete(id);
  }

  async updateUserDetailsById(userId, updates) {
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
    const userDetails = await UserDetails.findOne({ userId });

    if (!userDetails) {
      throw new Error("User details not found");
    }

    // Step 2: Update the fields in the existing document
    for (const key in updates) {
      userDetails.details[key] = updates[key]; // Update existing fields or add new ones
    }

    // Save the updated document
    return await userDetails.save();
  }
}

module.exports = new UserService();
