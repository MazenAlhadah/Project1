const { Book, Purchase } = require('../models');
const { cloudinary, generateSignedUrl, deleteFile } = require('../config/cloudinary');

/**
 * GET /api/books
 * قائمة الكتب (للجميع - بدون file_url)
 */
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'description', 'price', 'cover_image_url', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // إضافة معلومة هل الطالب اشترى الكتاب
    let booksWithPurchase = books;
    if (req.user && req.user.role === 'student') {
      const purchases = await Purchase.findAll({
        where: { user_id: req.user.id, status: 'confirmed' },
        attributes: ['book_id'],
      });
      const purchasedBookIds = purchases.map(p => p.book_id);

      booksWithPurchase = books.map(book => ({
        ...book.toJSON(),
        is_purchased: purchasedBookIds.includes(book.id),
      }));
    }

    res.json({ success: true, data: booksWithPurchase });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الكتب' });
  }
};

/**
 * GET /api/books/:id/read
 * الحصول على presigned URL للقراءة (فقط للطلاب الذين اشتروا الكتاب)
 */
exports.getReadUrl = async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من الشراء
    const purchase = await Purchase.findOne({
      where: { user_id: req.user.id, book_id: id, status: 'confirmed' },
    });

    if (!purchase) {
      return res.status(403).json({ success: false, message: 'لم تقم بشراء هذا الكتاب أو لم يتم تأكيد الدفع' });
    }

    const book = await Book.findByPk(id, {
      attributes: ['id', 'title', 'file_public_id'],
    });

    if (!book || !book.file_public_id) {
      return res.status(404).json({ success: false, message: 'الكتاب غير متاح حالياً' });
    }

    // توليد رابط مؤقت (15 دقيقة)
    const signedUrl = generateSignedUrl(book.file_public_id);

    res.json({
      success: true,
      data: {
        title: book.title,
        url: signedUrl,
        expires_in: 900, // ثانية
      },
    });
  } catch (error) {
    console.error('Get read URL error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
};

/**
 * POST /api/books
 * إضافة كتاب جديد (موظف/أدمن)
 */
exports.createBook = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    let cover_image_url = null;
    let cover_image_public_id = null;
    let file_url = null;
    let file_public_id = null;

    // معالجة الملفات المرفوعة
    if (req.files) {
      if (req.files.cover_image) {
        // رفع صورة الغلاف
        const coverResult = await cloudinary.uploader.upload(req.files.cover_image[0].buffer.toString('base64'), {
          folder: 'engineering-platform/books/covers',
          resource_type: 'image',
        });
        cover_image_url = coverResult.secure_url;
        cover_image_public_id = coverResult.public_id;
      }

      if (req.files.book_file) {
        // رفع ملف الكتاب كـ authenticated (خاص)
        const fileResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'engineering-platform/books/files',
              resource_type: 'raw',
              type: 'authenticated',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.files.book_file[0].buffer);
        });
        file_url = fileResult.secure_url;
        file_public_id = fileResult.public_id;
      }
    }

    const book = await Book.create({
      title,
      description,
      price: parseFloat(price),
      cover_image_url,
      cover_image_public_id,
      file_url,
      file_public_id,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة الكتاب بنجاح',
      data: book,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في إضافة الكتاب' });
  }
};

/**
 * GET /api/books/all
 * قائمة كل الكتب للموظف (بما فيها غير المفعلة)
 */
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      attributes: { exclude: ['file_url', 'file_public_id'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
};

/**
 * PUT /api/books/:id
 * تعديل كتاب
 */
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'الكتاب غير موجود' });
    }

    const { title, description, price, is_active } = req.body;

    let updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    // تحديث صورة الغلاف إن وُجدت
    if (req.files && req.files.cover_image) {
      if (book.cover_image_public_id) {
        await deleteFile(book.cover_image_public_id, 'image').catch(() => {});
      }
      const coverResult = await cloudinary.uploader.upload(
        `data:${req.files.cover_image[0].mimetype};base64,${req.files.cover_image[0].buffer.toString('base64')}`,
        { folder: 'engineering-platform/books/covers', resource_type: 'image' }
      );
      updateData.cover_image_url = coverResult.secure_url;
      updateData.cover_image_public_id = coverResult.public_id;
    }

    // تحديث ملف الكتاب إن وُجد
    if (req.files && req.files.book_file) {
      if (book.file_public_id) {
        await deleteFile(book.file_public_id, 'raw').catch(() => {});
      }
      const fileResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'engineering-platform/books/files', resource_type: 'raw', type: 'authenticated' },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        uploadStream.end(req.files.book_file[0].buffer);
      });
      updateData.file_url = fileResult.secure_url;
      updateData.file_public_id = fileResult.public_id;
    }

    await book.update(updateData);

    res.json({ success: true, message: 'تم تحديث الكتاب بنجاح', data: book });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تحديث الكتاب' });
  }
};

/**
 * DELETE /api/books/:id
 * حذف كتاب
 */
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'الكتاب غير موجود' });
    }

    // حذف الملفات من Cloudinary
    if (book.cover_image_public_id) {
      await deleteFile(book.cover_image_public_id, 'image').catch(() => {});
    }
    if (book.file_public_id) {
      await deleteFile(book.file_public_id, 'raw').catch(() => {});
    }

    await book.destroy();
    res.json({ success: true, message: 'تم حذف الكتاب بنجاح' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في حذف الكتاب' });
  }
};
