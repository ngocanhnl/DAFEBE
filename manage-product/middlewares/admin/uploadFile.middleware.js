const uploadFileToCloudinary = require("../../helper/uploadFileToCloudinary");

// module.exports.uploadFile = async (req, res, next) => {
//     if (req.file) {
//         try {
//             // Kiểm tra kích thước file (10MB)
//             const maxSize = 10 * 1024 * 1024; // 10MB
//             if (req.file.size > maxSize) {
//                 req.flash('error', 'File quá lớn. Kích thước tối đa là 10MB');
//                 return res.redirect('back');
//             }

//             // Kiểm tra loại file
//             const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//             if (!allowedTypes.includes(req.file.mimetype)) {
//                 req.flash('error', 'Chỉ chấp nhận file PDF, DOC, DOCX');
//                 return res.redirect('back');
//             }

//             // Xác định resource type dựa trên mimetype
//             let resourceType = 'raw';
            
//             const result = await uploadFileToCloudinary(req.file.buffer, resourceType);
            
//             // Thêm thông tin file gốc
//             result.original_name = req.file.originalname;
            
//             req.body[req.file.fieldname] = result;
//         } catch (error) {
//             console.error('Error uploading file:', error);
//             req.flash('error', 'Có lỗi xảy ra khi upload file');
//             return res.redirect('back');
//         }
//     }
//     next();
// };
module.exports.uploadFile = async (req, res, next) => {
  if (req.file) {
    try {
      // Kiểm tra kích thước file (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (req.file.size > maxSize) {
        req.flash("error", "File quá lớn. Kích thước tối đa là 10MB");
        return res.redirect("back");
      }

      // Kiểm tra loại file
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        req.flash("error", "Chỉ chấp nhận file PDF, DOC, DOCX");
        return res.redirect("back");
      }

      // Upload lên Cloudinary (raw)
      const result = await uploadFileToCloudinary(req.file.buffer, "raw");
      
      // Lưu object file đúng cấu trúc cần thiết
      req.lessonFile = {
        url: result.url,
        public_id: result.public_id,
        format: req.file.mimetype,
        size: req.file.size,
        extension: req.file.originalname.split('.').pop(),
        original_name: req.file.originalname,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      req.flash("error", "Có lỗi xảy ra khi upload file");
      return res.redirect("back");
    }
  }
  next();
};