const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const { sendApprovalEmail, sendRejectionEmail, sendTempPasswordEmail } = require('../services/emailService');
const { deleteFile } = require('../config/cloudinary');

const fullName = (u) => `${u.first_name} ${u.second_name} ${u.third_name} ${u.fourth_name}`;

// GET /api/users — قائمة الطلاب
exports.getStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: students });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// GET /api/users/pending — طلبات الانضمام
exports.getPendingStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student', status: 'pending' },
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: students });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/users/:id/approve — قبول طالب
exports.approveStudent = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    if (user.status !== 'pending') return res.status(400).json({ success: false, message: 'الطالب ليس في حالة انتظار' });
    await user.update({ status: 'active' });
    if (user.email) sendApprovalEmail(user.email, fullName(user)).catch(console.error);
    res.json({ success: true, message: 'تم قبول الطالب وإرسال إيميل تأكيد' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/users/:id/reject — رفض طالب
exports.rejectStudent = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    await user.update({ status: 'rejected' });
    if (user.email) sendRejectionEmail(user.email, fullName(user)).catch(console.error);
    res.json({ success: true, message: 'تم رفض الطالب' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/users/:id/reset-password — إعادة تعيين كلمة السر (موظف/أدمن)
exports.resetStudentPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
    const password_hash = await bcrypt.hash(tempPassword, 12);
    await user.update({ password_hash });
    await RefreshToken.update({ revoked: true }, { where: { user_id: user.id } });
    if (user.email) sendTempPasswordEmail(user.email, fullName(user), tempPassword).catch(console.error);
    res.json({ success: true, message: 'تم إعادة تعيين كلمة السر وإرسالها للطالب', data: { temp_password: tempPassword } });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// DELETE /api/users/:id — حذف طالب (موظف/أدمن)
exports.deleteStudent = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    await user.destroy();
    res.json({ success: true, message: 'تم حذف الطالب نهائياً' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/users/:id/reactivate — إلغاء تعليق وتفعيل طالب
exports.reactivateStudent = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    await user.update({ status: 'active' });
    res.json({ success: true, message: 'تم إلغاء التعليق وتفعيل الحساب' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// GET /api/employees — قائمة الموظفين (أدمن)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: { exclude: ['password_hash', 'id_card_image_url', 'id_card_public_id'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: employees });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// POST /api/employees — إضافة موظف (أدمن)
exports.createEmployee = async (req, res) => {
  try {
    const { first_name, second_name, third_name, fourth_name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    const password_hash = await bcrypt.hash(password, 12);
    const employee = await User.create({ first_name, second_name, third_name: third_name || '-', fourth_name: fourth_name || '-', email, password_hash, role: 'employee', status: 'active' });
    res.status(201).json({ success: true, message: 'تم إضافة الموظف بنجاح', data: { id: employee.id, email: employee.email } });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/employees/:id — تعديل موظف (أدمن)
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ where: { id: req.params.id, role: 'employee' } });
    if (!employee) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const { first_name, second_name, third_name, fourth_name, email, password } = req.body;
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (second_name) updateData.second_name = second_name;
    if (third_name) updateData.third_name = third_name;
    if (fourth_name) updateData.fourth_name = fourth_name;
    if (email) updateData.email = email;
    if (password) updateData.password_hash = await bcrypt.hash(password, 12);
    await employee.update(updateData);
    res.json({ success: true, message: 'تم تحديث بيانات الموظف' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// DELETE /api/employees/:id — حذف موظف (أدمن)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ where: { id: req.params.id, role: 'employee' } });
    if (!employee) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    await employee.destroy();
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// GET /api/admins — قائمة الأدمنز (أدمن)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: { exclude: ['password_hash', 'id_card_image_url', 'id_card_public_id'] },
    });
    res.json({ success: true, data: admins });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// POST /api/admins — إضافة أدمن (أدمن)
exports.createAdmin = async (req, res) => {
  try {
    const { first_name, second_name, third_name, fourth_name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    const password_hash = await bcrypt.hash(password, 12);
    const admin = await User.create({ first_name, second_name, third_name: third_name || '-', fourth_name: fourth_name || '-', email, password_hash, role: 'admin', status: 'active' });
    res.status(201).json({ success: true, message: 'تم إضافة الأدمن بنجاح', data: { id: admin.id } });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// DELETE /api/admins/:id — حذف أدمن (لا يحذف نفسه)
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
    const admin = await User.findOne({ where: { id: req.params.id, role: 'admin' } });
    if (!admin) return res.status(404).json({ success: false, message: 'الأدمن غير موجود' });
    await admin.destroy();
    res.json({ success: true, message: 'تم حذف الأدمن' });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};
