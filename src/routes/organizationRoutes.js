const express = require("express");
const OrganizationController = require("../controllers/organizationController");
const auth = require("../middlewares/authMiddleware");

const router = express.Router();

// Route to create an organization
router.post(
  "/create",
  auth,
  OrganizationController.createOrganizationController
);

// Route to get all organizations
router.get("/", auth, OrganizationController.getAllOrganizationsController);

// Route to get an organization by ID
router.get("/:id", auth, OrganizationController.getOrganizationByIdController);

// Route to update an organization by ID
router.put("/:id", auth, OrganizationController.updateOrganizationController);

// Route to delete an organization by ID
router.delete(
  "/:id",
  auth,
  OrganizationController.deleteOrganizationController
);

// Disable an organization
router.put("/disable/:orgId", auth, OrganizationController.disableOrganization);

// Enable an organization
router.put("/enable/:orgId", auth, OrganizationController.enableOrganization);

module.exports = router;
