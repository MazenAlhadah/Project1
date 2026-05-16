const { Settings } = require('../models');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findByPk(1);
    if (!settings) {
      settings = await Settings.create({
        id: 1,
        whatsapp_number: process.env.WHATSAPP_NUMBER || '',
        support_phone: process.env.SUPPORT_PHONE || '',
        support_email: process.env.SUPPORT_EMAIL || '',
        platform_name: process.env.PLATFORM_NAME || 'منصة معادلات الهندسة',
      });
    }
    res.json({ success: true, data: settings });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const { whatsapp_number, support_phone, support_email, platform_name } = req.body;
    const [settings] = await Settings.upsert({ id: 1, whatsapp_number, support_phone, support_email, platform_name });
    res.json({ success: true, message: 'تم تحديث الإعدادات', data: settings });
  } catch (e) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};
