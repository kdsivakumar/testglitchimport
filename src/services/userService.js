const User = require("../models/userModel");

class UserService {
  async createUser(username, password) {
    const user = new User({ username, password });
    await user.save();
    return user;
  }

  async findUserByUsername(username) {
    return User.findOne({ username });
  }

  async findUserById(id) {
    return User.findById(id);
  }

  async getAllUsers() {
    return User.find();
  }

  async updateUserById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUserById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserService();
