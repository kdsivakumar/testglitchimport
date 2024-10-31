const GitService = require("../services/gitService");
const UserService = require("../services/userService");
const { mergePackages } = require("../sync-packages");

exports.handleWebhook = async (req, res, next) => {
  try {
    // Extract data from the webhook payload
    const data = JSON.stringify(req.body);
    console.log(req.body.ref);
    // Save the data using UserService
    await GitService.logPayload(data);
    let pullResult;
    if (req.body.ref && req.body.ref == "refs/heads/master") {
      //await GitService.changeDirectory();
      // Perform Git operations
      // await GitService.fetch();
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
    if (error.message.includes("Failed to fetch")) {
      await GitService.pull();
    }
    if (
      error.message.includes("Failed to pull") ||
      error.message.includes("Failed to fetch")
    ) {
      await GitService.logPayload(error.message);
      mergePackages();
      await GitService.refresh();
      res.status(200).json({ message: "Code updated successfully" });
    } else {
      console.log(error);
      next(error); // Pass error to global error handling middleware
    }
  }
};

exports.refresh = async (req, res, next) => {
  try {
    await GitService.refresh();
    res.status(200).json({ message: "server restarting successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
