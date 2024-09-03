const GitService = require("../services/gitService");
const UserService = require("../services/userService");

exports.handleWebhook = async (req, res, next) => {
  try {
    // Extract data from the webhook payload
    const data = JSON.stringify(req.body);
    console.log(req.body.ref);
    // Save the data using UserService
    await GitService.logPayload(data);
    let pullResult;
    if (req.body.ref && req.body.ref == "refs/heads/master") {
      await GitService.changeDirectory();
      // Perform Git operations
      await GitService.fetch();
      const currentBranch = await GitService.getCurrentBranch();

      if (currentBranch !== "master") {
        return res
          .status(200)
          .json({ message: `Current branch is ${currentBranch}, not master` });
      }

      pullResult = await GitService.pull();
    }
    res
      .status(200)
      .json({ message: "Code updated successfully", details: pullResult });
  } catch (error) {
    if (error.message.includes("Failed to pull")) {
      await GitService.logPayload(error.message);
      await GitService.refresh();
      res.status(200).json({ message: "Code updated successfully" });
    } else {
      next(error); // Pass error to global error handling middleware
    }
  }
};
