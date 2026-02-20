// server/src/controllers/adminTestController.js
const Test = require("../models/Test");
const { TestTemplateSchema } = require("../validations/testTemplateSchema");

/**
 * POST /admin/tests
 * Body: test template JSON
 *
 * Rules:
 * - Validate schema strictly
 * - metadata.id must be unique
 * - createdBy set to admin user id
 */
async function createTest(req, res, next) {
  try {
    // Validate incoming JSON
    const payload = TestTemplateSchema.parse(req.body);

    // Prevent duplicates by metadata.id
    const exists = await Test.findOne({ "metadata.id": payload.metadata.id });
    if (exists) {
      return res.status(409).json({
        ok: false,
        error: `Test with metadata.id '${payload.metadata.id}' already exists`
      });
    }

    const doc = await Test.create({
      metadata: payload.metadata,
      config: payload.config || {},
      sections: payload.sections,
      createdBy: req.user.id,
      isActive: true
    });

    return res.status(201).json({
      ok: true,
      message: "Test created successfully",
      test: {
        id: doc._id,
        metadata: doc.metadata,
        isActive: doc.isActive,
        createdAt: doc.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /admin/tests
 * Query filters (optional):
 * - active=true/false
 * - practice=true/false
 * - category=...
 * - difficulty=easy|medium|hard
 */
async function listTests(req, res, next) {
  try {
    const { active, practice, category, difficulty } = req.query;

    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (practice === "true") filter["metadata.isPractice"] = true;
    if (practice === "false") filter["metadata.isPractice"] = false;

    if (category) filter["metadata.category"] = String(category);
    if (difficulty) filter["metadata.difficulty"] = String(difficulty);

    const tests = await Test.find(filter)
      .sort({ createdAt: -1 })
      .select("metadata isActive createdBy createdAt updatedAt");

    return res.json({ ok: true, tests });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /admin/tests/:id/toggle
 * Toggle isActive (soft disable)
 */
async function toggleTestActive(req, res, next) {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ ok: false, error: "Test not found" });

    test.isActive = !test.isActive;
    await test.save();

    return res.json({
      ok: true,
      message: `Test is now ${test.isActive ? "ACTIVE" : "INACTIVE"}`,
      test: { id: test._id, isActive: test.isActive }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTest,
  listTests,
  toggleTestActive
};
