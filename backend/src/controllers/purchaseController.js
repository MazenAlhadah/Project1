const { Purchase, Book, User } = require('../models');

exports.requestPurchase = async (req, res) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;
    const book = await Book.findByPk(book_id);
    if (!book || !book.is_active) return res.status(404).json({ success: false, message: 'الكتاب غير موجود' });
    const existing = await Purchase.findOne({ where: { user_id, book_id, status: ['pending', 'confirmed'] } });
    if (existing) return res.status(409).json({ success: false, message: existing.status === 'confirmed' ? 'اشتريت هذا الكتاب بالفعل' : 'طلبك قيد المراجعة بالفعل' });
    const purchase = await Purchase.create({ user_id, book_id, status: 'pending' });
    res.status(201).json({ success: true, message: 'تم إرسال طلب الشراء. تواصل مع أحد الموظفين لإتمام الدفع.', data: { id: purchase.id, status: purchase.status } });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image_url', 'price'] }],
      order: [['requested_at', 'DESC']],
    });
    res.json({ success: true, data: purchases });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.getPendingPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'second_name', 'third_name', 'fourth_name', 'email', 'national_id'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'price', 'cover_image_url'] },
      ],
      order: [['requested_at', 'ASC']],
    });
    res.json({ success: true, data: purchases });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'second_name', 'email', 'national_id'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'price'] },
        { model: User, as: 'confirmedBy', attributes: ['id', 'first_name', 'second_name'] },
      ],
      order: [['requested_at', 'DESC']],
    });
    res.json({ success: true, data: purchases });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.confirmPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    if (purchase.status !== 'pending') return res.status(400).json({ success: false, message: 'الطلب ليس في حالة انتظار' });
    await purchase.update({ status: 'confirmed', confirmed_at: new Date(), confirmed_by: req.user.id });
    res.json({ success: true, message: 'تم تأكيد الدفع وفتح الكتاب للطالب' });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};

exports.rejectPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    await purchase.update({ status: 'rejected' });
    res.json({ success: true, message: 'تم رفض الطلب' });
  } catch (error) { res.status(500).json({ success: false, message: 'حدث خطأ' }); }
};
