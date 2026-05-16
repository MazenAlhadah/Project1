const { Course } = require('../models');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: courses });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    let cover_image_url = null, cover_image_public_id = null;
    if (req.file) { cover_image_url = req.file.path; cover_image_public_id = req.file.filename; }
    const course = await Course.create({ title, description, cover_image_url, cover_image_public_id });
    res.status(201).json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};
