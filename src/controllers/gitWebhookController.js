const GitService = require("../services/gitService");
const UserService = require("../services/userService");

exports.handleWebhook = async (req, res, next) => {
  try {
    // Extract data from the webhook payload
    const data = req.body;

    // Save the data using UserService
    await GitService.logPayload(data);

    // Perform Git operations
    await GitService.fetch();
    const currentBranch = await GitService.getCurrentBranch();

    if (currentBranch !== "master") {
      return res
        .status(200)
        .json({ message: `Current branch is ${currentBranch}, not master` });
    }

    const pullResult = await GitService.pull();
    res
      .status(200)
      .json({ message: "Code updated successfully", details: pullResult });
  } catch (error) {
    next(error); // Pass error to global error handling middleware
  }
};
