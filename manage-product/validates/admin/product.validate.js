// TODO: CÓ THỂ XÓA - FILE NÀY KHÔNG LIÊN QUAN ĐẾN KHÓA HỌC
// module.exports.createPost = (req,res,next)=>{
//     if(!req.body.title){
//         req.flash("error", "Tao moi thành công 1 bản ghi!");
//         res.redirect("back");
//         return;
//     }
//     next();
// }

// Commented out for course project - no longer needed
module.exports.createPost = (req,res,next)=>{
    next();
}